import React, { useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Navigation,
  Search,
  Star,
  ChevronDown,
  MapPin,
  Compass,
  Map,
  SlidersHorizontal,
  Send,
  Sprout,
  Bell,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Shadows } from "../../../src/constants/colors";
import { Fonts } from "../../../src/constants/fonts";
import { useAuthStore } from "../../../src/stores/authStore";
import { useNotificationStore } from "../../../src/stores/notificationStore";
import { useMapDiscovery, type MapGroup } from "../../../src/hooks/useMapDiscovery";
import { formatDistance } from "../../../src/lib/geo";
import { GroupDetailSheet } from "../../../src/components/map/GroupDetailSheet";
import {
  FilterDrawer,
  DEFAULT_FILTERS,
  type FilterState,
} from "../../../src/components/map/FilterDrawer";
import { Card, Badge } from "../../../src/components/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_SPACING = 12;

// Try to load react-native-maps — it fails in Expo Go
interface MapViewProps {
  ref?: React.Ref<{ animateToRegion: (region: object, duration?: number) => void }>;
  provider?: string;
  style?: object;
  initialRegion?: object;
  customMapStyle?: object[];
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onRegionChangeComplete?: (region: object) => void;
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  tracksViewChanges?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}

let MapViewComponent: React.ComponentType<MapViewProps> | null = null;
let MarkerComponent: React.ComponentType<MarkerProps> | null = null;
let PROVIDER_GOOGLE_VAL: string | undefined = undefined;
let PulseMarkerComponent: React.ComponentType<{ color: string }> | null = null;
let mapStyleJson: object[] = [];

try {
  const maps = require("react-native-maps");
  MapViewComponent = maps.default;
  MarkerComponent = maps.Marker;
  PROVIDER_GOOGLE_VAL = maps.PROVIDER_GOOGLE;
  PulseMarkerComponent = require("../../../src/components/map/PulseMarker").PulseMarker;
  mapStyleJson = require("../../../src/constants/mapStyle").hobioMapStyle;
} catch {
  // react-native-maps not available (Expo Go)
}

const MAP_AVAILABLE = MapViewComponent !== null;

export default function DiscoverScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const mapRef = useRef<{ animateToRegion: (region: object, duration?: number) => void } | null>(null);

  const {
    userLocation,
    region,
    allMapGroups,
    isLoading,
    selectedGroupId,
    setSelectedGroupId,
    activeFilter,
    setActiveFilter,
    hasMoved,
    handleRegionChange,
    searchThisArea,
    fetchGroups,
  } = useMapDiscovery(profile?.id ?? "");

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Apply advanced filters to the groups
  const filteredGroups = allMapGroups.filter((item) => {
    // Sport category filter
    if (
      filters.sportCategories.length > 0 &&
      item.sportCategory &&
      !filters.sportCategories.includes(item.sportCategory)
    ) {
      return false;
    }
    // Audience filter (based on age_group field)
    if (filters.audience === "kids" && item.group.age_group === "adults") return false;
    if (filters.audience === "adults" && item.group.age_group !== "adults" && item.group.age_group) return false;
    // Availability filter
    if (filters.availability === "spots" && item.group.max_participants != null) {
      // Would need member count — for now keep as pass-through
    }
    return true;
  });

  const myGroups = filteredGroups.filter((g) => g.isMember);
  const discoveryGroups = filteredGroups.filter((g) => !g.isMember);

  const [showDetail, setShowDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const carouselRef = useRef<FlatList>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const selectedGroup = filteredGroups.find((g) => g.group.id === selectedGroupId);

  const activeFilterCount =
    filters.sportCategories.length +
    (filters.audience !== "all" ? 1 : 0) +
    (filters.availability !== "all" ? 1 : 0);

  // Pull-to-refresh for list mode
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }, [fetchGroups]);

  const handleMarkerPress = useCallback(
    (groupId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedGroupId(groupId);
      const index = filteredGroups.findIndex((g) => g.group.id === groupId);
      if (index >= 0 && carouselRef.current) {
        carouselRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [filteredGroups, setSelectedGroupId]
  );

  const handleCarouselScroll = useCallback(
    (index: number) => {
      const item = filteredGroups[index];
      if (!item) return;
      setSelectedGroupId(item.group.id);
      if (mapRef.current && item.location.latitude && item.location.longitude) {
        mapRef.current.animateToRegion(
          {
            latitude: item.location.latitude,
            longitude: item.location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          400
        );
      }
    },
    [filteredGroups, setSelectedGroupId]
  );

  const goToUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        500
      );
    }
  }, [userLocation]);

  const openDetail = useCallback(
    (groupId: string) => {
      setSelectedGroupId(groupId);
      setShowDetail(true);
      Animated.spring(sheetAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    },
    [sheetAnim, setSelectedGroupId]
  );

  const closeDetail = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDetail(false));
  }, [sheetAnim]);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / (CARD_WIDTH + CARD_SPACING));
      handleCarouselScroll(index);
    },
    [handleCarouselScroll]
  );

  const handleApplyFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      // Also set the legacy single-category filter for the hook
      setActiveFilter(
        newFilters.sportCategories.length === 1 ? newFilters.sportCategories[0] : null
      );
      setShowFilters(false);
    },
    [setActiveFilter]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveFilter(null);
    setShowFilters(false);
  }, [setActiveFilter]);

  // ─── MAP MODE (development build) ────────────────────────
  if (MAP_AVAILABLE) {
    const MapView = MapViewComponent!;
    const Marker = MarkerComponent!;
    const PulseMarker = PulseMarkerComponent!;

    return (
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE_VAL}
          style={{ flex: 1 }}
          customMapStyle={mapStyleJson}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          onRegionChangeComplete={handleRegionChange}
        >
          {/* My Groups — Sprout green markers */}
          {myGroups.map((item) => {
            if (!item.location.latitude || !item.location.longitude) return null;
            return (
              <Marker
                key={`my-${item.group.id}`}
                coordinate={{ latitude: item.location.latitude, longitude: item.location.longitude }}
                onPress={() => handleMarkerPress(item.group.id)}
                tracksViewChanges={false}
              >
                <PulseMarker color={Colors.secondary.DEFAULT} isSelected={selectedGroupId === item.group.id} isMember />
              </Marker>
            );
          })}
          {/* Discovery — Primary blue markers */}
          {discoveryGroups.map((item) => {
            if (!item.location.latitude || !item.location.longitude) return null;
            return (
              <Marker
                key={`disc-${item.group.id}`}
                coordinate={{ latitude: item.location.latitude, longitude: item.location.longitude }}
                onPress={() => handleMarkerPress(item.group.id)}
                tracksViewChanges={false}
              >
                <PulseMarker color={Colors.primary.DEFAULT} isSelected={selectedGroupId === item.group.id} isMember={false} />
              </Marker>
            );
          })}
        </MapView>

        {/* Sticky filter button — top right */}
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 60 : 40,
            right: 16,
            left: 16,
            zIndex: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Notification bell */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/notifications")}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.surface,
              alignItems: "center",
              justifyContent: "center",
              ...Shadows.card,
            }}
          >
            <Bell size={20} color={Colors.text.primary} strokeWidth={2} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: Colors.danger.DEFAULT,
                  borderWidth: 2,
                  borderColor: Colors.surface,
                }}
              />
            )}
          </TouchableOpacity>

          {/* Filter button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowFilters(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 22,
              backgroundColor: activeFilterCount > 0 ? Colors.primary.DEFAULT : Colors.surface,
              ...Shadows.card,
            }}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? "#FFF" : Colors.text.primary} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: Fonts.semiBold,
                color: activeFilterCount > 0 ? "#FFF" : Colors.text.primary,
              }}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search this area */}
        {hasMoved && (
          <View style={{ position: "absolute", top: Platform.OS === "ios" ? 115 : 95, alignSelf: "center", zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                searchThisArea();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: Colors.primary.DEFAULT,
                ...Shadows.button,
              }}
            >
              <Search size={16} color="#FFF" />
              <Text style={{ fontSize: 14, fontFamily: Fonts.bold, color: "#FFF" }}>
                Search this area
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My location button */}
        <TouchableOpacity
          onPress={goToUserLocation}
          style={{
            position: "absolute",
            right: 16,
            bottom: 260,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: Colors.surface,
            alignItems: "center",
            justifyContent: "center",
            ...Shadows.card,
          }}
        >
          <Navigation size={22} color={Colors.primary.DEFAULT} />
        </TouchableOpacity>

        {/* Legend */}
        <View
          style={{
            position: "absolute",
            left: 16,
            bottom: 265,
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: Colors.surface + "E0",
          }}
        >
          <LegendItem color={Colors.secondary.DEFAULT} icon={<Sprout size={12} color={Colors.secondary.DEFAULT} />} label="My Groups" />
          <LegendItem color={Colors.primary.DEFAULT} icon={<Send size={12} color={Colors.primary.DEFAULT} />} label="Discover" />
        </View>

        {/* Carousel */}
        <View style={{ position: "absolute", bottom: Platform.OS === "ios" ? 100 : 80, left: 0, right: 0 }}>
          {isLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator color={Colors.primary.DEFAULT} />
            </View>
          ) : filteredGroups.length === 0 ? (
            <EmptyCarousel />
          ) : (
            <FlatList
              ref={carouselRef}
              horizontal
              data={filteredGroups}
              keyExtractor={(item) => item.group.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 }}
              onMomentumScrollEnd={onMomentumScrollEnd}
              renderItem={({ item }) => (
                <CarouselCard
                  item={item}
                  isSelected={selectedGroupId === item.group.id}
                  onPress={() => handleMarkerPress(item.group.id)}
                  onDetail={() => openDetail(item.group.id)}
                />
              )}
            />
          )}
        </View>

        {/* Detail sheet */}
        {showDetail && selectedGroup && (
          <GroupDetailSheet
            item={selectedGroup}
            animValue={sheetAnim}
            onClose={closeDetail}
            onJoin={() => {
              router.push(`/join/${selectedGroup.group.invite_code}` as never);
              closeDetail();
            }}
          />
        )}

        {/* Filter drawer */}
        <FilterDrawer
          visible={showFilters}
          filters={filters}
          resultCount={filteredGroups.length}
          onApply={handleApplyFilters}
          onClose={() => setShowFilters(false)}
          onReset={handleResetFilters}
        />
      </View>
    );
  }

  // ─── LIST MODE (Expo Go fallback) ────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: Colors.primary.DEFAULT + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Compass size={22} color={Colors.primary.DEFAULT} />
            </View>
            <View>
              <Text style={{ fontSize: 24, fontFamily: Fonts.extraBold, color: Colors.text.primary }}>
                Discover
              </Text>
              <Text style={{ fontSize: 13, fontFamily: Fonts.medium, color: Colors.text.secondary }}>
                Find groups near you
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Notification bell */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/notifications")}
              style={{ position: "relative", padding: 4 }}
            >
              <Bell size={24} color={Colors.text.primary} strokeWidth={2} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: Colors.danger.DEFAULT,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ fontSize: 10, fontFamily: Fonts.extraBold, color: "#FFF" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Filter button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowFilters(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: activeFilterCount > 0 ? Colors.primary.DEFAULT : Colors.primary.DEFAULT + "12",
              }}
            >
              <SlidersHorizontal size={16} color={activeFilterCount > 0 ? "#FFF" : Colors.primary.DEFAULT} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: Fonts.semiBold,
                  color: activeFilterCount > 0 ? "#FFF" : Colors.primary.DEFAULT,
                }}
              >
                {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Note about map */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: Colors.primary.light + "15",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Map size={16} color={Colors.primary.DEFAULT} />
        <Text style={{ fontSize: 12, fontFamily: Fonts.medium, color: Colors.primary.dark, flex: 1 }}>
          Map view available in development builds. Showing list view.
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.DEFAULT}
            />
          }
        >
          {/* My Groups */}
          {myGroups.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: Fonts.semiBold,
                  color: Colors.text.secondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                  marginLeft: 4,
                }}
              >
                My Groups
              </Text>
              {myGroups.map((item) => (
                <ListCard key={item.group.id} item={item} onPress={() => openDetail(item.group.id)} />
              ))}
            </>
          )}

          {/* Discover */}
          {discoveryGroups.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: Fonts.semiBold,
                  color: Colors.text.secondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                  marginLeft: 4,
                  marginTop: myGroups.length > 0 ? 16 : 0,
                }}
              >
                Nearby Groups
              </Text>
              {discoveryGroups.map((item) => (
                <ListCard key={item.group.id} item={item} onPress={() => openDetail(item.group.id)} />
              ))}
            </>
          )}

          {filteredGroups.length === 0 && (
            <View style={{ paddingTop: 60, alignItems: "center", gap: 12 }}>
              <Compass size={48} color={Colors.text.secondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 18, fontFamily: Fonts.bold, color: Colors.text.primary }}>
                No groups nearby
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: Fonts.regular,
                  color: Colors.text.secondary,
                  textAlign: "center",
                }}
              >
                Groups with locations will appear here. Pull down to refresh.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Detail sheet */}
      {showDetail && selectedGroup && (
        <GroupDetailSheet
          item={selectedGroup}
          animValue={sheetAnim}
          onClose={closeDetail}
          onJoin={() => {
            router.push(`/join/${selectedGroup.group.invite_code}` as never);
            closeDetail();
          }}
        />
      )}

      {/* Filter drawer */}
      <FilterDrawer
        visible={showFilters}
        filters={filters}
        resultCount={filteredGroups.length}
        onApply={handleApplyFilters}
        onClose={() => setShowFilters(false)}
        onReset={handleResetFilters}
      />
    </SafeAreaView>
  );
}

// ─── Shared sub-components ──────────────────────────────────

function LegendItem({
  color,
  icon,
  label,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      {icon}
      <Text style={{ fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.text.secondary }}>
        {label}
      </Text>
    </View>
  );
}

function EmptyCarousel() {
  return (
    <View
      style={{
        alignSelf: "center",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        ...Shadows.card,
      }}
    >
      <Text style={{ fontSize: 14, fontFamily: Fonts.regular, color: Colors.text.secondary, textAlign: "center" }}>
        No groups with locations nearby.{"\n"}
        <Text style={{ fontFamily: Fonts.semiBold, color: Colors.primary.DEFAULT }}>
          Try searching a different area
        </Text>
      </Text>
    </View>
  );
}

function ListCard({ item, onPress }: { item: MapGroup; onPress: () => void }) {
  const { group, location, distance, isMember } = item;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ marginBottom: 10 }}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: group.color || Colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isMember ? (
              <Sprout size={22} color="#FFF" />
            ) : (
              <MapPin size={22} color="#FFF" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: Fonts.bold, color: Colors.text.primary }} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Fonts.regular, color: Colors.text.secondary, marginTop: 2 }} numberOfLines={1}>
              {location.name} · {location.city}
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {isMember && <Badge label="Joined" variant="secondary" size="sm" />}
              {group.skill_level && group.skill_level !== "all" && (
                <Badge
                  label={group.skill_level.charAt(0).toUpperCase() + group.skill_level.slice(1)}
                  variant="primary"
                  size="sm"
                />
              )}
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {distance != null && (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  backgroundColor: Colors.primary.light + "20",
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: Fonts.bold, color: Colors.primary.DEFAULT }}>
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
            {group.price_per_month != null && (
              <Text style={{ fontSize: 12, fontFamily: Fonts.semiBold, color: Colors.text.secondary }}>
                {group.currency === "EUR" ? "€" : "$"}
                {group.price_per_month}/mo
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

interface CarouselCardProps {
  item: MapGroup;
  isSelected: boolean;
  onPress: () => void;
  onDetail: () => void;
}

function CarouselCard({ item, isSelected, onPress, onDetail }: CarouselCardProps) {
  const { group, location, distance, isMember } = item;
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onDetail}
      activeOpacity={0.9}
      style={{
        width: CARD_WIDTH,
        marginRight: CARD_SPACING,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        padding: 16,
        borderWidth: isSelected ? 2.5 : 0,
        borderColor: isSelected
          ? isMember
            ? Colors.secondary.DEFAULT
            : Colors.primary.DEFAULT
          : "transparent",
        ...Shadows.card,
        ...(isSelected ? { shadowOpacity: 0.15, elevation: 8 } : {}),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 4,
              height: 32,
              borderRadius: 2,
              backgroundColor: group.color || Colors.primary.DEFAULT,
            }}
          />
          <View>
            <Text style={{ fontSize: 16, fontFamily: Fonts.bold, color: Colors.text.primary }} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Fonts.regular, color: Colors.text.secondary, marginTop: 1 }} numberOfLines={1}>
              {location.name}
            </Text>
          </View>
        </View>
        {distance != null && (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              backgroundColor: Colors.primary.light + "20",
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: Fonts.bold, color: Colors.primary.DEFAULT }}>
              {formatDistance(distance)}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {isMember && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: Colors.secondary.DEFAULT + "15",
            }}
          >
            <Star size={12} color={Colors.secondary.DEFAULT} />
            <Text style={{ fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.secondary.DEFAULT }}>
              Joined
            </Text>
          </View>
        )}
        {group.skill_level && group.skill_level !== "all" && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: Colors.border + "60" }}>
            <Text style={{ fontSize: 11, fontFamily: Fonts.medium, color: Colors.text.secondary }}>
              {group.skill_level.charAt(0).toUpperCase() + group.skill_level.slice(1)}
            </Text>
          </View>
        )}
        {group.price_per_month != null && (
          <Text style={{ fontSize: 12, fontFamily: Fonts.semiBold, color: Colors.text.secondary }}>
            {group.currency === "EUR" ? "€" : "$"}
            {group.price_per_month}/mo
          </Text>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onDetail}>
          <ChevronDown size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

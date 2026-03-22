import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  X,
  MapPin,
  Users,
  Star,
  Clock,
  DollarSign,
  ArrowRight,
  ExternalLink,
} from "lucide-react-native";
import { Colors, Shadows } from "../../constants/colors";
import { Fonts } from "../../constants/fonts";
import { Badge, Button } from "../../components/ui";
import { formatDistance } from "../../lib/geo";
import type { MapGroup } from "../../hooks/useMapDiscovery";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.48;

interface GroupDetailSheetProps {
  item: MapGroup;
  animValue: Animated.Value;
  onClose: () => void;
  onJoin: () => void;
}

/**
 * Custom bottom sheet that shows full group details when a marker/card is tapped.
 * Replaces the standard Google Maps InfoWindow with a native-feel drawer.
 */
export function GroupDetailSheet({
  item,
  animValue,
  onClose,
  onJoin,
}: GroupDetailSheetProps) {
  const { group, location, distance, isMember } = item;

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "#000",
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: SHEET_HEIGHT,
          backgroundColor: Colors.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          transform: [{ translateY }],
          ...Shadows.card,
          shadowOpacity: 0.15,
          elevation: 16,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
            }}
          />
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: Colors.border + "60",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <X size={18} color={Colors.text.secondary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
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
              <Users size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: Colors.text.primary,
                }}
                numberOfLines={1}
              >
                {group.name}
              </Text>
              {group.description && (
                <Text
                  style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}
                  numberOfLines={2}
                >
                  {group.description}
                </Text>
              )}
            </View>
          </View>

          {/* Badges row */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {isMember && <Badge label="Member" variant="secondary" size="md" />}
            {group.skill_level && group.skill_level !== "all" && (
              <Badge
                label={
                  group.skill_level.charAt(0).toUpperCase() +
                  group.skill_level.slice(1)
                }
                variant="primary"
                size="md"
              />
            )}
            {distance != null && (
              <Badge label={formatDistance(distance)} variant="primary" size="md" />
            )}
          </View>

          {/* Info rows */}
          <View style={{ gap: 14, marginBottom: 24 }}>
            {/* Location */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: Colors.primary.light + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={18} color={Colors.primary.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: Colors.text.primary }}>
                  {location.name}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                  {location.address}, {location.city}
                </Text>
              </View>
            </View>

            {/* Capacity */}
            {group.max_participants != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: Colors.secondary.DEFAULT + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={18} color={Colors.secondary.DEFAULT} />
                </View>
                <Text style={{ fontSize: 14, color: Colors.text.primary }}>
                  Max {group.max_participants} participants
                </Text>
              </View>
            )}

            {/* Price */}
            {group.price_per_month != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: Colors.warning.DEFAULT + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DollarSign size={18} color={Colors.warning.dark} />
                </View>
                <Text style={{ fontSize: 14, color: Colors.text.primary }}>
                  {group.currency === "EUR" ? "€" : "$"}
                  {group.price_per_month} / month
                </Text>
              </View>
            )}

            {group.age_group && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: Colors.accent.DEFAULT + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Star size={18} color={Colors.accent.DEFAULT} />
                </View>
                <Text style={{ fontSize: 14, color: Colors.text.primary }}>
                  Ages: {group.age_group}
                </Text>
              </View>
            )}
          </View>

          {/* Action */}
          {isMember ? (
            <View
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: Colors.secondary.DEFAULT + "10",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: Colors.secondary.DEFAULT,
                }}
              >
                You're a member of this group
              </Text>
            </View>
          ) : (
            <Button
              title="Join This Group"
              onPress={onJoin}
              icon={<ArrowRight size={18} color="#FFF" />}
            />
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}


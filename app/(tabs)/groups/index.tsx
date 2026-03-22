import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Users as UsersIcon, Search } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenWrapper, EmptyState, GroupCard } from "../../../src/components/ui";
import { useTheme } from "../../../src/hooks/useTheme";
import { Fonts } from "../../../src/constants/fonts";
import { useAuthStore } from "../../../src/stores/authStore";
import { useGroupStore } from "../../../src/stores/groupStore";
import type { Group } from "../../../src/types/database.types";
import { formatCurrency } from "../../../src/lib/helpers";
import { getSportEmoji } from "../../../src/constants/sports";

export default function GroupsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { groups, isLoading, fetchMyGroups, fetchMyOrganizations } = useGroupStore();

  const isOrganizer = profile?.role === "organizer";
  const [searchQuery, setSearchQuery] = useState("");

  // ── Staggered entry animations ──
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(-20)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const bannerS    = useRef(new Animated.Value(0.94)).current;
  const listAnim   = useRef(new Animated.Value(0)).current;
  const listY      = useRef(new Animated.Value(20)).current;

  // Rotating circles for stats banner
  const rot1 = useRef(new Animated.Value(0)).current;
  const rot2 = useRef(new Animated.Value(0)).current;
  // Animated progress bar
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotating decorative circles
    Animated.loop(
      Animated.timing(rot1, { toValue: 1, duration: 18000, useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.timing(rot2, { toValue: 1, duration: 13000, useNativeDriver: true }),
    ).start();

    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(headerY,   { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(bannerAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(bannerS,   { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(listAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(listY,    { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();

    // Progress bar after banner
    Animated.timing(barWidth, { toValue: 0.85, duration: 1000, delay: 600, useNativeDriver: false }).start();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchMyOrganizations();
      fetchMyGroups();
    }
  }, [profile?.id]);

  const filteredGroups = searchQuery.trim()
    ? groups.filter((g) => g.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()))
    : groups;

  const totalMembers = groups.reduce((acc, g) => acc + (g.member_count ?? 0), 0);

  const rot1Deg = rot1.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const rot2Deg = rot2.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });

  return (
    <ScreenWrapper variant={isOrganizer ? "professional" : "joyful"}>
      {/* ── Header ── */}
      <Animated.View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          marginBottom: 16,
          opacity: headerAnim,
          transform: [{ translateY: headerY }],
        }}
      >
        <Text style={{ fontSize: 26, fontFamily: Fonts.extraBold, color: colors.text.primary }}>
          {isOrganizer ? "My Groups" : "My Hobbies"}
        </Text>

        {isOrganizer && (
          <TouchableOpacity
            onPress={() => router.push("/modals/create-group")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
              ...shadows.button,
            }}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Search bar ── */}
      {(isOrganizer || groups.length > 3) && (
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 44,
            gap: 10,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: headerAnim,
          }}
        >
          <Search size={18} color={colors.text.secondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search groups..."
            placeholderTextColor={colors.text.secondary + "80"}
            autoCorrect={false}
            autoCapitalize="none"
            style={{ flex: 1, fontSize: 15, fontFamily: Fonts.regular, color: colors.text.primary }}
          />
        </Animated.View>
      )}

      {/* ── Stats banner (organizer) ── */}
      {isOrganizer && groups.length > 0 && (
        <Animated.View
          style={{
            marginBottom: 18,
            opacity: bannerAnim,
            transform: [{ scale: bannerS }],
          }}
        >
          <LinearGradient
            colors={[colors.primary.DEFAULT, colors.secondary.DEFAULT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              overflow: "hidden",
            }}
          >
            {/* Decorative rotating circles */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
                transform: [{ rotate: rot1Deg }],
              }}
            />
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: -25,
                left: -25,
                width: 110,
                height: 110,
                borderRadius: 55,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                transform: [{ rotate: rot2Deg }],
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: Fonts.medium, marginBottom: 4 }}>
                  Total Groups
                </Text>
                <Text style={{ color: "#FFF", fontSize: 36, fontFamily: Fonts.extraBold }}>
                  {groups.length}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: Fonts.medium, marginBottom: 4 }}>
                  Total Members
                </Text>
                <Text style={{ color: "#FFF", fontSize: 36, fontFamily: Fonts.extraBold }}>
                  {totalMembers}
                </Text>
              </View>
            </View>

            {/* Animated capacity bar */}
            <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
              <Animated.View
                style={{
                  height: "100%",
                  backgroundColor: "#FFF",
                  borderRadius: 3,
                  width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                }}
              />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: Fonts.medium }}>
              Groups running at capacity
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Groups list ── */}
      <Animated.View style={{ flex: 1, opacity: listAnim, transform: [{ translateY: listY }] }}>
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={{ marginBottom: 10 }}>
              <GroupCard
                name={item.name}
                icon={<Text style={{ fontSize: 22 }}>{getSportEmoji("other")}</Text>}
                color={item.color ?? colors.primary.DEFAULT}
                ageGroup={item.age_group ?? undefined}
                price={item.price_per_month ?? undefined}
                currency={item.currency ?? "EUR"}
                
                onPress={() => router.push(`/(tabs)/groups/${item.id}` as never)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32, ...(filteredGroups.length === 0 ? { flex: 1 } : {}) }}
          ListEmptyComponent={
            <EmptyState
              icon={<UsersIcon size={36} color={colors.primary.DEFAULT} strokeWidth={1.5} />}
              title={isOrganizer ? "No groups yet" : "No hobbies yet"}
              description={
                isOrganizer
                  ? "Create your first group and start inviting participants!"
                  : "Join a group using an invite code from your organizer."
              }
              actionLabel={isOrganizer ? "Create Group" : "Join Group"}
              onAction={() =>
                isOrganizer ? router.push("/modals/create-group") : router.push("/join/enter")
              }
            />
          }
        />
      </Animated.View>
    </ScreenWrapper>
  );
}

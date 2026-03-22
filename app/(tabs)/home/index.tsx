import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Calendar, Users, ChevronRight, LogIn, Bell, Baby } from "lucide-react-native";
import {
  ScreenWrapper,
  Avatar,
  ProfileDropdown,
  GroupCard,
  SessionCard,
  QuickActionTile,
  Card,
} from "../../../src/components/ui";
import { Colors, Shadows } from "../../../src/constants/colors";
import { Fonts } from "../../../src/constants/fonts";
import { useTheme } from "../../../src/hooks/useTheme";
import { useAuthStore } from "../../../src/stores/authStore";
import { useGroupStore } from "../../../src/stores/groupStore";
import { useNotificationStore } from "../../../src/stores/notificationStore";
import { useSessions } from "../../../src/hooks/useSessions";
import { getSessionsForDate } from "../../../src/lib/scheduling";
import { formatSessionTime } from "../../../src/lib/helpers";
import { getSportEmoji } from "../../../src/constants/sports";

export default function HomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { groups, fetchMyGroups, fetchMyOrganizations } = useGroupStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const router = useRouter();
  const { colors } = useTheme();

  const isOrganizer = profile?.role === "organizer";
  const isParent    = profile?.role === "parent";
  const [profileOpen, setProfileOpen] = useState(false);

  // ── Staggered entry animations ──
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const headerY     = useRef(new Animated.Value(-20)).current;
  const streakAnim  = useRef(new Animated.Value(0)).current;
  const streakY     = useRef(new Animated.Value(20)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const actionsY    = useRef(new Animated.Value(20)).current;
  const schedAnim   = useRef(new Animated.Value(0)).current;
  const schedY      = useRef(new Animated.Value(20)).current;
  const groupsAnim  = useRef(new Animated.Value(0)).current;
  const groupsY     = useRef(new Animated.Value(20)).current;
  const statsAnim   = useRef(new Animated.Value(0)).current;
  const statsY      = useRef(new Animated.Value(20)).current;

  // Bell wobble
  const bellRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bell wobble loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellRotate, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(bellRotate, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(4000),
      ]),
    ).start();

    // Staggered page entrance
    const slide = (op: Animated.Value, pos: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(op,  { toValue: 1, duration: 320, delay, useNativeDriver: true }),
        Animated.spring(pos, { toValue: 0, tension: 80, friction: 12, delay, useNativeDriver: true }),
      ]);

    Animated.stagger(90, [
      slide(headerAnim,  headerY,  0),
      slide(streakAnim,  streakY,  0),
      slide(actionsAnim, actionsY, 0),
      slide(schedAnim,   schedY,   0),
      slide(groupsAnim,  groupsY,  0),
      slide(statsAnim,   statsY,   0),
    ]).start();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchMyOrganizations();
      fetchMyGroups();
      fetchNotifications();
    }
  }, [profile?.id]);

  const groupIds = groups.map((g) => g.id);
  const { sessions, fetchSessions } = useSessions({
    groupIds: groupIds.length > 0 ? groupIds : undefined,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMyGroups(), fetchMyOrganizations(), fetchNotifications(), fetchSessions()]);
    setRefreshing(false);
  }, [fetchMyGroups, fetchMyOrganizations, fetchNotifications, fetchSessions]);

  const todaySessions = getSessionsForDate(sessions, new Date()).filter((s) => !s.is_cancelled);
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const bellRotateDeg = bellRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
        }
      >
        {/* ── Header ── */}
        <Animated.View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            opacity: headerAnim,
            transform: [{ translateY: headerY }],
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: Fonts.medium, color: colors.text.secondary, marginBottom: 2 }}>
              {greeting()}
            </Text>
            <Text style={{ fontSize: 28, fontFamily: Fonts.extraBold, color: colors.text.primary }}>
              {firstName}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            {/* Circular bell button with wobble + badge */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/notifications")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                ...Shadows.card,
              }}
            >
              <Animated.View style={{ transform: [{ rotate: bellRotateDeg }] }}>
                <Bell size={20} color={colors.text.primary} strokeWidth={2} />
              </Animated.View>
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    minWidth: 17,
                    height: 17,
                    borderRadius: 9,
                    backgroundColor: colors.danger.DEFAULT,
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

            <TouchableOpacity onPress={() => setProfileOpen(true)} activeOpacity={0.7}>
              <Avatar name={profile?.full_name ?? "U"} imageUrl={profile?.avatar_url} size={48} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ProfileDropdown visible={profileOpen} onClose={() => setProfileOpen(false)} />

        {/* ── Activity streak badge ── */}
        {groups.length > 0 && (
          <Animated.View
            style={{
              marginBottom: 20,
              opacity: streakAnim,
              transform: [{ translateY: streakY }],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderRadius: 999,
                backgroundColor: colors.secondary.DEFAULT + "12",
                borderWidth: 1,
                borderColor: colors.secondary.DEFAULT + "20",
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 18 }}>🎯</Text>
              <Text style={{ fontSize: 14, fontFamily: Fonts.bold, color: colors.secondary.dark }}>
                {groups.length} active hobb{groups.length === 1 ? "y" : "ies"}! Keep the momentum going!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Quick actions ── */}
        <Animated.View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 28,
            opacity: actionsAnim,
            transform: [{ translateY: actionsY }],
          }}
        >
          {isOrganizer && (
            <QuickActionTile
              icon={<Plus size={24} color="#FFF" strokeWidth={2.5} />}
              label="New Group"
              color={colors.primary.DEFAULT}
              onPress={() => router.push("/modals/create-group")}
            />
          )}
          <QuickActionTile
            icon={<LogIn size={24} color="#FFF" strokeWidth={2.5} />}
            label="Join Group"
            color={colors.secondary.DEFAULT}
            onPress={() => router.push("/join/enter")}
          />
          {isParent && (
            <QuickActionTile
              icon={<Baby size={24} color="#FFF" strokeWidth={2.5} />}
              label="Add Child"
              color={colors.accent.DEFAULT}
              onPress={() => router.push("/modals/add-child")}
            />
          )}
        </Animated.View>

        {/* ── Today's Schedule ── */}
        <Animated.View style={{ marginBottom: 28, opacity: schedAnim, transform: [{ translateY: schedY }] }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 20, fontFamily: Fonts.bold, color: colors.text.primary }}>
              Today's Schedule
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/schedule")}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text style={{ fontSize: 14, fontFamily: Fonts.semiBold, color: colors.primary.DEFAULT }}>See all</Text>
              <ChevronRight size={16} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>

          {todaySessions.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
                <Calendar size={32} color={colors.primary.light} strokeWidth={1.5} />
                <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: "center" }}>
                  No sessions scheduled for today.
                </Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {todaySessions.map((session) => {
                const group = groupMap.get(session.group_id);
                return (
                  <SessionCard
                    key={session.id}
                    groupName={group?.name ?? "Session"}
                    time={formatSessionTime(session.starts_at, session.ends_at)}
                    color={group?.color ?? colors.primary.DEFAULT}
                    onPress={() => router.push(`/(tabs)/groups/${session.group_id}` as never)}
                  />
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* ── My Groups ── */}
        <Animated.View style={{ marginBottom: 28, opacity: groupsAnim, transform: [{ translateY: groupsY }] }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 20, fontFamily: Fonts.bold, color: colors.text.primary }}>
              My Groups
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/groups")}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text style={{ fontSize: 14, fontFamily: Fonts.semiBold, color: colors.primary.DEFAULT }}>See all</Text>
              <ChevronRight size={16} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
                <Users size={32} color={colors.primary.light} strokeWidth={1.5} />
                <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: "center" }}>
                  You haven't joined any groups yet.
                </Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {groups.slice(0, 3).map((group) => (
                <GroupCard
                  key={group.id}
                  name={group.name}
                  icon={
                    <Text style={{ fontSize: 22 }}>
                      {getSportEmoji("other")}
                    </Text>
                  }
                  color={group.color ?? Colors.primary.DEFAULT}
                  ageGroup={group.age_group ?? undefined}
                  currency={group.currency ?? "EUR"}
                  price={group.price_per_month ?? undefined}
                  onPress={() => router.push(`/(tabs)/groups/${group.id}` as never)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Quick Stats (organizer only) ── */}
        {isOrganizer && (
          <Animated.View style={{ opacity: statsAnim, transform: [{ translateY: statsY }] }}>
            <Text style={{ fontSize: 20, fontFamily: Fonts.bold, color: colors.text.primary, marginBottom: 14 }}>
              Quick Stats
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Card style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontFamily: Fonts.extraBold, color: colors.primary.DEFAULT }}>{groups.length}</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 4 }}>Groups</Text>
              </Card>
              <Card style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontFamily: Fonts.extraBold, color: colors.secondary.DEFAULT }}>{todaySessions.length}</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 4 }}>Today</Text>
              </Card>
              <Card style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontFamily: Fonts.extraBold, color: colors.warning.DEFAULT }}>{sessions.filter((s) => !s.is_cancelled).length}</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 4 }}>Sessions</Text>
              </Card>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

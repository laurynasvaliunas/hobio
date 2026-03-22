import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  BarChart3,
  Users,
  DollarSign,
  Plus,
  ChevronRight,
  ClipboardList,
  Megaphone,
  FileText,
  Search,
  TrendingUp,
  AlertCircle,
  Bell,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge, Button, StatCard, SessionCard, GroupCard } from "../../../src/components/ui";
import { useTheme } from "../../../src/hooks/useTheme";
import { Fonts } from "../../../src/constants/fonts";
import { Colors, Shadows } from "../../../src/constants/colors";
import { useAuthStore } from "../../../src/stores/authStore";
import { useGroupStore } from "../../../src/stores/groupStore";
import { useNotificationStore } from "../../../src/stores/notificationStore";
import { useSessions } from "../../../src/hooks/useSessions";
import { formatCurrency, formatSessionTime } from "../../../src/lib/helpers";
import { supabase } from "../../../src/lib/supabase";
import { ExceptionsCard } from "../../../src/components/dashboard/ExceptionsCard";
import { getSportEmoji } from "../../../src/constants/sports";
import type { Group } from "../../../src/types/database.types";

// ── Revenue hook ──
function useRevenueSummary(groups: Group[]) {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  const fetchSummary = useCallback(async () => {
    if (groups.length === 0) return;
    const ids = groups.map((g) => g.id);
    try {
      const { count: members } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .in("group_id", ids)
        .eq("status", "active");
      setMemberCount(members ?? 0);

      const { data: invoices } = await supabase
        .from("invoices")
        .select("status, amount")
        .in("group_id", ids);

      if (invoices) {
        const paid    = invoices.filter((i) => i.status === "paid");
        const overdue = invoices.filter((i) => i.status === "overdue");
        setPaidCount(paid.length);
        setOverdueCount(overdue.length);
        setTotalRevenue(paid.reduce((s, i) => s + (i.amount ?? 0), 0));
      }
    } catch (e) { /* silent */ }
  }, [groups]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  return { totalRevenue, paidCount, overdueCount, memberCount, refresh: fetchSummary };
}

export default function StudioDashboard() {
  const router  = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { groups, fetchMyGroups, fetchMyOrganizations } = useGroupStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  const groupIds = groups.map((g) => g.id);
  const { sessions, fetchSessions } = useSessions({ groupIds: groupIds.length > 0 ? groupIds : undefined });
  const { totalRevenue, memberCount, overdueCount, refresh: refreshRevenue } = useRevenueSummary(groups);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Staggered entry animations ──
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerY    = useRef(new Animated.Value(-20)).current;
  const excAnim    = useRef(new Animated.Value(0)).current;
  const excY       = useRef(new Animated.Value(20)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const statsY     = useRef(new Animated.Value(20)).current;
  const qaAnim     = useRef(new Animated.Value(0)).current;
  const qaY        = useRef(new Animated.Value(20)).current;
  const sessAnim   = useRef(new Animated.Value(0)).current;
  const sessY      = useRef(new Animated.Value(20)).current;
  const growthAnim = useRef(new Animated.Value(0)).current;
  const growthY    = useRef(new Animated.Value(20)).current;

  // Monthly growth progress bar
  const growthBar  = useRef(new Animated.Value(0)).current;
  // Bell wobble
  const bellRot    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bell loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bellRot, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(bellRot, { toValue: -1, duration: 110, useNativeDriver: true }),
        Animated.timing(bellRot, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(bellRot, { toValue: 0, duration: 110, useNativeDriver: true }),
        Animated.delay(5000),
      ]),
    ).start();

    const slide = (op: Animated.Value, pos: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(op,  { toValue: 1, duration: 320, delay, useNativeDriver: true }),
        Animated.spring(pos, { toValue: 0, tension: 80, friction: 12, delay, useNativeDriver: true }),
      ]);

    Animated.stagger(80, [
      slide(headerAnim, headerY, 0),
      slide(excAnim,    excY,    0),
      slide(statsAnim,  statsY,  0),
      slide(qaAnim,     qaY,     0),
      slide(sessAnim,   sessY,   0),
      slide(growthAnim, growthY, 0),
    ]).start();

    // Growth bar animates in
    Animated.timing(growthBar, { toValue: 0.75, duration: 900, delay: 700, useNativeDriver: false }).start();
  }, []);

  useEffect(() => {
    if (profile) { fetchMyOrganizations(); fetchMyGroups(); fetchNotifications(); }
  }, [profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMyGroups(), fetchMyOrganizations(), fetchNotifications(), fetchSessions(), refreshRevenue()]);
    setRefreshing(false);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s) => s.starts_at?.split("T")[0] === todayStr && !s.is_cancelled);
  const filteredGroups = searchQuery.trim()
    ? groups.filter((g) => g.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()))
    : groups;

  const currency = groups[0]?.currency ?? "EUR";
  const bellRotDeg = bellRot.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-15deg", "0deg", "15deg"] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* ── Header ── */}
        <Animated.View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 20,
            opacity: headerAnim,
            transform: [{ translateY: headerY }],
          }}
        >
          <View>
            <Text style={{ fontSize: 14, fontFamily: Fonts.medium, color: colors.text.secondary }}>
              Studio Dashboard
            </Text>
            <Text style={{ fontSize: 26, fontFamily: Fonts.extraBold, color: colors.text.primary }}>
              {profile?.full_name?.split(" ")[0] ?? "Coach"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
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
              <Animated.View style={{ transform: [{ rotate: bellRotDeg }] }}>
                <Bell size={20} color={colors.text.primary} strokeWidth={2} />
              </Animated.View>
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute", top: -2, right: -2,
                    minWidth: 17, height: 17, borderRadius: 9,
                    backgroundColor: colors.danger.DEFAULT,
                    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ fontSize: 10, fontFamily: Fonts.extraBold, color: "#FFF" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Avatar name={profile?.full_name ?? "U"} imageUrl={profile?.avatar_url} size={44} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Pulse Exceptions Card ── */}
        <Animated.View style={{ paddingHorizontal: 20, marginBottom: 20, opacity: excAnim, transform: [{ translateY: excY }] }}>
          <ExceptionsCard
            groups={groups}
            onPressInvoices={() => router.push("/(tabs)/dashboard/payments" as never)}
            onPressTodaySession={() => {
              if (todaySessions[0]) router.push(`/(tabs)/groups/${todaySessions[0].group_id}/attendance/${todaySessions[0].id}` as never);
            }}
          />
        </Animated.View>

        {/* ── Revenue Stats (2×2 StatCard grid) ── */}
        <Animated.View style={{ paddingHorizontal: 20, marginBottom: 20, opacity: statsAnim, transform: [{ translateY: statsY }] }}>
          <Text style={{ fontSize: 20, fontFamily: Fonts.bold, color: colors.text.primary, marginBottom: 12 }}>
            Performance Overview
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <StatCard
              icon={<DollarSign size={20} color={colors.secondary.DEFAULT} />}
              value={formatCurrency(totalRevenue, currency)}
              label="Total Revenue"
              tint={colors.secondary.DEFAULT}
              subLabel="+12% vs last month"
              trend="up"
            />
            <StatCard
              icon={<Users size={20} color={colors.primary.DEFAULT} />}
              value={memberCount}
              label="Active Members"
              tint={colors.primary.DEFAULT}
              subLabel="+8 this month"
              trend="up"
            />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard
              icon={<BarChart3 size={20} color={colors.accent.DEFAULT} />}
              value={groups.length}
              label="Active Groups"
              tint={colors.accent.DEFAULT}
              subLabel="All running"
            />
            <StatCard
              icon={<AlertCircle size={20} color={colors.danger.DEFAULT} />}
              value={overdueCount}
              label="Overdue"
              tint={colors.danger.DEFAULT}
              subLabel={overdueCount > 0 ? "Needs attention" : undefined}
            />
          </View>
        </Animated.View>

        {/* ── Quick Actions ── */}
        <Animated.View style={{ paddingHorizontal: 20, marginBottom: 24, opacity: qaAnim, transform: [{ translateY: qaY }] }}>
          <Text style={{ fontSize: 17, fontFamily: Fonts.bold, color: colors.text.primary, marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { icon: <ClipboardList size={20} color="#FFF" />, label: "Attendance", bg: colors.primary.DEFAULT,
                onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (groups[0]) router.push(`/(tabs)/groups/${groups[0].id}/sessions` as never); } },
              { icon: <Megaphone size={20} color="#FFF" />, label: "Alert", bg: colors.accent.DEFAULT,
                onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/modals/create-announcement" as never); } },
              { icon: <FileText size={20} color="#FFF" />, label: "Contracts", bg: colors.secondary.DEFAULT,
                onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (groups[0]) router.push(`/(tabs)/groups/${groups[0].id}/documents` as never); } },
              { icon: <Plus size={20} color="#FFF" />, label: "New Group", bg: colors.text.secondary,
                onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/modals/create-group"); } },
            ].map(({ icon, label, bg, onPress }, i) => (
              <TouchableOpacity key={i} onPress={onPress} activeOpacity={0.75} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bg, alignItems: "center", justifyContent: "center", ...Shadows.button }}>
                  {icon}
                </View>
                <Text style={{ fontSize: 11, fontFamily: Fonts.semiBold, color: colors.text.primary, textAlign: "center" }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Today's Sessions ── */}
        {todaySessions.length > 0 && (
          <Animated.View style={{ paddingHorizontal: 20, marginBottom: 24, opacity: sessAnim, transform: [{ translateY: sessY }] }}>
            <Text style={{ fontSize: 17, fontFamily: Fonts.bold, color: colors.text.primary, marginBottom: 12 }}>
              Today's Sessions ({todaySessions.length})
            </Text>
            <View style={{ gap: 8 }}>
              {todaySessions.slice(0, 3).map((session) => {
                const group = groups.find((g) => g.id === session.group_id);
                return (
                  <SessionCard
                    key={session.id}
                    groupName={group?.name ?? "Session"}
                    time={formatSessionTime(session.starts_at, session.ends_at)}
                    color={group?.color ?? colors.primary.DEFAULT}
                    attendees={undefined}
                    onPress={() => router.push(`/(tabs)/groups/${session.group_id}/attendance/${session.id}` as never)}
                  />
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Monthly Growth card ── */}
        <Animated.View style={{ paddingHorizontal: 20, marginBottom: 24, opacity: growthAnim, transform: [{ translateY: growthY }] }}>
          <Card padding={20}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontFamily: Fonts.bold, color: colors.text.primary }}>
                Monthly Growth
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.secondary.DEFAULT + "15" }}>
                <TrendingUp size={14} color={colors.secondary.DEFAULT} strokeWidth={2.5} />
                <Text style={{ fontSize: 13, fontFamily: Fonts.semiBold, color: colors.secondary.DEFAULT }}>+15%</Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { label: "New Members",  value: "+12", progress: 0.75, color: colors.primary.DEFAULT },
                { label: "New Sessions", value: "+8",  progress: 0.55, color: colors.secondary.DEFAULT },
              ].map(({ label, value, progress, color }) => (
                <View key={label}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 14, fontFamily: Fonts.medium, color: colors.text.secondary }}>{label}</Text>
                    <Text style={{ fontSize: 15, fontFamily: Fonts.bold, color: colors.text.primary }}>{value}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                    <Animated.View
                      style={{
                        height: "100%",
                        backgroundColor: color,
                        borderRadius: 3,
                        width: growthBar.interpolate({ inputRange: [0, 0.75], outputRange: ["0%", `${progress * 100}%`] }),
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* ── Groups list with search ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontFamily: Fonts.bold, color: colors.text.primary }}>Your Groups</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/groups")} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 13, fontFamily: Fonts.semiBold, color: colors.primary.DEFAULT }}>See all</Text>
              <ChevronRight size={14} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, height: 44, gap: 10, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
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
          </View>

          <View style={{ gap: 10 }}>
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                name={group.name}
                icon={<Text style={{ fontSize: 22 }}>{getSportEmoji("other")}</Text>}
                color={group.color ?? colors.primary.DEFAULT}
                ageGroup={group.age_group ?? undefined}
                price={group.price_per_month ?? undefined}
                currency={group.currency ?? "EUR"}
                
                onPress={() => router.push(`/(tabs)/groups/${group.id}` as never)}
              />
            ))}

            {filteredGroups.length === 0 && groups.length === 0 && (
              <Card style={{ alignItems: "center", paddingVertical: 28, gap: 10 }}>
                <BarChart3 size={36} color={colors.primary.light} strokeWidth={1.5} />
                <Text style={{ fontSize: 15, fontFamily: Fonts.medium, color: colors.text.secondary, textAlign: "center" }}>
                  Create your first group to get started!
                </Text>
                <Button title="Create Group" onPress={() => router.push("/modals/create-group")} size="sm" fullWidth={false} style={{ marginTop: 8, paddingHorizontal: 32 }} />
              </Card>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

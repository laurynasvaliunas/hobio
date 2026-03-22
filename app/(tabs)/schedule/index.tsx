import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Bell,
} from "lucide-react-native";
import { ScreenWrapper, Card, EmptyState, Badge } from "../../../src/components/ui";
import { Colors } from "../../../src/constants/colors";
import { Fonts } from "../../../src/constants/fonts";
import { useGroupStore } from "../../../src/stores/groupStore";
import { useAuthStore } from "../../../src/stores/authStore";
import { useNotificationStore } from "../../../src/stores/notificationStore";
import { useSessions } from "../../../src/hooks/useSessions";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { formatSessionTime } from "../../../src/lib/helpers";
import { getSessionsForDate } from "../../../src/lib/scheduling";
import type { Session } from "../../../src/types/database.types";

export default function ScheduleScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { groups, fetchMyGroups, fetchMyOrganizations } = useGroupStore();
  const { unreadCount } = useNotificationStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (profile) {
      fetchMyOrganizations();
      fetchMyGroups();
    }
  }, [profile?.id]);

  const groupIds = groups.map((g) => g.id);
  const { sessions, fetchSessions, isLoading: sessionsLoading } = useSessions({
    groupIds: groupIds.length > 0 ? groupIds : undefined,
  });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMyGroups(), fetchMyOrganizations(), fetchSessions()]);
    setRefreshing(false);
  }, [fetchMyGroups, fetchMyOrganizations, fetchSessions]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get sessions for selected date
  const daySessions = getSessionsForDate(sessions, selectedDate);

  // Get days that have sessions (for dot indicators)
  const sessionDays = new Set(
    sessions
      .filter((s) => !s.is_cancelled)
      .map((s) => format(parseISO(s.starts_at), "yyyy-MM-dd"))
  );

  // Map group_id to group for color coding
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
          />
        }
      >
        {/* Header with bell */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 26,
              fontFamily: Fonts.extraBold,
              color: Colors.text.primary,
            }}
          >
            Schedule
          </Text>
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
                <Text style={{ fontSize: 10, fontFamily: Fonts.extraBold, color: "#FFFFFF" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <Card style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text
              style={{ fontSize: 18, fontWeight: "700", color: Colors.text.primary }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </Text>
            <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {dayNames.map((day) => (
              <View key={day} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.text.secondary }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: "14.28%", height: 44 }} />
            ))}
            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              const hasSession = sessionDays.has(format(day, "yyyy-MM-dd"));

              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  onPress={() => setSelectedDate(day)}
                  style={{
                    width: "14.28%",
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected
                        ? Colors.primary.DEFAULT
                        : isCurrentDay
                        ? Colors.primary.light + "20"
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isSelected || isCurrentDay ? "700" : "400",
                        color: isSelected
                          ? "#FFFFFF"
                          : isCurrentDay
                          ? Colors.primary.DEFAULT
                          : Colors.text.primary,
                      }}
                    >
                      {format(day, "d")}
                    </Text>
                    {hasSession && !isSelected && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 2,
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: Colors.primary.DEFAULT,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Sessions for selected day */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: Colors.text.primary,
            marginBottom: 14,
          }}
        >
          {isToday(selectedDate)
            ? "Today's Sessions"
            : `${format(selectedDate, "EEEE, MMM d")}`}
        </Text>

        {daySessions.length === 0 ? (
          <Card>
            <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
              <CalendarIcon size={28} color={Colors.primary.light} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
                No sessions on this day
              </Text>
            </View>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {daySessions.map((session) => {
              const group = groupMap.get(session.group_id);
              const isCancelled = session.is_cancelled;

              return (
                <TouchableOpacity
                  key={session.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push(`/(tabs)/groups/${session.group_id}` as never)
                  }
                >
                  <Card style={{ opacity: isCancelled ? 0.6 : 1 }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View
                        style={{
                          width: 4,
                          borderRadius: 2,
                          backgroundColor: group?.color ?? Colors.primary.DEFAULT,
                          alignSelf: "stretch",
                        }}
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: isCancelled ? Colors.text.secondary : Colors.text.primary,
                              textDecorationLine: isCancelled ? "line-through" : "none",
                              flex: 1,
                            }}
                          >
                            {group?.name ?? "Session"}
                          </Text>
                          {isCancelled && <Badge label="Cancelled" variant="danger" />}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Clock size={13} color={Colors.text.secondary} />
                          <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
                            {formatSessionTime(session.starts_at, session.ends_at)}
                          </Text>
                        </View>
                        {session.title && (
                          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                            {session.title}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

import React from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge } from "../../../../../src/components/ui";
import { Colors } from "../../../../../src/constants/colors";
import { useAuthStore } from "../../../../../src/stores/authStore";
import { useMembers } from "../../../../../src/hooks/useMembers";
import { useAttendance, type AttendanceRecord } from "../../../../../src/hooks/useAttendance";
import { useSessions } from "../../../../../src/hooks/useSessions";
import { formatDate, formatSessionTime } from "../../../../../src/lib/helpers";
import type { AttendanceStatus } from "../../../../../src/types/database.types";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }> }
> = {
  present: { label: "Present", color: Colors.secondary.DEFAULT, bg: Colors.secondary.DEFAULT + "20", icon: Check },
  absent: { label: "Absent", color: Colors.danger.DEFAULT, bg: Colors.danger.DEFAULT + "15", icon: X },
  late: { label: "Late", color: Colors.warning.dark, bg: Colors.warning.DEFAULT + "25", icon: Clock },
  excused: { label: "Excused", color: Colors.primary.DEFAULT, bg: Colors.primary.light + "20", icon: FileText },
};

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

function AttendanceRow({
  record,
  onToggle,
}: {
  record: AttendanceRecord;
  onToggle: (status: AttendanceStatus) => void;
}) {
  const name =
    record.member.profile?.full_name ??
    record.member.child?.full_name ??
    "Unknown";
  const currentStatus = record.attendance?.status;

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ gap: 10 }}>
        {/* Member info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar
            name={name}
            imageUrl={record.member.profile?.avatar_url}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: Colors.text.primary,
              }}
            >
              {name}
            </Text>
            {record.member.child && (
              <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                Child
              </Text>
            )}
          </View>
          {currentStatus && (
            <Badge
              label={STATUS_CONFIG[currentStatus].label}
              variant={
                currentStatus === "present"
                  ? "secondary"
                  : currentStatus === "absent"
                  ? "danger"
                  : currentStatus === "late"
                  ? "warning"
                  : "primary"
              }
              size="md"
            />
          )}
        </View>

        {/* Status buttons */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = currentStatus === status;

            return (
              <TouchableOpacity
                key={status}
                onPress={() => onToggle(status)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: isActive ? config.bg : Colors.border + "80",
                  borderWidth: isActive ? 1.5 : 0,
                  borderColor: isActive ? config.color : "transparent",
                }}
              >
                <config.icon
                  size={14}
                  color={isActive ? config.color : Colors.text.secondary}
                  strokeWidth={2.5}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: isActive ? config.color : Colors.text.secondary,
                  }}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

export default function AttendanceScreen() {
  const { groupId, sessionId } = useLocalSearchParams<{
    groupId: string;
    sessionId: string;
  }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const { members, isLoading: membersLoading } = useMembers(groupId);
  const { sessions } = useSessions({ groupId });
  const session = sessions.find((s) => s.id === sessionId);

  const {
    records,
    isLoading: attendanceLoading,
    markAttendance,
    stats,
  } = useAttendance(sessionId, members);

  const handleToggle = async (memberId: string, status: AttendanceStatus) => {
    if (!profile) return;
    // Haptic feedback on attendance confirmation
    Haptics.impactAsync(
      status === "present"
        ? Haptics.ImpactFeedbackStyle.Medium
        : status === "absent"
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light
    );
    try {
      await markAttendance(memberId, status, profile.id);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Mark attendance error:", error);
    }
  };

  const isLoading = membersLoading || attendanceLoading;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}
            >
              Attendance
            </Text>
            {session && (
              <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                {formatDate(session.starts_at)}{" "}
                {formatSessionTime(session.starts_at, session.ends_at)}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: Colors.secondary.DEFAULT + "20",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <UserCheck size={14} color={Colors.secondary.DEFAULT} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: Colors.secondary.DEFAULT,
              }}
            >
              {stats.present + stats.late}/{stats.total}
            </Text>
          </View>
        </View>

        {/* Stats bar */}
        {stats.total > 0 && (
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.secondary.DEFAULT,
                }}
              />
              <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                {stats.present} Present
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.danger.DEFAULT,
                }}
              />
              <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                {stats.absent} Absent
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.warning.DEFAULT,
                }}
              />
              <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                {stats.late} Late
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.border,
                }}
              />
              <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                {stats.unmarked} Unmarked
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Attendance list */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.member.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AttendanceRow
              record={item}
              onToggle={(status) => handleToggle(item.member.id, status)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

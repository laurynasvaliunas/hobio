import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Clock,
  XCircle,
  Settings2,
  Users,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge, EmptyState, Button } from "../../../../src/components/ui";
import { Colors, Shadows } from "../../../../src/constants/colors";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import { useSessions } from "../../../../src/hooks/useSessions";
import { formatDate, formatSessionTime } from "../../../../src/lib/helpers";
import type { Session } from "../../../../src/types/database.types";

interface SessionCardProps {
  session: Session;
  isOrganizer: boolean;
  onCancel: () => void;
  onAttendance: () => void;
}

function SessionCard({ session, isOrganizer, onCancel, onAttendance }: SessionCardProps) {
  const isCancelled = session.is_cancelled;

  return (
    <Card style={{ marginBottom: 10, opacity: isCancelled ? 0.6 : 1 }}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: isCancelled ? Colors.text.secondary : Colors.text.primary,
                textDecorationLine: isCancelled ? "line-through" : "none",
              }}
            >
              {session.title || formatDate(session.starts_at)}
            </Text>
            {isCancelled && <Badge label="Cancelled" variant="danger" />}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Clock size={14} color={Colors.text.secondary} />
          <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
            {formatDate(session.starts_at)} {formatSessionTime(session.starts_at, session.ends_at)}
          </Text>
        </View>

        {session.notes && (
          <Text style={{ fontSize: 13, color: Colors.text.secondary, fontStyle: "italic" }}>
            {session.notes}
          </Text>
        )}

        {isCancelled && session.cancellation_reason && (
          <Text style={{ fontSize: 13, color: Colors.danger.DEFAULT }}>
            Reason: {session.cancellation_reason}
          </Text>
        )}

        {/* Admin actions */}
        {isOrganizer && !isCancelled && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              onPress={onAttendance}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: Colors.primary.light + "20",
              }}
            >
              <Users size={14} color={Colors.primary.DEFAULT} />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: Colors.primary.DEFAULT }}
              >
                Attendance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: Colors.danger.DEFAULT + "15",
              }}
            >
              <XCircle size={14} color={Colors.danger.DEFAULT} />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: Colors.danger.DEFAULT }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
}

export default function SessionsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { groups } = useGroupStore();
  const profile = useAuthStore((s) => s.profile);
  const group = groups.find((g) => g.id === groupId);
  const isOrganizer = profile?.role === "organizer";

  const { sessions, isLoading, cancelSession } = useSessions({ groupId });

  const handleCancel = (session: Session) => {
    Alert.prompt?.(
      "Cancel Session",
      "Enter a reason for cancellation (optional):",
      [
        { text: "Back", style: "cancel" },
        {
          text: "Cancel Session",
          style: "destructive",
          onPress: async (reason: string | undefined) => {
            try {
              await cancelSession(session.id, reason || "Cancelled by organizer");
            } catch {
              Alert.alert("Error", "Failed to cancel session.");
            }
          },
        },
      ],
      "plain-text"
    ) ??
      // Fallback for Android (no Alert.prompt)
      Alert.alert("Cancel Session", "Cancel this session?", [
        { text: "Back", style: "cancel" },
        {
          text: "Cancel Session",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSession(session.id, "Cancelled by organizer");
            } catch {
              Alert.alert("Error", "Failed to cancel session.");
            }
          },
        },
      ]);
  };

  // Separate upcoming and past
  const now = new Date();
  const upcoming = sessions.filter(
    (s) => new Date(s.starts_at) >= now && !s.is_cancelled
  );
  const cancelled = sessions.filter((s) => s.is_cancelled);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          gap: 14,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}
          >
            Sessions
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {group?.name}
          </Text>
        </View>
        {isOrganizer && (
          <TouchableOpacity
            onPress={() =>
              router.push(`/(tabs)/groups/${groupId}/schedule-setup` as never)
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: Colors.primary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
              ...Shadows.button,
            }}
          >
            <Settings2 size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={[...upcoming, ...cancelled]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          ...(sessions.length === 0 ? { flex: 1 } : {}),
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            isOrganizer={isOrganizer ?? false}
            onCancel={() => handleCancel(item)}
            onAttendance={() =>
              router.push(
                `/(tabs)/groups/${groupId}/attendance/${item.id}` as never
              )
            }
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<Calendar size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />}
              title="No sessions yet"
              description={
                isOrganizer
                  ? "Set up a recurring schedule to auto-generate sessions."
                  : "Your organizer hasn't scheduled sessions yet."
              }
              actionLabel={isOrganizer ? "Set Up Schedule" : undefined}
              onAction={
                isOrganizer
                  ? () =>
                      router.push(
                        `/(tabs)/groups/${groupId}/schedule-setup` as never
                      )
                  : undefined
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}

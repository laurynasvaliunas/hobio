import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  BellOff,
  Megaphone,
  UserPlus,
  CheckCircle,
  Receipt,
  FileText,
  XCircle,
  Info,
  CheckCheck,
} from "lucide-react-native";
import { ScreenWrapper, Card, Badge, EmptyState } from "../../../src/components/ui";
import { Colors } from "../../../src/constants/colors";
import { useNotificationStore } from "../../../src/stores/notificationStore";
import type { AppNotification, NotificationType } from "../../../src/types/database.types";
import { formatDate } from "../../../src/lib/helpers";

const TYPE_CONFIG: Record<
  NotificationType,
  { color: string; Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }> }
> = {
  announcement: { color: Colors.primary.DEFAULT, Icon: Megaphone },
  join_request: { color: Colors.warning.dark, Icon: UserPlus },
  join_approved: { color: Colors.secondary.DEFAULT, Icon: CheckCircle },
  invoice: { color: Colors.accent.DEFAULT, Icon: Receipt },
  document: { color: Colors.primary.light, Icon: FileText },
  session_cancelled: { color: Colors.danger.DEFAULT, Icon: XCircle },
  general: { color: Colors.text.secondary, Icon: Info },
};

function NotificationItem({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ marginBottom: 8 }}>
      <Card
        style={{
          backgroundColor: isUnread ? Colors.primary.light + "08" : Colors.surface,
          borderLeftWidth: isUnread ? 3 : 0,
          borderLeftColor: config.color,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: config.color + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <config.Icon size={20} color={config.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: isUnread ? "700" : "500",
                  color: Colors.text.primary,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {isUnread && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.primary.DEFAULT,
                  }}
                />
              )}
            </View>
            {notification.body && (
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.text.secondary,
                  marginTop: 2,
                }}
                numberOfLines={2}
              >
                {notification.body}
              </Text>
            )}
            <Text
              style={{
                fontSize: 11,
                color: Colors.text.secondary,
                marginTop: 4,
              }}
            >
              {formatDate(notification.created_at)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handlePress = async (notification: AppNotification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }

    // Navigate based on type
    const data = notification.data as Record<string, string>;
    switch (notification.type) {
      case "announcement":
        if (data.groupId) {
          router.push(`/(tabs)/groups/${data.groupId}` as never);
        }
        break;
      case "join_request":
      case "join_approved":
        if (data.groupId) {
          router.push(`/(tabs)/groups/${data.groupId}/members` as never);
        }
        break;
      case "invoice":
        if (data.groupId) {
          router.push(`/(tabs)/groups/${data.groupId}/invoices` as never);
        }
        break;
      case "document":
        if (data.groupId) {
          router.push(`/(tabs)/groups/${data.groupId}/documents` as never);
        }
        break;
      default:
        break;
    }
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 8,
          marginBottom: 20,
        }}
      >
        <View>
          <Text
            style={{ fontSize: 26, fontWeight: "800", color: Colors.text.primary }}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllRead}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: Colors.primary.light + "15",
            }}
          >
            <CheckCheck size={16} color={Colors.primary.DEFAULT} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary.DEFAULT }}>
              Read all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 32,
          ...(notifications.length === 0 ? { flex: 1 } : {}),
        }}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<BellOff size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />}
              title="All caught up"
              description="You don't have any notifications yet. They'll appear here when something happens in your groups."
            />
          )
        }
      />
    </ScreenWrapper>
  );
}

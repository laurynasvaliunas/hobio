import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, ChevronLeft, Megaphone, Plus, Siren } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Card, EmptyState, ErrorState, Avatar, Badge } from "../../../../src/components/ui";
import { Colors } from "../../../../src/constants/colors";
import {
  useAnnouncements,
  type Announcement,
} from "../../../../src/hooks/useAnnouncements";
import { useAuthStore } from "../../../../src/stores/authStore";
import { useGroupStore } from "../../../../src/stores/groupStore";

export default function GroupAnnouncementsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const viewerId = useAuthStore((s) => s.session?.user?.id);
  const groups = useGroupStore((s) => s.groups);
  const organizations = useGroupStore((s) => s.organizations);

  const group = groups.find((g) => g.id === groupId);
  const isOrganizer = organizations.some((o) => o.id === group?.organization_id);

  const { announcements, isLoading, error, refresh, markRead } = useAnnouncements({
    groupId,
    viewerId,
  });

  const renderItem = useCallback(
    ({ item }: { item: Announcement }) => (
      <AnnouncementCard
        item={item}
        onPress={() => {
          if (!item.read) markRead(item.id);
        }}
        priorityLabel={
          item.priority === "urgent"
            ? t("announcements.priorityUrgent")
            : item.priority === "important"
              ? t("announcements.priorityImportant")
              : t("announcements.priorityNormal")
        }
      />
    ),
    [markRead, t]
  );

  const listHeader = useMemo(
    () => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ChevronLeft size={28} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontSize: 22,
            fontWeight: "800",
            color: Colors.text.primary,
          }}
        >
          {t("announcements.feedTitle")}
        </Text>
        {isOrganizer ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("announcements.newAnnouncement")}
            onPress={() =>
              router.push({
                pathname: "/modals/create-announcement",
                params: { groupId },
              } as never)
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: Colors.primary.DEFAULT,
            }}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [groupId, isOrganizer, router, t]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, gap: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={Colors.primary.DEFAULT} />
        }
        ListEmptyComponent={
          isLoading ? null : error ? (
            <ErrorState
              title={t("common.error")}
              description={error}
              onRetry={refresh}
              retryLabel={t("common.tryAgain")}
            />
          ) : (
            <EmptyState
              icon={<Bell size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />}
              title={t("announcements.emptyTitle")}
              description={
                isOrganizer
                  ? t("announcements.emptyOrganizer")
                  : t("announcements.emptyParticipant")
              }
              actionLabel={isOrganizer ? t("announcements.newAnnouncement") : undefined}
              onAction={
                isOrganizer
                  ? () =>
                      router.push({
                        pathname: "/modals/create-announcement",
                        params: { groupId },
                      } as never)
                  : undefined
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function AnnouncementCard({
  item,
  onPress,
  priorityLabel,
}: {
  item: Announcement;
  onPress: () => void;
  priorityLabel: string;
}) {
  const accent =
    item.priority === "urgent"
      ? Colors.danger.DEFAULT
      : item.priority === "important"
        ? Colors.warning.DEFAULT
        : Colors.primary.DEFAULT;
  const Icon = item.priority === "urgent" ? Siren : item.priority === "important" ? Megaphone : Bell;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Card>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: accent + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color={accent} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{ flex: 1, fontSize: 16, fontWeight: "700", color: Colors.text.primary }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: Colors.primary.DEFAULT,
                  }}
                />
              ) : null}
            </View>
            <Text style={{ fontSize: 14, color: Colors.text.secondary, lineHeight: 20 }}>
              {item.body}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              {item.author?.full_name ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Avatar
                    size={20}
                    name={item.author.full_name}
                    imageUrl={item.author.avatar_url ?? null}
                  />
                  <Text style={{ fontSize: 11, color: Colors.text.secondary }}>
                    {item.author.full_name}
                  </Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 11, color: Colors.text.secondary }}>
                · {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
              </Text>
              {item.priority !== "normal" ? (
                <Badge label={priorityLabel} variant={item.priority === "urgent" ? "danger" : "warning"} />
              ) : null}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

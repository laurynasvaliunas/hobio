import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, SectionList, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  UserPlus,
  Check,
  X,
  Shield,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge, EmptyState } from "../../../../src/components/ui";
import { Colors } from "../../../../src/constants/colors";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import { useMembers, type MemberWithDetails } from "../../../../src/hooks/useMembers";
import type { Organization } from "../../../../src/types/database.types";

interface MemberRowProps {
  member: MemberWithDetails;
  isGroupOwner: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
}

function MemberRow({ member, isGroupOwner, onApprove, onReject, onRemove }: MemberRowProps) {
  const name =
    member.profile?.full_name ?? member.child?.full_name ?? "Unknown";
  const email = member.profile?.email;
  const isPending = member.status === "pending";

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar
          name={name}
          imageUrl={member.profile?.avatar_url ?? member.child?.avatar_url}
          size={44}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: Colors.text.primary,
              }}
            >
              {name}
            </Text>
            {member.child && (
              <Badge label="Child" variant="neutral" />
            )}
          </View>
          {/* Email is sensitive — only shown to the group owner */}
          {isGroupOwner && email && (
            <Text
              style={{
                fontSize: 13,
                color: Colors.text.secondary,
                marginTop: 1,
              }}
            >
              {email}
            </Text>
          )}
        </View>

        {isPending && isGroupOwner ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={onApprove}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors.secondary.DEFAULT + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={18} color={Colors.secondary.DEFAULT} strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onReject}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors.danger.DEFAULT + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={Colors.danger.DEFAULT} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ) : isPending ? (
          <Badge label="Pending" variant="warning" />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {member.role === "assistant" && (
              <Shield size={16} color={Colors.primary.DEFAULT} />
            )}
            <Badge
              label={member.role === "assistant" ? "Assistant" : "Member"}
              variant={member.role === "assistant" ? "primary" : "neutral"}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

export default function MembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { groups, organizations } = useGroupStore();
  const profile = useAuthStore((s) => s.profile);
  const group = groups.find((g) => g.id === groupId);

  // Ownership check: current user must own the org that owns this group
  const isGroupOwner = !!group && organizations.some(
    (org: Organization) => org.id === group.organization_id
  );

  const {
    members,
    pendingMembers,
    isLoading,
    approveMember,
    rejectMember,
    removeMember,
    totalActive,
    fetchMembers,
  } = useMembers(groupId);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  const handleApprove = async (memberId: string, memberName: string) => {
    try {
      await approveMember(memberId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Approved", `${memberName} has been added to the group.`);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to approve member.");
    }
  };

  const handleReject = (memberId: string, memberName: string) => {
    Alert.alert("Reject Request", `Decline ${memberName}'s join request?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectMember(memberId);
          } catch {
            Alert.alert("Error", "Failed to reject member.");
          }
        },
      },
    ]);
  };

  const sections = [
    ...(pendingMembers.length > 0
      ? [{ title: `Pending Approval (${pendingMembers.length})`, data: pendingMembers }]
      : []),
    ...(members.length > 0
      ? [{ title: `Active Members (${totalActive})`, data: members }]
      : []),
  ];

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
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.text.primary,
            }}
          >
            Members
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {group?.name} {totalActive > 0 ? `(${totalActive})` : ""}
          </Text>
        </View>
      </View>

      {sections.length === 0 && !isLoading ? (
        <EmptyState
          icon={<UserPlus size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />}
          title="No members yet"
          description="Share the invite code to let participants join this group."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.DEFAULT}
              colors={[Colors.primary.DEFAULT]}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: Colors.text.secondary,
                marginTop: 16,
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const name =
              item.profile?.full_name ?? item.child?.full_name ?? "Unknown";
            return (
              <MemberRow
                member={item}
                isGroupOwner={isGroupOwner}
                onApprove={() => handleApprove(item.id, name)}
                onReject={() => handleReject(item.id, name)}
                onRemove={() => removeMember(item.id)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

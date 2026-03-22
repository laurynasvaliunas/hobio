import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Share } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Share2,
  Settings,
  ClipboardList,
  Megaphone,
  Clock,
  CreditCard,
  Settings2,
  Percent,
  FileText,
  Receipt,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge, Button } from "../../../../src/components/ui";
import { Colors, Shadows } from "../../../../src/constants/colors";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import type { Organization, Session } from "../../../../src/types/database.types";
import { useSessions } from "../../../../src/hooks/useSessions";
import { useMembers } from "../../../../src/hooks/useMembers";
import { formatCurrency, formatDate, formatSessionTime } from "../../../../src/lib/helpers";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: number;
}

function QuickAction({ icon, label, onPress, badge }: QuickActionProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ alignItems: "center", gap: 6, flex: 1 }}>
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: Colors.primary.light + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        {badge && badge > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: Colors.danger.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFF" }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{ fontSize: 12, fontWeight: "500", color: Colors.text.secondary, textAlign: "center" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { groups, organizations } = useGroupStore();
  const profile = useAuthStore((s) => s.profile);

  const group = groups.find((g) => g.id === groupId);

  // Ownership = user owns the organization that contains this group.
  // Never rely solely on profile.role because any organizer could navigate to any group.
  const isGroupOwner = !!group && organizations.some(
    (org: Organization) => org.id === group.organization_id
  );

  const { sessions } = useSessions({ groupId });
  const { members, pendingMembers, totalActive } = useMembers(groupId);

  // Upcoming sessions (non-cancelled, future)
  const now = new Date();
  const upcoming = sessions
    .filter((s) => new Date(s.starts_at) >= now && !s.is_cancelled)
    .slice(0, 3);

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: Colors.text.secondary }}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShareInvite = async () => {
    if (group.invite_code) {
      await Share.share({
        message: `Join "${group.name}" on Hobio! Use invite code: ${group.invite_code}\n\nhobio://join/${group.invite_code}`,
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Colored header */}
        <View
          style={{
            backgroundColor: group.color,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {isGroupOwner && (
              <TouchableOpacity onPress={() => router.push(`/(tabs)/groups/${groupId}/schedule-setup` as never)}>
                <Settings size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={{ fontSize: 28, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 }}>
            {group.name}
          </Text>
          {group.description && (
            <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 22, marginBottom: 8 }}>
              {group.description}
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            {group.age_group && (
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>{group.age_group}</Text>
              </View>
            )}
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
                {totalActive} member{totalActive !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          {/* Invite Code */}
          {group.invite_code && isGroupOwner && (
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: Colors.text.secondary, marginBottom: 4 }}>
                    INVITE CODE
                  </Text>
                  <Text style={{ fontSize: 28, fontWeight: "800", color: Colors.primary.DEFAULT, letterSpacing: 4 }}>
                    {group.invite_code}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleShareInvite}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: Colors.primary.light + "20",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Share2 size={20} color={Colors.primary.DEFAULT} />
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Quick actions - row 1 */}
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row" }}>
              <QuickAction
                icon={<Users size={22} color={Colors.primary.DEFAULT} />}
                label="Members"
                badge={pendingMembers.length}
                onPress={() => router.push(`/(tabs)/groups/${groupId}/members` as never)}
              />
              <QuickAction
                icon={<Calendar size={22} color={Colors.primary.DEFAULT} />}
                label="Sessions"
                onPress={() => router.push(`/(tabs)/groups/${groupId}/sessions` as never)}
              />
              <QuickAction
                icon={<Receipt size={22} color={Colors.primary.DEFAULT} />}
                label="Billing"
                onPress={() => router.push(`/(tabs)/groups/${groupId}/invoices` as never)}
              />
              <QuickAction
                icon={<FileText size={22} color={Colors.primary.DEFAULT} />}
                label="Documents"
                onPress={() => router.push(`/(tabs)/groups/${groupId}/documents` as never)}
              />
            </View>
          </Card>
          {/* Quick actions - row 2 (owner only) */}
          {isGroupOwner && (
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row" }}>
                <QuickAction
                  icon={<Settings2 size={22} color={Colors.primary.DEFAULT} />}
                  label="Schedule"
                  onPress={() => router.push(`/(tabs)/groups/${groupId}/schedule-setup` as never)}
                />
                <QuickAction
                  icon={<Megaphone size={22} color={Colors.primary.DEFAULT} />}
                  label="Announce"
                  onPress={() => router.push("/modals/create-announcement")}
                />
                <View style={{ flex: 1 }} />
                <View style={{ flex: 1 }} />
              </View>
            </Card>
          )}

          {/* Details */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.text.primary, marginBottom: 14 }}>
              Details
            </Text>
            {group.price_per_month != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <DollarSign size={18} color={Colors.text.secondary} />
                <Text style={{ fontSize: 15, color: Colors.text.primary }}>
                  {formatCurrency(group.price_per_month, group.currency)} / month
                </Text>
              </View>
            )}
            {group.max_participants != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Users size={18} color={Colors.text.secondary} />
                <Text style={{ fontSize: 15, color: Colors.text.primary }}>
                  {totalActive} / {group.max_participants} participants
                </Text>
              </View>
            )}
            {group.skill_level && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Percent size={18} color={Colors.text.secondary} />
                <Text style={{ fontSize: 15, color: Colors.text.primary }}>
                  {group.skill_level.charAt(0).toUpperCase() + group.skill_level.slice(1)} level
                </Text>
              </View>
            )}
          </Card>

          {/* Upcoming sessions */}
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.text.primary }}>
                Upcoming Sessions
              </Text>
              {sessions.length > 0 && (
                <TouchableOpacity onPress={() => router.push(`/(tabs)/groups/${groupId}/sessions` as never)}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary.DEFAULT }}>
                    See all
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {upcoming.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
                <Calendar size={28} color={Colors.primary.light} strokeWidth={1.5} />
                <Text style={{ fontSize: 14, color: Colors.text.secondary, textAlign: "center" }}>
                  {isGroupOwner
                    ? "No upcoming sessions.\nSet up a recurring schedule to generate them."
                    : "No upcoming sessions scheduled."}
                </Text>
                {isGroupOwner && (
                  <Button
                    title="Set Up Schedule"
                    onPress={() => router.push(`/(tabs)/groups/${groupId}/schedule-setup` as never)}
                    size="sm"
                    fullWidth={false}
                    style={{ marginTop: 4, paddingHorizontal: 20 }}
                  />
                )}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {upcoming.map((session) => (
                  <View
                    key={session.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        backgroundColor: group.color + "15",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Clock size={18} color={group.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.text.primary }}>
                        {formatDate(session.starts_at)}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
                        {formatSessionTime(session.starts_at, session.ends_at)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

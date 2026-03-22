import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  DollarSign,
  Check,
  Clock,
  TrendingUp,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge, EmptyState } from "../../../../src/components/ui";
import { Colors } from "../../../../src/constants/colors";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import { useMembers } from "../../../../src/hooks/useMembers";
import { usePayments, type PaymentRecord } from "../../../../src/hooks/usePayments";
import { formatCurrency } from "../../../../src/lib/helpers";
import { format } from "date-fns";

function PaymentRow({
  record,
  isOrganizer,
  onToggle,
}: {
  record: PaymentRecord;
  isOrganizer: boolean;
  onToggle: () => void;
}) {
  const isPaid = record.status === "paid";

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={record.memberName} size={40} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: Colors.text.primary,
            }}
          >
            {record.memberName}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {formatCurrency(record.amount, record.currency)}
          </Text>
        </View>

        {isOrganizer ? (
          <TouchableOpacity
            onPress={onToggle}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: isPaid
                ? Colors.secondary.DEFAULT + "20"
                : Colors.danger.DEFAULT + "15",
              borderWidth: 1.5,
              borderColor: isPaid
                ? Colors.secondary.DEFAULT
                : Colors.danger.DEFAULT + "40",
            }}
          >
            {isPaid ? (
              <Check size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
            ) : (
              <Clock size={16} color={Colors.danger.DEFAULT} />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isPaid ? Colors.secondary.DEFAULT : Colors.danger.DEFAULT,
              }}
            >
              {isPaid ? "Paid" : "Unpaid"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Badge
            label={isPaid ? "Paid" : "Unpaid"}
            variant={isPaid ? "secondary" : "danger"}
            size="md"
          />
        )}
      </View>
    </Card>
  );
}

export default function PaymentsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { groups } = useGroupStore();
  const group = groups.find((g) => g.id === groupId);
  const isOrganizer = profile?.role === "organizer";

  const { members } = useMembers(groupId);
  const { records, togglePaid, stats, currentMonth } = usePayments(
    members,
    group?.price_per_month ?? null,
    group?.currency ?? "EUR"
  );

  const monthLabel = format(new Date(currentMonth + "-01"), "MMMM yyyy");

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
            Payments
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {group?.name} - {monthLabel}
          </Text>
        </View>
      </View>

      {/* Stats cards */}
      {isOrganizer && stats.totalMembers > 0 && (
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <Card style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: Colors.secondary.DEFAULT,
              }}
            >
              {stats.paidCount}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 2 }}>
              Paid
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: Colors.danger.DEFAULT,
              }}
            >
              {stats.unpaidCount}
            </Text>
            <Text style={{ fontSize: 12, color: Colors.text.secondary, marginTop: 2 }}>
              Unpaid
            </Text>
          </Card>
          <Card style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}>
            <TrendingUp size={20} color={Colors.primary.DEFAULT} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: Colors.text.primary,
                marginTop: 4,
              }}
            >
              {formatCurrency(stats.totalCollected, stats.currency)}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.text.secondary }}>
              of {formatCurrency(stats.totalExpected, stats.currency)}
            </Text>
          </Card>
        </View>
      )}

      {/* Payment list */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.memberId}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          ...(records.length === 0 ? { flex: 1 } : {}),
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PaymentRow
            record={item}
            isOrganizer={isOrganizer ?? false}
            onToggle={() => togglePaid(item.memberId)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={
              <DollarSign size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />
            }
            title="No payment data"
            description="Payment tracking will appear once members join this group."
          />
        }
      />
    </SafeAreaView>
  );
}

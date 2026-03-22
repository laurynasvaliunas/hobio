import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  DollarSign,
  Check,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Receipt,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge, Button, EmptyState } from "../../../../src/components/ui";
import { useToast } from "../../../../src/components/ui/Toast";
import { Colors } from "../../../../src/constants/colors";
import { useGroupStore } from "../../../../src/stores/groupStore";
import { useAuthStore } from "../../../../src/stores/authStore";
import { useMembers } from "../../../../src/hooks/useMembers";
import type { Organization } from "../../../../src/types/database.types";
import { useInvoices, type InvoiceWithMember } from "../../../../src/hooks/useInvoices";
import { formatCurrency, formatDate } from "../../../../src/lib/helpers";

interface RevenueChartProps {
  stats: ReturnType<typeof useInvoices>["stats"];
}

function RevenueChart({ stats }: RevenueChartProps) {
  const paidPercent = stats.totalExpected > 0
    ? (stats.totalReceived / stats.totalExpected) * 100
    : 0;

  return (
    <Card style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.text.primary, marginBottom: 16 }}>
        Revenue Overview
      </Text>

      {/* Bar chart representation */}
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            height: 28,
            borderRadius: 14,
            backgroundColor: Colors.border,
            overflow: "hidden",
            flexDirection: "row",
          }}
        >
          <View
            style={{
              width: `${Math.min(paidPercent, 100)}%`,
              height: "100%",
              backgroundColor: Colors.secondary.DEFAULT,
              borderRadius: 14,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
            Collected: {formatCurrency(stats.totalReceived, "EUR")}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
            Expected: {formatCurrency(stats.totalExpected, "EUR")}
          </Text>
        </View>
      </View>

      {/* Stat grid */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.secondary.DEFAULT + "15",
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.secondary.DEFAULT }}>
            {stats.paidCount}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.text.secondary, marginTop: 2 }}>Paid</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.warning.DEFAULT + "20",
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.warning.dark }}>
            {stats.unpaidCount}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.text.secondary, marginTop: 2 }}>Unpaid</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.primary.light + "15",
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.primary.DEFAULT }}>
            {stats.collectionRate}%
          </Text>
          <Text style={{ fontSize: 11, color: Colors.text.secondary, marginTop: 2 }}>Rate</Text>
        </View>
      </View>
    </Card>
  );
}

interface InvoiceRowProps {
  invoice: InvoiceWithMember;
  isOrganizer: boolean;
  onToggle: () => void;
}

function InvoiceRow({ invoice, isOrganizer, onToggle }: InvoiceRowProps) {
  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={invoice.memberName ?? "?"} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text.primary }}>
            {invoice.memberName}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {formatCurrency(invoice.amount, invoice.currency)} · {invoice.period_start} → {invoice.period_end}
          </Text>
        </View>

        {isOrganizer ? (
          <TouchableOpacity
            onPress={onToggle}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: isPaid
                ? Colors.secondary.DEFAULT + "20"
                : isOverdue
                ? Colors.danger.DEFAULT + "15"
                : Colors.warning.DEFAULT + "20",
              borderWidth: 1.5,
              borderColor: isPaid
                ? Colors.secondary.DEFAULT
                : isOverdue
                ? Colors.danger.DEFAULT + "40"
                : Colors.warning.dark + "40",
            }}
          >
            {isPaid ? (
              <Check size={15} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
            ) : isOverdue ? (
              <AlertTriangle size={15} color={Colors.danger.DEFAULT} />
            ) : (
              <Clock size={15} color={Colors.warning.dark} />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isPaid
                  ? Colors.secondary.DEFAULT
                  : isOverdue
                  ? Colors.danger.DEFAULT
                  : Colors.warning.dark,
              }}
            >
              {isPaid ? "Paid" : isOverdue ? "Overdue" : "Unpaid"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Badge
            label={isPaid ? "Paid" : isOverdue ? "Overdue" : "Unpaid"}
            variant={isPaid ? "secondary" : isOverdue ? "danger" : "warning"}
            size="md"
          />
        )}
      </View>
    </Card>
  );
}

export default function InvoicesScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { groups, organizations } = useGroupStore();
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast();
  const group = groups.find((g) => g.id === groupId);

  // Only the group's org owner can generate invoices and see all billing data
  const isGroupOwner = !!group && organizations.some(
    (org: Organization) => org.id === group.organization_id
  );
  const isOrganizer = isGroupOwner;

  const { members } = useMembers(groupId);
  const {
    invoices,
    isLoading,
    generateInvoices,
    markPaid,
    markUnpaid,
    stats,
  } = useInvoices(groupId, members);

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!group) return;
    setGenerating(true);
    try {
      const count = await generateInvoices(
        group.price_per_month ?? 0,
        group.currency,
        "monthly"
      );
      if (count > 0) {
        toast.show(`${count} invoice(s) generated`);
      } else {
        toast.show("All invoices already exist for this period", "info");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Generation failed";
      Alert.alert("Error", msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (invoice: InvoiceWithMember) => {
    if (!profile) return;
    try {
      if (invoice.status === "paid") {
        await markUnpaid(invoice.id);
        toast.show("Marked as unpaid");
      } else {
        await markPaid(invoice.id, profile.id);
        toast.show("Marked as paid");
      }
    } catch {
      toast.show("Failed to update payment", "error");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={["top"]}>
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
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.text.primary }}>
            Billing
          </Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary }}>
            {group?.name}
          </Text>
        </View>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          ...(invoices.length === 0 && !isOrganizer ? { flex: 1 } : {}),
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isOrganizer ? (
            <View>
              <RevenueChart stats={stats} />
              <Button
                title="Generate Invoices"
                onPress={handleGenerate}
                loading={generating}
                variant="secondary"
                icon={<RefreshCw size={16} color="#FFF" />}
                size="sm"
                style={{ marginBottom: 16 }}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <InvoiceRow
            invoice={item}
            isOrganizer={isOrganizer ?? false}
            onToggle={() => handleToggle(item)}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<Receipt size={36} color={Colors.primary.DEFAULT} strokeWidth={1.5} />}
              title="No invoices yet"
              description={
                isOrganizer
                  ? "Generate invoices for the current billing period."
                  : "No invoices have been generated for you yet."
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  DollarSign,
  Check,
  Clock,
  AlertTriangle,
  Search,
  TrendingUp,
  Filter,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge } from "../../../src/components/ui";
import { useTheme } from "../../../src/hooks/useTheme";
import { Fonts } from "../../../src/constants/fonts";
import { useAuthStore } from "../../../src/stores/authStore";
import { useGroupStore } from "../../../src/stores/groupStore";
import { formatCurrency } from "../../../src/lib/helpers";
import { supabase } from "../../../src/lib/supabase";
import type { InvoiceStatus } from "../../../src/types/database.types";

interface PaymentOverviewItem {
  id: string;
  memberName: string;
  groupName: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
}

export default function PaymentsOverview() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { groups } = useGroupStore();

  const [payments, setPayments] = useState<PaymentOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");

  const fetchPayments = useCallback(async () => {
    if (groups.length === 0) return;
    const groupIds = groups.map((g) => g.id);

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, profiles:profile_id(full_name), groups:group_id(name)")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items: PaymentOverviewItem[] = (data ?? []).map((inv: Record<string, unknown>) => ({
        id: inv.id as string,
        memberName:
          (inv.profiles as Record<string, unknown>)?.full_name as string ?? "Unknown",
        groupName:
          (inv.groups as Record<string, unknown>)?.name as string ?? "Unknown",
        amount: inv.amount as number,
        currency: inv.currency as string,
        status: inv.status as InvoiceStatus,
        periodStart: inv.period_start as string,
        periodEnd: inv.period_end as string,
        paidAt: inv.paid_at as string | null,
      }));

      setPayments(items);
    } catch (err) {
      console.error("Fetch payments overview error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groups]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  }, [fetchPayments]);

  // Filter + search
  const filtered = payments.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLocaleLowerCase();
      return (
        p.memberName.toLocaleLowerCase().includes(q) ||
        p.groupName.toLocaleLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").length;

  const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
    paid: { bg: colors.secondary.DEFAULT + "20", text: colors.secondary.DEFAULT },
    unpaid: { bg: colors.warning.DEFAULT + "25", text: colors.warning.dark },
    overdue: { bg: colors.danger.DEFAULT + "20", text: colors.danger.DEFAULT },
    cancelled: { bg: colors.text.secondary + "20", text: colors.text.secondary },
    refunded: { bg: colors.primary.DEFAULT + "20", text: colors.primary.DEFAULT },
  };

  const FILTER_OPTIONS: { value: InvoiceStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "unpaid", label: "Unpaid" },
    { value: "overdue", label: "Overdue" },
  ];

  const currency = groups[0]?.currency ?? "EUR";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
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
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontFamily: Fonts.bold, color: colors.text.primary }}>
          Payments Overview
        </Text>
      </View>

      {/* Summary cards */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 20,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 14,
            ...shadows.card,
          }}
        >
          <TrendingUp size={18} color={colors.secondary.DEFAULT} />
          <Text
            style={{
              fontSize: 20,
              fontFamily: Fonts.extraBold,
              color: colors.text.primary,
              marginTop: 6,
            }}
          >
            {formatCurrency(totalPaid, currency)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: Fonts.medium,
              color: colors.text.secondary,
            }}
          >
            Total collected
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 14,
            ...shadows.card,
          }}
        >
          <AlertTriangle size={18} color={colors.danger.DEFAULT} />
          <Text
            style={{
              fontSize: 20,
              fontFamily: Fonts.extraBold,
              color: totalOverdue > 0 ? colors.danger.DEFAULT : colors.text.primary,
              marginTop: 6,
            }}
          >
            {totalOverdue}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: Fonts.medium,
              color: colors.text.secondary,
            }}
          >
            Overdue
          </Text>
        </View>
      </View>

      {/* Search + Filters */}
      <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 44,
            gap: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Search size={18} color={colors.text.secondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or group..."
            placeholderTextColor={colors.text.secondary + "80"}
            autoCorrect={false}
            autoCapitalize="none"
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: Fonts.regular,
              color: colors.text.primary,
            }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterStatus(opt.value);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor:
                  filterStatus === opt.value ? colors.primary.DEFAULT : colors.surface,
                borderWidth: 1,
                borderColor:
                  filterStatus === opt.value ? colors.primary.DEFAULT : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: Fonts.semiBold,
                  color:
                    filterStatus === opt.value ? "#FFF" : colors.text.secondary,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.unpaid;

          return (
            <Card style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={item.memberName} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: Fonts.semiBold,
                      color: colors.text.primary,
                    }}
                  >
                    {item.memberName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: Fonts.regular,
                      color: colors.text.secondary,
                    }}
                  >
                    {item.groupName}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: Fonts.bold,
                      color: colors.text.primary,
                    }}
                  >
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: statusStyle.bg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: Fonts.semiBold,
                        color: statusStyle.text,
                        textTransform: "capitalize",
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
            <DollarSign size={36} color={colors.text.secondary} strokeWidth={1.5} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: Fonts.medium,
                color: colors.text.secondary,
              }}
            >
              No payment records found.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

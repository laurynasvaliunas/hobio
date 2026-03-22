import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import {
  AlertTriangle,
  DollarSign,
  UserPlus,
  CheckCircle,
  ChevronRight,
  Users,
} from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { Fonts } from "../../constants/fonts";
import { supabase } from "../../lib/supabase";
import type { Group } from "../../types/database.types";

interface ExceptionItem {
  type: "red" | "yellow" | "green";
  icon: React.ReactNode;
  label: string;
  count: number;
  onPress?: () => void;
}

interface Props {
  groups: Group[];
  onPressInvoices?: () => void;
  onPressJoinRequests?: () => void;
  onPressTodaySession?: () => void;
}

/**
 * "Pulse" Exceptions Card — Business solvency at a glance.
 *
 * Red Alert:    Unpaid/Overdue invoices
 * Yellow Alert: Pending join requests
 * Green Status: Today's confirmed attendance
 */
export function ExceptionsCard({
  groups,
  onPressInvoices,
  onPressJoinRequests,
  onPressTodaySession,
}: Props) {
  const { colors, shadows } = useTheme();
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [pendingJoins, setPendingJoins] = useState(0);
  const [confirmedToday, setConfirmedToday] = useState({ confirmed: 0, total: 0 });

  const fetchExceptions = useCallback(async () => {
    if (groups.length === 0) return;
    const groupIds = groups.map((g) => g.id);

    try {
      // Unpaid / overdue invoices
      const { count: unpaid } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .in("group_id", groupIds)
        .in("status", ["unpaid", "overdue"]);

      setUnpaidCount(unpaid ?? 0);

      // Pending join requests (members with status "pending")
      const { count: pending } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .in("group_id", groupIds)
        .eq("status", "pending");

      setPendingJoins(pending ?? 0);

      // Today's attendance: total active members vs confirmed present
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: todaySessions } = await supabase
        .from("sessions")
        .select("id")
        .in("group_id", groupIds)
        .gte("starts_at", todayStr + "T00:00:00")
        .lte("starts_at", todayStr + "T23:59:59")
        .eq("is_cancelled", false);

      if (todaySessions && todaySessions.length > 0) {
        const sessionIds = todaySessions.map((s) => s.id);

        const { count: totalMembers } = await supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .in("group_id", groupIds)
          .eq("status", "active");

        const { count: presentCount } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .in("session_id", sessionIds)
          .eq("status", "present");

        setConfirmedToday({
          confirmed: presentCount ?? 0,
          total: totalMembers ?? 0,
        });
      }
    } catch (err) {
      console.error("Exceptions fetch error:", err);
    }
  }, [groups]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const items: ExceptionItem[] = [];

  if (unpaidCount > 0) {
    items.push({
      type: "red",
      icon: <DollarSign size={18} color={colors.danger.DEFAULT} />,
      label: `${unpaidCount} Unpaid Invoice${unpaidCount !== 1 ? "s" : ""}`,
      count: unpaidCount,
      onPress: onPressInvoices,
    });
  }

  if (pendingJoins > 0) {
    items.push({
      type: "yellow",
      icon: <UserPlus size={18} color={colors.warning.dark} />,
      label: `${pendingJoins} Pending Join Request${pendingJoins !== 1 ? "s" : ""}`,
      count: pendingJoins,
      onPress: onPressJoinRequests,
    });
  }

  if (confirmedToday.total > 0) {
    items.push({
      type: "green",
      icon: <Users size={18} color={colors.secondary.DEFAULT} />,
      label: `Today: ${confirmedToday.confirmed}/${confirmedToday.total} Confirmed`,
      count: confirmedToday.confirmed,
      onPress: onPressTodaySession,
    });
  }

  // All clear
  if (items.length === 0 && groups.length > 0) {
    items.push({
      type: "green",
      icon: <CheckCircle size={18} color={colors.secondary.DEFAULT} />,
      label: "All clear — no exceptions",
      count: 0,
    });
  }

  if (groups.length === 0) return null;

  const borderColor =
    items[0]?.type === "red"
      ? colors.danger.DEFAULT
      : items[0]?.type === "yellow"
      ? colors.warning.DEFAULT
      : colors.secondary.DEFAULT;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        ...shadows.card,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: items.length > 1 ? 12 : 0,
        }}
      >
        <AlertTriangle
          size={16}
          color={
            items[0]?.type === "red"
              ? colors.danger.DEFAULT
              : items[0]?.type === "yellow"
              ? colors.warning.dark
              : colors.secondary.DEFAULT
          }
        />
        <Text
          style={{
            fontSize: 14,
            fontFamily: Fonts.bold,
            color: colors.text.primary,
          }}
        >
          Pulse Check
        </Text>
      </View>

      {items.map((item, index) => {
        const bgColor =
          item.type === "red"
            ? colors.danger.DEFAULT + "10"
            : item.type === "yellow"
            ? colors.warning.DEFAULT + "15"
            : colors.secondary.DEFAULT + "10";

        return (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            activeOpacity={item.onPress ? 0.6 : 1}
            disabled={!item.onPress}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: bgColor,
              marginBottom: index < items.length - 1 ? 6 : 0,
            }}
          >
            {item.icon}
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: Fonts.semiBold,
                color: colors.text.primary,
              }}
            >
              {item.label}
            </Text>
            {item.onPress && (
              <ChevronRight size={16} color={colors.text.secondary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

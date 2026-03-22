import { useState } from "react";
import type { MemberWithDetails } from "./useMembers";

// UI-only payment tracking (no DB table yet)
// Stored locally until Stripe integration in Phase 5

export interface PaymentRecord {
  memberId: string;
  memberName: string;
  month: string; // "2026-02"
  status: "paid" | "unpaid" | "overdue";
  amount: number;
  currency: string;
  paidAt?: string;
}

/**
 * Generate mock payment records from members for the current month.
 * In production, this would query a payments table.
 */
export function usePayments(
  members: MemberWithDetails[],
  pricePerMonth: number | null,
  currency: string = "EUR"
) {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"

  // In-memory payment state (UI only)
  const [paidMembers, setPaidMembers] = useState<Set<string>>(new Set());

  const records: PaymentRecord[] = members.map((member) => {
    const name =
      member.profile?.full_name ?? member.child?.full_name ?? "Unknown";
    const isPaid = paidMembers.has(member.id);

    return {
      memberId: member.id,
      memberName: name,
      month: currentMonth,
      status: isPaid ? "paid" : "unpaid",
      amount: pricePerMonth ?? 0,
      currency,
      paidAt: isPaid ? new Date().toISOString() : undefined,
    };
  });

  const togglePaid = (memberId: string) => {
    setPaidMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const stats = {
    totalMembers: members.length,
    paidCount: paidMembers.size,
    unpaidCount: members.length - paidMembers.size,
    totalExpected: (pricePerMonth ?? 0) * members.length,
    totalCollected: (pricePerMonth ?? 0) * paidMembers.size,
    currency,
  };

  return {
    records,
    togglePaid,
    stats,
    currentMonth,
  };
}

import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addMonths,
  addQuarters,
  addYears,
  format,
} from "date-fns";
import type { BillingPeriod, Invoice } from "../types/database.types";
import type { MemberWithDetails } from "../hooks/useMembers";

interface BillingRange {
  periodStart: string;
  periodEnd: string;
}

/**
 * Get the billing range for a given period type and reference date.
 */
export function getBillingRange(
  period: BillingPeriod,
  referenceDate: Date = new Date()
): BillingRange {
  switch (period) {
    case "monthly":
      return {
        periodStart: format(startOfMonth(referenceDate), "yyyy-MM-dd"),
        periodEnd: format(endOfMonth(referenceDate), "yyyy-MM-dd"),
      };
    case "quarterly":
      return {
        periodStart: format(startOfQuarter(referenceDate), "yyyy-MM-dd"),
        periodEnd: format(endOfQuarter(referenceDate), "yyyy-MM-dd"),
      };
    case "yearly":
      return {
        periodStart: format(startOfYear(referenceDate), "yyyy-MM-dd"),
        periodEnd: format(endOfYear(referenceDate), "yyyy-MM-dd"),
      };
    case "one_time":
      return {
        periodStart: format(referenceDate, "yyyy-MM-dd"),
        periodEnd: format(referenceDate, "yyyy-MM-dd"),
      };
  }
}

/**
 * Get the next billing range after a given period.
 */
export function getNextBillingRange(
  period: BillingPeriod,
  currentDate: Date = new Date()
): BillingRange {
  switch (period) {
    case "monthly":
      return getBillingRange(period, addMonths(currentDate, 1));
    case "quarterly":
      return getBillingRange(period, addQuarters(currentDate, 1));
    case "yearly":
      return getBillingRange(period, addYears(currentDate, 1));
    case "one_time":
      return getBillingRange(period, currentDate);
  }
}

/**
 * Generate invoice records for all active members of a group.
 * Returns Omit<Invoice, 'id' | 'created_at'>[] ready for DB insert.
 */
export function generateInvoiceRecords(
  groupId: string,
  members: MemberWithDetails[],
  amount: number,
  currency: string,
  billingPeriod: BillingPeriod,
  existingInvoices: Invoice[],
  referenceDate: Date = new Date()
): Omit<Invoice, "id" | "created_at">[] {
  const { periodStart, periodEnd } = getBillingRange(billingPeriod, referenceDate);

  // Check which members already have an invoice for this period
  const existingSet = new Set(
    existingInvoices
      .filter((inv) => inv.period_start === periodStart)
      .map((inv) => inv.member_id)
  );

  const invoices: Omit<Invoice, "id" | "created_at">[] = [];

  for (const member of members) {
    if (existingSet.has(member.id)) continue; // Skip already invoiced
    if (member.status !== "active") continue;

    invoices.push({
      group_id: groupId,
      member_id: member.id,
      profile_id: member.profile_id,
      child_id: member.child_id,
      amount,
      currency,
      billing_period: billingPeriod,
      period_start: periodStart,
      period_end: periodEnd,
      status: "unpaid",
      paid_at: null,
      paid_marked_by: null,
      notes: null,
    });
  }

  return invoices;
}

/**
 * Compute revenue stats from invoices.
 */
export function computeRevenueStats(invoices: Invoice[]) {
  const totalExpected = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReceived = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const paidCount = invoices.filter((inv) => inv.status === "paid").length;
  const unpaidCount = invoices.filter((inv) => inv.status === "unpaid").length;
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  return {
    totalExpected,
    totalReceived,
    totalOverdue,
    paidCount,
    unpaidCount,
    overdueCount,
    totalInvoices: invoices.length,
    collectionRate:
      invoices.length > 0
        ? Math.round((paidCount / invoices.length) * 100)
        : 0,
  };
}

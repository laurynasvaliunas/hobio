import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Invoice, InvoiceStatus, BillingPeriod } from "../types/database.types";
import type { MemberWithDetails } from "./useMembers";
import { generateInvoiceRecords, getBillingRange, computeRevenueStats } from "../lib/billing";

export interface InvoiceWithMember extends Invoice {
  memberName?: string;
}

interface UseInvoicesReturn {
  invoices: InvoiceWithMember[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  generateInvoices: (amount: number, currency: string, billingPeriod: BillingPeriod) => Promise<number>;
  markPaid: (invoiceId: string, markedBy: string) => Promise<void>;
  markUnpaid: (invoiceId: string) => Promise<void>;
  stats: ReturnType<typeof computeRevenueStats>;
}

export function useInvoices(groupId: string, members: MemberWithDetails[] = []): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<InvoiceWithMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const invs = (data as Invoice[]) ?? [];

      // Enrich with member names
      const enriched = invs.map((inv) => {
        const member = members.find((m) => m.id === inv.member_id);
        return {
          ...inv,
          memberName:
            member?.profile?.full_name ?? member?.child?.full_name ?? "Unknown",
        };
      });

      setInvoices(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Fetch invoices error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, members.length]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  /**
   * Generate invoices for all active members for the current billing period.
   * Uses optimistic update to feel instantaneous.
   */
  const generateInvoices = async (
    amount: number,
    currency: string,
    billingPeriod: BillingPeriod
  ) => {
    const records = generateInvoiceRecords(
      groupId,
      members,
      amount,
      currency,
      billingPeriod,
      invoices
    );

    if (records.length === 0) return 0;

    const { data, error } = await supabase
      .from("invoices")
      .insert(records)
      .select();

    if (error) throw error;

    const newInvoices = ((data as Invoice[]) ?? []).map((inv) => {
      const member = members.find((m) => m.id === inv.member_id);
      return {
        ...inv,
        memberName:
          member?.profile?.full_name ?? member?.child?.full_name ?? "Unknown",
      };
    });

    setInvoices((prev) => [...newInvoices, ...prev]);
    return records.length;
  };

  /**
   * Mark an invoice as paid (with optimistic update).
   */
  const markPaid = async (invoiceId: string, markedBy: string) => {
    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: "paid" as InvoiceStatus, paid_at: new Date().toISOString(), paid_marked_by: markedBy }
          : inv
      )
    );

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_marked_by: markedBy,
      })
      .eq("id", invoiceId);

    if (error) {
      // Rollback on error
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: "unpaid" as InvoiceStatus, paid_at: null, paid_marked_by: null }
            : inv
        )
      );
      throw error;
    }
  };

  /**
   * Mark an invoice as unpaid (revert payment, with optimistic update).
   */
  const markUnpaid = async (invoiceId: string) => {
    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: "unpaid" as InvoiceStatus, paid_at: null, paid_marked_by: null }
          : inv
      )
    );

    const { error } = await supabase
      .from("invoices")
      .update({ status: "unpaid", paid_at: null, paid_marked_by: null })
      .eq("id", invoiceId);

    if (error) {
      // Rollback
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, status: "paid" as InvoiceStatus }
            : inv
        )
      );
      throw error;
    }
  };

  // Current period invoices
  const currentPeriodInvoices = invoices; // Already filtered by fetch if needed
  const stats = computeRevenueStats(invoices);

  return {
    invoices,
    isLoading,
    error,
    fetchInvoices,
    generateInvoices,
    markPaid,
    markUnpaid,
    stats,
  };
}

interface UseMyInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for participant to see their own invoices across all groups.
 */
export function useMyInvoices(profileId: string): UseMyInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setError(null);
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setInvoices((data as Invoice[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        console.error("Fetch my invoices error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (profileId) fetch();
  }, [profileId]);

  return { invoices, isLoading, error };
}

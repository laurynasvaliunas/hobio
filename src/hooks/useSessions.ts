import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Session, RecurringSchedule } from "../types/database.types";
import { generateSessionsFromRules } from "../lib/scheduling";
import { addWeeks, startOfDay } from "date-fns";

interface UseSessionsOptions {
  groupId?: string;
  groupIds?: string[];
}

interface UseSessionsReturn {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  createSession: (session: Omit<Session, "id" | "created_at">) => Promise<Session>;
  cancelSession: (sessionId: string, reason: string) => Promise<void>;
  generateFromSchedule: (gId: string) => Promise<number>;
}

export function useSessions({ groupId, groupIds }: UseSessionsOptions = {}): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("sessions")
        .select("*")
        .order("starts_at", { ascending: true });

      if (groupId) {
        query = query.eq("group_id", groupId);
      } else if (groupIds && groupIds.length > 0) {
        query = query.in("group_id", groupIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSessions((data as Session[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Fetch sessions error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, groupIds?.join(",")]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const cancelSession = async (sessionId: string, reason: string) => {
    const { error } = await supabase
      .from("sessions")
      .update({ is_cancelled: true, cancellation_reason: reason })
      .eq("id", sessionId);
    if (error) throw error;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, is_cancelled: true, cancellation_reason: reason }
          : s
      )
    );
  };

  const createSession = async (session: Omit<Session, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("sessions")
      .insert(session)
      .select()
      .single();
    if (error) throw error;
    const newSession = data as Session;
    setSessions((prev) =>
      [...prev, newSession].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
    );
    return newSession;
  };

  const generateFromSchedule = async (gId: string) => {
    // Fetch recurring rules
    const { data: rules, error } = await supabase
      .from("recurring_schedule")
      .select("*")
      .eq("group_id", gId);

    if (error) throw error;
    if (!rules || rules.length === 0) return 0;

    const now = startOfDay(new Date());
    const fourWeeksOut = addWeeks(now, 4);

    // Generate sessions
    const newSessions = generateSessionsFromRules(
      rules as RecurringSchedule[],
      gId,
      now,
      fourWeeksOut
    );

    if (newSessions.length === 0) return 0;

    // Check for existing sessions to avoid duplicates
    const { data: existing } = await supabase
      .from("sessions")
      .select("starts_at")
      .eq("group_id", gId)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", fourWeeksOut.toISOString());

    const existingTimes = new Set(
      (existing ?? []).map((s: { starts_at: string }) => s.starts_at)
    );

    const toInsert = newSessions.filter(
      (s) => !existingTimes.has(s.starts_at)
    );

    if (toInsert.length === 0) return 0;

    const { data: inserted, error: insertError } = await supabase
      .from("sessions")
      .insert(toInsert)
      .select();

    if (insertError) throw insertError;

    setSessions((prev) =>
      [...prev, ...((inserted as Session[]) ?? [])].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
    );

    return toInsert.length;
  };

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    cancelSession,
    generateFromSchedule,
  };
}

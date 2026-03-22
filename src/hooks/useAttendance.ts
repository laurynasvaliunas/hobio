import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Attendance, AttendanceStatus } from "../types/database.types";
import type { MemberWithDetails } from "./useMembers";

export interface AttendanceRecord {
  member: MemberWithDetails;
  attendance: Attendance | null;
}

interface UseAttendanceReturn {
  records: AttendanceRecord[];
  isLoading: boolean;
  fetchAttendance: () => Promise<void>;
  markAttendance: (memberId: string, status: AttendanceStatus, markedBy: string) => Promise<void>;
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unmarked: number;
  };
}

export function useAttendance(sessionId: string, members: MemberWithDetails[]): UseAttendanceReturn {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    if (!sessionId || members.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("session_id", sessionId);

      if (error) throw error;

      const attendanceList = (data as Attendance[]) ?? [];
      const attendanceMap = new Map(
        attendanceList.map((a) => [a.member_id, a])
      );

      const combined = members.map((member) => ({
        member,
        attendance: attendanceMap.get(member.id) ?? null,
      }));

      setRecords(combined);
    } catch (error) {
      console.error("Fetch attendance error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, members.length]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = async (
    memberId: string,
    status: AttendanceStatus,
    markedBy: string
  ) => {
    // Upsert: if attendance exists, update; otherwise insert
    const existing = records.find((r) => r.member.id === memberId)?.attendance;

    if (existing) {
      const { error } = await supabase
        .from("attendance")
        .update({ status, marked_by: markedBy })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          session_id: sessionId,
          member_id: memberId,
          status,
          marked_by: markedBy,
        })
        .select()
        .single();
      if (error) throw error;
    }

    // Update local state
    setRecords((prev) =>
      prev.map((r) =>
        r.member.id === memberId
          ? {
              ...r,
              attendance: {
                ...(r.attendance ?? {
                  id: "",
                  session_id: sessionId,
                  member_id: memberId,
                  marked_at: new Date().toISOString(),
                }),
                status,
                marked_by: markedBy,
              } as Attendance,
            }
          : r
      )
    );
  };

  const stats = {
    total: records.length,
    present: records.filter((r) => r.attendance?.status === "present").length,
    absent: records.filter((r) => r.attendance?.status === "absent").length,
    late: records.filter((r) => r.attendance?.status === "late").length,
    excused: records.filter((r) => r.attendance?.status === "excused").length,
    unmarked: records.filter((r) => !r.attendance).length,
  };

  return {
    records,
    isLoading,
    fetchAttendance,
    markAttendance,
    stats,
  };
}

interface UseMemberAttendanceStatsReturn {
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  };
  isLoading: boolean;
}

/**
 * Hook to get attendance stats for a specific member across all sessions.
 */
export function useMemberAttendanceStats(memberId: string): UseMemberAttendanceStatsReturn {
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from("attendance")
          .select("status")
          .eq("member_id", memberId);

        if (error) throw error;

        const records = (data ?? []) as { status: AttendanceStatus }[];
        const total = records.length;
        const present = records.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;

        setStats({
          total,
          present: records.filter((r) => r.status === "present").length,
          absent: records.filter((r) => r.status === "absent").length,
          late: records.filter((r) => r.status === "late").length,
          excused: records.filter((r) => r.status === "excused").length,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        });
      } catch (error) {
        console.error("Fetch member attendance stats error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (memberId) fetch();
  }, [memberId]);

  return { stats, isLoading };
}

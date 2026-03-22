import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type {
  UserStats,
  XpLog,
  Achievement,
  UserAchievement,
} from "../types/database.types";

/**
 * XP Level calculation (mirrors the SQL function).
 * Level N requires sum(100 * i for i in 1..N-1) total XP.
 */
export function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor((-1 + Math.sqrt(1 + (8 * xp) / 100)) / 2) + 1);
}

/**
 * XP required to reach the NEXT level.
 */
export function xpForNextLevel(currentLevel: number): number {
  let total = 0;
  for (let i = 1; i <= currentLevel; i++) {
    total += 100 * i;
  }
  return total;
}

/**
 * XP required for the current level.
 */
export function xpForCurrentLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  let total = 0;
  for (let i = 1; i < currentLevel; i++) {
    total += 100 * i;
  }
  return total;
}

/**
 * Progress within the current level (0–1).
 */
export function levelProgress(xp: number): number {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForCurrentLevel(level);
  const nextLevelXp = xpForNextLevel(level);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 1;
  return Math.min(1, (xp - currentLevelXp) / range);
}

// ── XP Award Reasons ──
export const XP_AWARDS = {
  SESSION_CHECKIN: { amount: 10, reason: "Session check-in" },
  SPEEDY_PAYER: { amount: 50, reason: "Speedy Payer — paid within 24h" },
  STREAK_WEEK: { amount: 25, reason: "Weekly streak bonus" },
  STREAK_10: { amount: 100, reason: "10-week streak milestone" },
  ACHIEVEMENT_UNLOCK: { amount: 0, reason: "Achievement unlocked" }, // amount set per achievement
} as const;

/**
 * Core gamification hook — manages user stats, XP, achievements, and leaderboard.
 */
export function useGamification(profileId: string) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [recentXp, setRecentXp] = useState<XpLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch user stats ──
  const fetchStats = useCallback(async () => {
    if (!profileId) return;
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      if (error && error.code === "PGRST116") {
        // No stats row — create one
        const { data: newRow } = await supabase
          .from("user_stats")
          .insert({ profile_id: profileId })
          .select()
          .single();
        if (newRow) setStats(newRow as UserStats);
      } else if (data) {
        setStats(data as UserStats);
      }
    } catch (err) {
      console.error("Fetch user stats error:", err);
    }
  }, [profileId]);

  // ── Fetch all achievements + user's unlocked ──
  const fetchAchievements = useCallback(async () => {
    if (!profileId) return;
    try {
      const [{ data: allAch }, { data: userAch }] = await Promise.all([
        supabase.from("achievements").select("*").order("category"),
        supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("profile_id", profileId),
      ]);

      setAchievements((allAch as Achievement[]) ?? []);
      setUnlockedIds(
        new Set((userAch ?? []).map((ua: { achievement_id: string }) => ua.achievement_id)),
      );
    } catch (err) {
      console.error("Fetch achievements error:", err);
    }
  }, [profileId]);

  // ── Fetch recent XP logs ──
  const fetchRecentXp = useCallback(async () => {
    if (!profileId) return;
    try {
      const { data } = await supabase
        .from("xp_logs")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20);

      setRecentXp((data as XpLog[]) ?? []);
    } catch (err) {
      console.error("Fetch XP logs error:", err);
    }
  }, [profileId]);

  // ── Award XP ──
  const awardXp = useCallback(
    async (params: {
      amount: number;
      reason: string;
      sourceType?: string;
      sourceId?: string;
    }) => {
      if (!profileId || params.amount <= 0) return;

      try {
        // Log the XP event
        await supabase.from("xp_logs").insert({
          profile_id: profileId,
          amount: params.amount,
          reason: params.reason,
          source_type: params.sourceType ?? null,
          source_id: params.sourceId ?? null,
        });

        // Update user stats
        const newXp = (stats?.total_xp ?? 0) + params.amount;
        const newLevel = calculateLevel(newXp);

        const { data: updated } = await supabase
          .from("user_stats")
          .update({
            total_xp: newXp,
            level: newLevel,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", profileId)
          .select()
          .single();

        if (updated) setStats(updated as UserStats);

        return { newXp, newLevel, leveledUp: newLevel > (stats?.level ?? 1) };
      } catch (err) {
        console.error("Award XP error:", err);
        return null;
      }
    },
    [profileId, stats],
  );

  // ── Award XP for attendance ──
  const awardAttendanceXp = useCallback(
    async (sessionId: string) => {
      const result = await awardXp({
        amount: XP_AWARDS.SESSION_CHECKIN.amount,
        reason: XP_AWARDS.SESSION_CHECKIN.reason,
        sourceType: "session",
        sourceId: sessionId,
      });

      // Update session count
      if (stats) {
        const newCount = (stats.total_sessions_attended ?? 0) + 1;
        await supabase
          .from("user_stats")
          .update({
            total_sessions_attended: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", profileId);

        setStats((prev) => prev ? { ...prev, total_sessions_attended: newCount } : prev);

        // Check attendance-based achievements
        await checkAttendanceAchievements(newCount);
      }

      return result;
    },
    [awardXp, stats, profileId],
  );

  // ── Award XP for speedy payment ──
  const awardPaymentXp = useCallback(
    async (invoiceId: string) => {
      const result = await awardXp({
        amount: XP_AWARDS.SPEEDY_PAYER.amount,
        reason: XP_AWARDS.SPEEDY_PAYER.reason,
        sourceType: "invoice",
        sourceId: invoiceId,
      });

      if (stats) {
        const newCount = (stats.total_invoices_paid ?? 0) + 1;
        await supabase
          .from("user_stats")
          .update({
            total_invoices_paid: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", profileId);

        setStats((prev) => prev ? { ...prev, total_invoices_paid: newCount } : prev);
      }

      return result;
    },
    [awardXp, stats, profileId],
  );

  // ── Update streak ──
  const updateStreak = useCallback(
    async (newStreak: number) => {
      if (!profileId) return;
      const longest = Math.max(newStreak, stats?.longest_streak ?? 0);

      await supabase
        .from("user_stats")
        .update({
          current_streak: newStreak,
          longest_streak: longest,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", profileId);

      setStats((prev) =>
        prev ? { ...prev, current_streak: newStreak, longest_streak: longest } : prev,
      );

      // Check streak achievements
      await checkStreakAchievements(newStreak);
    },
    [profileId, stats],
  );

  // ── Check & unlock achievements ──
  const checkAttendanceAchievements = useCallback(
    async (sessionCount: number) => {
      const attendanceAch = achievements.filter((a) => a.category === "attendance" && a.threshold);
      for (const ach of attendanceAch) {
        if (ach.threshold && sessionCount >= ach.threshold && !unlockedIds.has(ach.id)) {
          await unlockAchievement(ach);
        }
      }
    },
    [achievements, unlockedIds],
  );

  const checkStreakAchievements = useCallback(
    async (streak: number) => {
      const streakAch = achievements.filter((a) => a.category === "streak" && a.threshold);
      for (const ach of streakAch) {
        if (ach.threshold && streak >= ach.threshold && !unlockedIds.has(ach.id)) {
          await unlockAchievement(ach);
        }
      }
    },
    [achievements, unlockedIds],
  );

  const unlockAchievement = useCallback(
    async (achievement: Achievement) => {
      if (!profileId || unlockedIds.has(achievement.id)) return;

      try {
        await supabase.from("user_achievements").insert({
          profile_id: profileId,
          achievement_id: achievement.id,
        });

        setUnlockedIds((prev) => new Set([...prev, achievement.id]));

        // Award bonus XP for the achievement
        if (achievement.xp_reward > 0) {
          await awardXp({
            amount: achievement.xp_reward,
            reason: `Achievement: ${achievement.title}`,
            sourceType: "achievement",
            sourceId: achievement.id,
          });
        }
      } catch (err) {
        // Ignore duplicate inserts
        console.error("Unlock achievement error:", err);
      }
    },
    [profileId, unlockedIds, awardXp],
  );

  // ── Toggle leaderboard visibility ──
  const toggleLeaderboard = useCallback(
    async (show: boolean) => {
      if (!profileId) return;
      await supabase
        .from("user_stats")
        .update({ show_on_leaderboard: show, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId);

      setStats((prev) => (prev ? { ...prev, show_on_leaderboard: show } : prev));
    },
    [profileId],
  );

  // ── Initial fetch ──
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchAchievements(), fetchRecentXp()]);
      setIsLoading(false);
    };
    if (profileId) load();
  }, [profileId, fetchStats, fetchAchievements, fetchRecentXp]);

  return {
    stats,
    achievements,
    unlockedIds,
    recentXp,
    isLoading,
    awardXp,
    awardAttendanceXp,
    awardPaymentXp,
    updateStreak,
    unlockAchievement,
    toggleLeaderboard,
    refresh: async () => {
      await Promise.all([fetchStats(), fetchAchievements(), fetchRecentXp()]);
    },
  };
}

// ── Leaderboard hook ──
export function useLeaderboard(limit = 20) {
  const [entries, setEntries] = useState<
    (UserStats & { full_name?: string; avatar_url?: string | null })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*, profiles:profile_id(full_name, avatar_url)")
        .eq("show_on_leaderboard", true)
        .order("total_xp", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
        ...(row as unknown as UserStats),
        full_name: (row.profiles as Record<string, unknown>)?.full_name as string | undefined,
        avatar_url: (row.profiles as Record<string, unknown>)?.avatar_url as string | null | undefined,
      }));

      setEntries(mapped);
    } catch (err) {
      console.error("Fetch leaderboard error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, isLoading, refresh: fetchLeaderboard };
}

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { createLogger } from "../lib/logger";

const log = createLogger("useAnnouncements");

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null };
  read?: boolean;
}

interface UseAnnouncementsOptions {
  groupId?: string;
  groupIds?: string[];
  viewerId?: string;
}

interface CreateInput {
  group_id: string;
  title: string;
  body: string;
  priority?: AnnouncementPriority;
}

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  refresh: () => Promise<void>;
  create: (input: CreateInput) => Promise<Announcement>;
  markRead: (announcementId: string) => Promise<void>;
}

/**
 * Fetches announcements for one or many groups.
 * Joins author profile for display and mixes in a per-viewer `read` flag
 * derived from `announcement_reads`.
 */
export function useAnnouncements({
  groupId,
  groupIds,
  viewerId,
}: UseAnnouncementsOptions = {}): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("announcements")
        .select("*, author:profiles!announcements_author_id_fkey(full_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (groupId) query = query.eq("group_id", groupId);
      else if (groupIds && groupIds.length) query = query.in("group_id", groupIds);

      const { data, error } = await query;
      if (error) throw error;

      let reads: Set<string> = new Set();
      if (viewerId && data && data.length) {
        const ids = data.map((a: { id: string }) => a.id);
        const { data: readRows } = await supabase
          .from("announcement_reads")
          .select("announcement_id")
          .in("announcement_id", ids)
          .eq("profile_id", viewerId);
        reads = new Set(
          ((readRows as { announcement_id: string }[]) ?? []).map(
            (r) => r.announcement_id
          )
        );
      }

      setAnnouncements(
        ((data as unknown) as Announcement[]).map((a) => ({
          ...a,
          read: reads.has(a.id),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      log.error("Fetch announcements failed", { err });
    } finally {
      setIsLoading(false);
    }
  }, [groupId, groupIds?.join(","), viewerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateInput) => {
    const { data: auth } = await supabase.auth.getUser();
    const author_id = auth.user?.id;
    if (!author_id) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        group_id: input.group_id,
        title: input.title.trim(),
        body: input.body.trim(),
        priority: input.priority ?? "normal",
        author_id,
      })
      .select("*, author:profiles!announcements_author_id_fkey(full_name, avatar_url)")
      .single();
    if (error) throw error;
    const created = (data as unknown) as Announcement;
    setAnnouncements((prev) => [created, ...prev]);
    return created;
  }, []);

  const markRead = useCallback(
    async (announcementId: string) => {
      if (!viewerId) return;
      const { error } = await supabase.from("announcement_reads").upsert(
        {
          announcement_id: announcementId,
          profile_id: viewerId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "announcement_id,profile_id" }
      );
      if (error) {
        log.warn("markRead failed", { code: error.code });
        return;
      }
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, read: true } : a))
      );
    },
    [viewerId]
  );

  const unreadCount = announcements.filter((a) => !a.read).length;

  return { announcements, isLoading, error, unreadCount, refresh, create, markRead };
}

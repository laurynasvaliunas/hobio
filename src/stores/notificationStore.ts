import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { AppNotification, NotificationType } from "../types/database.types";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  sendNotification: (
    recipientId: string,
    type: NotificationType,
    title: string,
    body: string | null,
    data?: Record<string, unknown>
  ) => Promise<void>;
  sendBulkNotifications: (
    recipientIds: string[],
    type: NotificationType,
    title: string,
    body: string | null,
    data?: Record<string, unknown>
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = (data as AppNotification[]) ?? [];
      const unreadCount = notifs.filter((n) => !n.is_read).length;

      set({ notifications: notifs, unreadCount });
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (notificationId: string) => {
    // Optimistic
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  },

  markAllRead: async () => {
    const unreadIds = get()
      .notifications.filter((n) => !n.is_read)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    // Optimistic
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  },

  sendNotification: async (recipientId, type, title, body, data = {}) => {
    await supabase.from("notifications").insert({
      recipient_id: recipientId,
      type,
      title,
      body,
      data,
    });
  },

  sendBulkNotifications: async (recipientIds, type, title, body, data = {}) => {
    if (recipientIds.length === 0) return;

    const records = recipientIds.map((recipientId) => ({
      recipient_id: recipientId,
      type,
      title,
      body,
      data,
    }));

    await supabase.from("notifications").insert(records);
  },
}));

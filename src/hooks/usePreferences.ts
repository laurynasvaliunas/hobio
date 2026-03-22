import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type {
  UserPreferences,
  NotificationPreferences,
  OrganizerSettings,
  ThemeMode,
} from "../types/database.types";

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  session_reminders: true,
  billing_alerts: true,
  announcements: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  email_notifications: true,
  push_notifications: true,
};

const DEFAULT_ORGANIZER: OrganizerSettings = {
  business_hours_start: "09:00",
  business_hours_end: "18:00",
  contact_method: "in_app",
  auto_approve_members: false,
};

export function usePreferences(profileId: string) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!profileId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      if (error && error.code === "PGRST116") {
        // No preferences row yet -- create one with defaults
        const { data: newRow, error: insertError } = await supabase
          .from("user_preferences")
          .insert({ profile_id: profileId })
          .select()
          .single();

        if (!insertError && newRow) {
          setPreferences(newRow as UserPreferences);
        }
      } else if (data) {
        setPreferences(data as UserPreferences);
      }
    } catch (err) {
      console.error("Fetch preferences error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Update notification preferences (optimistic)
  const updateNotifications = useCallback(
    async (partial: Partial<NotificationPreferences>) => {
      if (!preferences) return;
      const updated = { ...preferences.notifications, ...partial };

      // Optimistic update
      setPreferences((prev) =>
        prev ? { ...prev, notifications: updated } : prev
      );

      const { error } = await supabase
        .from("user_preferences")
        .update({ notifications: updated, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId);

      if (error) {
        // Revert
        setPreferences((prev) =>
          prev ? { ...prev, notifications: preferences.notifications } : prev
        );
        throw error;
      }
    },
    [preferences, profileId]
  );

  // Update theme (optimistic)
  const updateTheme = useCallback(
    async (theme: ThemeMode) => {
      if (!preferences) return;
      const prev = preferences.theme;
      setPreferences((p) => (p ? { ...p, theme } : p));

      const { error } = await supabase
        .from("user_preferences")
        .update({ theme, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId);

      if (error) {
        setPreferences((p) => (p ? { ...p, theme: prev } : p));
        throw error;
      }
    },
    [preferences, profileId]
  );

  // Update organizer settings (optimistic)
  const updateOrganizerSettings = useCallback(
    async (partial: Partial<OrganizerSettings>) => {
      if (!preferences) return;
      const updated = { ...preferences.organizer_settings, ...partial };
      const prev = preferences.organizer_settings;

      setPreferences((p) =>
        p ? { ...p, organizer_settings: updated } : p
      );

      const { error } = await supabase
        .from("user_preferences")
        .update({
          organizer_settings: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", profileId);

      if (error) {
        setPreferences((p) =>
          p ? { ...p, organizer_settings: prev } : p
        );
        throw error;
      }
    },
    [preferences, profileId]
  );

  // Update active role
  const updateActiveRole = useCallback(
    async (role: string | null) => {
      if (!preferences) return;
      const prev = preferences.active_role;
      setPreferences((p) => (p ? { ...p, active_role: role } : p));

      const { error } = await supabase
        .from("user_preferences")
        .update({ active_role: role, updated_at: new Date().toISOString() })
        .eq("profile_id", profileId);

      if (error) {
        setPreferences((p) => (p ? { ...p, active_role: prev } : p));
        throw error;
      }
    },
    [preferences, profileId]
  );

  return {
    preferences,
    isLoading,
    fetchPreferences,
    updateNotifications,
    updateTheme,
    updateOrganizerSettings,
    updateActiveRole,
    notifications: preferences?.notifications ?? DEFAULT_NOTIFICATIONS,
    organizerSettings: preferences?.organizer_settings ?? DEFAULT_ORGANIZER,
    theme: preferences?.theme ?? "system",
    activeRole: preferences?.active_role,
  };
}

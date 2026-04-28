import { create } from "zustand";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import type { Profile, ThemeMode, UserRole } from "../types/database.types";
import { supabase } from "../lib/supabase";
import { createLogger } from "../lib/logger";
import { useThemeStore } from "./themeStore";

const log = createLogger("Auth");

// Holds the active onAuthStateChange subscription so a second `initialize()`
// call (HMR, navigation re-mount) doesn't stack listeners and fire duplicate
// SIGNED_IN events that race the profile fetch.
let authStateSubscription: { unsubscribe: () => void } | null = null;

export type SignUpResult = "signed_in" | "email_confirmation_required";

interface AuthState {
  session: { user: { id: string; email: string } } | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  updateRole: (role: UserRole) => Promise<void>;
  fetchProfile: () => Promise<void>;
  ensureProfile: (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,

  initialize: async () => {
    // Tear down any previous listener before registering a new one — protects
    // against duplicate handlers on HMR or repeated initialize() calls.
    if (authStateSubscription) {
      authStateSubscription.unsubscribe();
      authStateSubscription = null;
    }

    // Set up the listener FIRST to avoid missing events that fire during getSession()
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({
          session: {
            user: { id: session.user.id, email: session.user.email ?? "" },
          },
        });
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          await get().ensureProfile(session.user);
          await get().fetchProfile();
        }
      } else if (event === "SIGNED_OUT") {
        set({ session: null, profile: null, isOnboarded: false });
      }
    });
    authStateSubscription = data.subscription;

    try {
      log.debug("initializing");
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        log.error("getSession failed", { code: sessionError.name });
      }

      if (session?.user) {
        log.event("session_found");
        set({
          session: {
            user: { id: session.user.id, email: session.user.email ?? "" },
          },
        });
        await get().fetchProfile();
      } else {
        log.event("no_existing_session");
      }
    } catch (error) {
      log.error("initialization error", { name: (error as Error)?.name });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signInWithApple: async () => {
    if (Platform.OS !== "ios") return;
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (credential.identityToken) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;
    }
  },

  signUp: async (email, password, fullName): Promise<SignUpResult> => {
    log.event("sign_up_attempt");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      log.error("sign_up_failed", { code: error.status ?? error.name });
      throw error;
    }
    log.event("sign_up_success", { hasSession: !!data.session });

    if (data.session && data.user) {
      // Email confirmation is disabled — session is active immediately.
      set({
        session: {
          user: { id: data.user.id, email: data.user.email ?? "" },
        },
      });

      // Insert with default role. onboarding_completed = false means they must
      // go through the onboarding flow before reaching the main app.
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "participant",
        onboarding_completed: false,
      });

      if (profileError && profileError.code !== "23505") {
        log.error("profile_create_failed", { code: profileError.code });
      }

      await get().fetchProfile();
      return "signed_in";
    }

    // Email confirmation enabled — user must verify before they can sign in.
    return "email_confirmation_required";
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, profile: null, isOnboarded: false });
  },

  setProfile: (profile) => {
    set({ profile, isOnboarded: profile.onboarding_completed });
  },

  updateRole: async (role) => {
    const profile = get().profile;
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role, onboarding_completed: true })
      .eq("id", profile.id);

    if (error) throw error;
    set({ profile: { ...profile, role, onboarding_completed: true }, isOnboarded: true });
  },

  fetchProfile: async () => {
    const session = get().session;
    if (!session) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        set({ isOnboarded: false });
        return;
      }
      log.error("fetch_profile_failed", { code: error.code });
      return;
    }

    set({
      profile: data as Profile,
      isOnboarded: (data as Profile).onboarding_completed,
    });

    // Hydrate the local theme store from the user's persisted DB preference.
    // themeStore is AsyncStorage-backed (device-local); on a fresh install or
    // after clearing app data, it defaults to "system" even if the user had
    // previously picked "light" or "dark". Pull the DB value as the source of
    // truth so Appearance stays consistent across devices and reinstalls.
    try {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme")
        .eq("profile_id", session.user.id)
        .single();

      const dbTheme = (prefs?.theme ?? null) as ThemeMode | null;
      if (dbTheme && dbTheme !== useThemeStore.getState().mode) {
        useThemeStore.getState().setMode(dbTheme);
      }
    } catch (err) {
      // Non-fatal: theme falls back to whatever's in AsyncStorage.
      log.warn("theme_hydrate_failed", { name: (err as Error)?.name });
    }
  },

  ensureProfile: async (user) => {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existing) {
      const fullName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        "User";
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? "",
        full_name: fullName,
        role: "participant",
        onboarding_completed: false,
      });
    }
  },
}));

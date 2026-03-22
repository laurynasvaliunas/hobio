import { create } from "zustand";
import type { Profile, UserRole } from "../types/database.types";
import { supabase } from "../lib/supabase";

export type SignUpResult = "signed_in" | "email_confirmation_required";

interface AuthState {
  session: { user: { id: string; email: string } } | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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
    // Set up the listener FIRST to avoid missing events that fire during getSession()
    supabase.auth.onAuthStateChange(async (event, session) => {
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

    try {
      if (__DEV__) console.log("[Auth] Initializing...");
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[Auth] getSession error:", sessionError.message);
      }

      if (session?.user) {
        if (__DEV__) console.log("[Auth] Session found for:", session.user.email);
        set({
          session: {
            user: { id: session.user.id, email: session.user.email ?? "" },
          },
        });
        await get().fetchProfile();
      } else {
        if (__DEV__) console.log("[Auth] No existing session");
      }
    } catch (error) {
      console.error("[Auth] initialization error:", error);
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

  signUp: async (email, password, fullName): Promise<SignUpResult> => {
    if (__DEV__) console.log("[Auth] Signing up:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      if (__DEV__) console.error("[Auth] signUp error:", error.message);
      throw error;
    }
    if (__DEV__) console.log("[Auth] signUp success, session:", !!data.session);

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
        console.error("Profile creation error:", profileError);
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
        // Profile doesn't exist yet (rare — DB trigger may have failed)
        set({ isOnboarded: false });
        return;
      }
      console.error("Fetch profile error:", error);
      return;
    }

    set({
      profile: data as Profile,
      isOnboarded: (data as Profile).onboarding_completed,
    });
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

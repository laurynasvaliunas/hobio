/**
 * Role and capability guards for UI code. Server-side authorization is
 * enforced by RLS + the `join_group_by_invite` RPC — these helpers exist so
 * screens can render the right affordances and short-circuit before firing
 * requests the server would reject.
 */
import { useMemo } from "react";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";
import type { UserRole } from "../types/database.types";

export interface RoleCheck {
  isOrganizer: boolean;
  isParent: boolean;
  isParticipant: boolean;
  role: UserRole | null;
}

export function useRoleCheck(): RoleCheck {
  const role = useAuthStore((s) => s.profile?.role ?? null);
  return useMemo(
    () => ({
      isOrganizer: role === "organizer",
      isParent: role === "parent",
      isParticipant: role === "participant",
      role,
    }),
    [role],
  );
}

export interface GroupAccess {
  isOrganizer: boolean;
  isMember: boolean;
  canEdit: boolean;
  canViewMembers: boolean;
  canMarkAttendance: boolean;
  canBroadcast: boolean;
  canSignContract: boolean;
}

/** Derive what the caller can do on a specific group. */
export function useGroupAccess(groupId: string | undefined): GroupAccess {
  const profile = useAuthStore((s) => s.profile);
  const groups = useGroupStore((s) => s.groups);

  return useMemo(() => {
    if (!profile || !groupId) {
      return {
        isOrganizer: false,
        isMember: false,
        canEdit: false,
        canViewMembers: false,
        canMarkAttendance: false,
        canBroadcast: false,
        canSignContract: false,
      };
    }
    const group = groups.find((g) => g.id === groupId);
    const isOrganizer = profile.role === "organizer" && !!group;
    const isMember = !isOrganizer && !!group;
    return {
      isOrganizer,
      isMember,
      canEdit: isOrganizer,
      canViewMembers: true,
      canMarkAttendance: isOrganizer,
      canBroadcast: isOrganizer,
      canSignContract: isMember || profile.role === "parent",
    };
  }, [profile, groups, groupId]);
}

/**
 * Strict, throw-on-fail guard for imperative flows. Callers should wrap in a
 * try/catch and surface a toast.
 */
export function requireRole(expected: UserRole | UserRole[]): void {
  const role = useAuthStore.getState().profile?.role;
  const ok = Array.isArray(expected) ? expected.includes(role as UserRole) : role === expected;
  if (!ok) {
    const err = new Error(`Requires role: ${Array.isArray(expected) ? expected.join("|") : expected}`);
    err.name = "RoleRequiredError";
    throw err;
  }
}

/** Sanity-check a 6-character invite code. Rejects whitespace, symbols, URL-style payloads. */
export function normalizeInviteCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toUpperCase();
  if (/^[A-Z2-9]{6}$/.test(trimmed)) return trimmed;
  return null;
}

/** Only allow the `hobio://` scheme or bare in-app paths. Blocks javascript:, data:, file:, etc. */
export function isSafeDeeplink(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const s = raw.trim();
  if (s.startsWith("/")) return true;
  if (s.startsWith("hobio://")) return true;
  if (s.startsWith("https://hobio.app/")) return true;
  return false;
}

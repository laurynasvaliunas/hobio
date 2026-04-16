import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client.
 *
 * Defaults:
 *   - staleTime: 5 minutes — keeps common reads (groups, members) warm between
 *     tab switches.
 *   - gcTime: 30 minutes — cache survives brief navigation to other tabs so a
 *     back-swipe does not re-fetch.
 *   - retry: 2 with exponential backoff, but skip retries on 4xx (they will not
 *     succeed on retry and would double the server load).
 *   - refetchOnWindowFocus: false — irrelevant on native.
 */
function isNonRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; code?: string };
  if (e.status && e.status >= 400 && e.status < 500) return true;
  if (typeof e.code === "string" && /^(PGRST|22|23|28|42)/.test(e.code)) return true;
  return false;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        if (isNonRetryable(err)) return false;
        return count < 2;
      },
      retryDelay: (count) => Math.min(1000 * 2 ** count, 10_000),
    },
    mutations: {
      retry: false,
    },
  },
});

/** Query-key factory — stable, typed keys for every domain read. */
export const qk = {
  groups: (filter?: string) => ["groups", filter ?? "all"] as const,
  group: (id: string) => ["group", id] as const,
  members: (groupId: string) => ["members", groupId] as const,
  sessions: (groupId?: string) => ["sessions", groupId ?? "all"] as const,
  attendance: (sessionId: string) => ["attendance", sessionId] as const,
  contracts: (groupId: string) => ["contracts", groupId] as const,
  announcements: (groupId: string) => ["announcements", groupId] as const,
  invoices: (groupId: string) => ["invoices", groupId] as const,
  myInvoices: (profileId: string) => ["invoices", "my", profileId] as const,
  children: (profileId: string) => ["children", profileId] as const,
  profile: (id: string) => ["profile", id] as const,
  preferences: (profileId: string) => ["preferences", profileId] as const,
  notifications: (profileId: string) => ["notifications", profileId] as const,
};

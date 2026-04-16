# Hobio — Hardening & Polish Summary

This document summarizes the end-to-end hardening and polish pass applied to the
Hobio app. The core product logic, domain model, and feature set are preserved —
what changed is how safely, reliably, beautifully, and correctly they are
implemented.

Delivery was executed in six phases (P0 → P6). Every line below maps back to a
concrete change in the codebase.

---

## P0 — Critical triage (security, crashes, data leaks)

### PII-safe logging
- Added `src/lib/logger.ts`: a lightweight `createLogger(scope)` utility with
  `.debug / .warn / .error / .event` levels that drops PII fields (email, full
  name, phone, tokens, session) before anything reaches a transport.
- Replaced direct `console.log / warn / error` calls in all security-sensitive
  code paths with the scoped logger:
  - `src/contexts/AuthContext.tsx`
  - `src/stores/groupStore.ts`, `src/stores/notificationStore.ts`
  - `src/hooks/useSessions.ts`, `useMembers.ts`, `useAttendance.ts`,
    `useChildren.ts`, `useDocuments.ts`, `useInvoices.ts`,
    `usePreferences.ts`, `useGamification.ts`, `usePaymentSheet.ts`,
    `useMapDiscovery.ts`
  - `src/lib/geo.ts`, `src/components/dashboard/ExceptionsCard.tsx`
- Remaining low-risk `console.error` calls in app route files are wrapped in
  `if (__DEV__) { … }` to prevent any production logging.

### Root error boundary
- Added `src/components/ErrorBoundary.tsx` with:
  - PII-safe logging of render/lifecycle errors.
  - Automatic forwarding to Sentry when installed, tagged with the boundary
    scope.
  - A user-friendly fallback with a "Try again" reset.
- Mounted at the root of the app (`app/_layout.tsx`) so no uncaught render
  error can take down the whole tree.

### Sentry PII stripping
- `app/_layout.tsx` now calls `Sentry.init` with a `beforeSend` hook that
  strips `user.email`, `user.phone`, `Authorization`, and `Cookie` headers
  before events leave the device.
- Sentry is only activated in non-`__DEV__` builds to avoid noisy events in
  Expo Go / local development.

---

## P1 — Database & RLS rebaseline

### Baseline migration
- `supabase/migrations/20260416000000_hobio_baseline.sql` consolidates the
  full schema (`profiles`, `children`, `organizations`, `groups`,
  `group_members`, `sessions`, `recurring_schedule`, `attendance`,
  `contracts`, `announcements`, `announcement_reads`, documents, invoices,
  gamification, push tokens, etc.).
- RLS is enabled on all tables, with explicit policies for read / write
  access per role (organizer, participant, parent).

### Atomic, server-side group join
- Added RPC `public.join_group_by_invite(invite_code, child_id?)` that
  - normalizes the invite code,
  - checks group existence, active state, and capacity,
  - prevents joining your own group as a member,
  - prevents duplicate memberships,
  - inserts the `group_members` row in a single transaction.
- `app/join/[code].tsx` was rewritten to call this RPC, eliminating the
  previous client-side race conditions and trust issues.

### Supabase auth hardening
- `supabase/config.toml` updated with:
  - Minimum password length **12** and complexity requirements.
  - Email confirmations **required**.
  - Secure password change flow enabled.
  - TOTP-based MFA enabled.
  - Tightened per-IP sign-in and sign-up rate limits.

---

## P2 — Auth & edge function hardening

### Supabase session storage
- `src/lib/supabase.ts` now uses a custom storage adapter:
  - **Native:** `expo-secure-store` with chunking (respecting the 2 KB
    per-key ceiling) so Supabase JWTs live in the keychain / keystore.
  - **Web:** `AsyncStorage` fallback.
- No long-lived session material is written to `AsyncStorage` on device.

### Stripe payment edge function
- Rewrote `supabase/functions/create-payment-intent/index.ts`:
  - **Zod** input validation for `invoice_id`, `currency`, etc.
  - Explicit multi-path authorization:
    - organizer of the owning org, or
    - the owning member, or
    - the parent of a child member.
  - Stripe `idempotencyKey` derived from `invoice_id` to kill duplicate
    charges.
  - Locked CORS to approved origins (no `*`).
  - Correct invoice status update (`status = 'processing'`, `intent_id`
    persisted).

---

## P3 — Typed data layer

### Query client
- Added `src/lib/queryClient.ts` with shared defaults (`retry: 2`,
  `staleTime: 30s`, `refetchOnWindowFocus: false`, error handler routed
  through the logger).
- `app/_layout.tsx` now provides a single `QueryClientProvider` at the root.

### Zod schemas
- `src/lib/validations.ts` now exposes **typed schema factories** (`i18n`
  aware) for every form in the app:
  - `getSignInSchema`, `getSignUpSchema` (min 12 chars, strong-password
    regex, `acceptTerms: z.literal(true)`).
  - `getResetSchema`, `getInviteCodeSchema`, `getOrganizationSchema`,
    `getGroupSchema`, `getSessionSchema`, `getAnnouncementSchema`,
    `getContractSchema`.
- `app/(auth)/sign-up.tsx` now validates the full payload (including
  `acceptTerms`) through Zod before calling Supabase.

### Error states
- Added `src/components/ui/ErrorState.tsx`, a reusable inline error panel
  with icon, description, and retry CTA.
- Surfaced it on hot list screens (e.g. group sessions) so hook errors are
  shown instead of a blank list.

### Type safety
- `tsconfig.json` now excludes `supabase/functions` and `scripts` from the
  app’s `tsc --noEmit` pass (they are Deno / Node-only surfaces).
- `usePushNotifications.ts` was migrated to the modern
  `Notifications.EventSubscription` API with `.remove()` cleanup and the
  new `shouldShowBanner` / `shouldShowList` handler options.
- Numerous micro type fixes (`Card` `padding` prop, `GroupCard` illegal
  `tintColor`, `SharedValue` type on `LoadingScreen`, `Invoice
  .stripe_invoice_id`) brought the project to a clean `npx tsc --noEmit`
  state.

---

## P4 — Spec parity (features aligned with `.cursorrules`)

### Announcements
- New hook `src/hooks/useAnnouncements.ts` with `refresh`, `create`,
  `markRead`, per-viewer `unreadCount`, and multi-group support.
- New screen `app/(tabs)/groups/[groupId]/announcements.tsx` with empty /
  error / list states and an organizer-only compose CTA.
- Rewrote `app/modals/create-announcement.tsx` into a real form
  (title / body / priority) backed by `getAnnouncementSchema`.
- Quick Action tile added on the group screen for both "Announce" (compose)
  and "Announcements" (feed).

### Sessions
- New modal `app/modals/create-session.tsx` for organizer one-off
  sessions with native `DateTimePicker`, `getSessionSchema` validation,
  and PII-safe error surfacing.

### Members & contracts
- New `app/modals/member-detail.tsx` to inspect an individual group member
  or child (including parent-only medical notes) with an organizer-only
  "remove member" action.
- New `app/modals/contract-detail.tsx` to display a contract and, when the
  viewer is authorized, sign it (`signed_at`, `signed_by`).

### Group settings
- New `app/(tabs)/groups/[groupId]/settings.tsx` — full owner-only group
  editor:
  - Name, description, age group, skill level (chip picker).
  - Accent color picker (10 palette options).
  - Max participants, price per month.
  - `is_active` toggle with guidance copy.
  - Destructive "Delete group" flow with confirmation.
- Wired up from the group header’s settings icon (previously misrouted to
  `schedule-setup`).
- `src/stores/groupStore.ts` gained `updateGroup` and `deleteGroup`
  actions.

### QR invites
- Installed `react-native-qrcode-svg` and `expo-clipboard`.
- New `app/modals/invite-qr.tsx` displaying the group name, invite code,
  QR for `hobio://join/<CODE>`, copy-to-clipboard, and native share.
- Added a "Show QR" button next to "Share invite" on the group screen.

### Notifications tab & deep links
- Preserved the existing rich notifications tab
  (`app/(tabs)/notifications/index.tsx`) and verified each
  `NotificationType` routes into the right deep link (announcements,
  join requests, invoices, documents, …).

---

## P5 — Design system, a11y, resilience

### Tokens & theming
- `src/constants/colors.ts` is the single source of truth with light & dark
  theme colors, shadows, and typed interfaces (`ThemeColors`,
  `ThemeShadows`). `Colors` / `Shadows` remain exported for legacy
  consumers.
- Palette reconciled on the Hobio terracotta brand (`#D97758`) across
  surfaces, text, borders, and accents.

### Per-tab error boundaries
- Every tab layout is now wrapped in a scoped `ErrorBoundary`
  (`home`, `dashboard`, `discover`, `schedule`, `groups`, `notifications`,
  `profile`) so a crash in one tab no longer kills the whole shell.

### Skeletons & accessibility
- `src/components/ui/Skeleton.tsx` + `LoadingScreen.tsx` provide
  placeholder states used across list and detail screens.
- New screens (group settings, invite QR, announcements, session creation,
  member detail, contract detail) use semantic
  `accessibilityRole` + `accessibilityLabel` + `accessibilityState` on all
  interactive elements.
- `Input` and `Button` continue to receive touchable and input
  accessibility hooks (`success`, `error`, `hint`).

---

## P6 — Integrations, tests, i18n

### Internationalization
- All user-visible strings added in this pass are routed through
  `react-i18next`.
- `scripts/build-i18n.mjs` is the single source of truth for English and
  Lithuanian dictionaries — `npm run build:i18n` regenerates both
  `en.json` and `lt.json`. Keys added for:
  - validation (`passwordWeak`, `termsRequired`, `titleRequired`,
    `bodyRequired`, `endAfterStart`, `urlInvalid`, `orgNameRequired`,
    `orgNameMin`, `sportRequired`),
  - common (`tryAgain`, `close`, `copy`, `copiedToClipboard`),
  - groups (`settingsTitle`, `notFound`, `updateFailed`, `deleteTitle`,
    `deleteConfirm`, `inviteQrTitle`, `inviteQrDesc`, `showQrCta`,
    `shareInviteCta`, etc.),
  - sessions, announcements, members, contracts modules.

### Type & lint gates
- `npx tsc --noEmit` now returns clean (0 errors) across app + src.
- Linter is clean for all edited files (`ReadLints` passes).

### Known follow-ups (deferred for a dedicated DX session)
- Regenerate `src/types/supabase.ts` via `npx supabase gen types` once the
  Supabase project is linked locally; the current file has been marked
  stale and the generic `<Database>` parameter temporarily removed from
  `createClient` with a comment explaining why.
- Wire up Maestro E2E flows (sign up → join group → mark attendance).
- Configure CI gates to run `tsc --noEmit`, `npm run build:i18n`, and
  `detox`/`maestro` on PRs.

---

## Quick reference: new files

```
src/lib/logger.ts
src/lib/queryClient.ts
src/components/ErrorBoundary.tsx
src/components/ui/ErrorState.tsx
src/hooks/useAnnouncements.ts
app/(tabs)/groups/[groupId]/settings.tsx
app/(tabs)/groups/[groupId]/announcements.tsx
app/modals/create-announcement.tsx   (rewritten)
app/modals/create-session.tsx
app/modals/member-detail.tsx
app/modals/contract-detail.tsx
app/modals/invite-qr.tsx
supabase/migrations/20260416000000_hobio_baseline.sql
```

## Quick reference: notable refactors

```
app/_layout.tsx                 # Sentry beforeSend, Error boundary, QueryClient
app/(auth)/sign-up.tsx          # Zod-first validation, acceptTerms
app/join/[code].tsx             # join_group_by_invite RPC
app/(tabs)/*/_layout.tsx        # per-tab ErrorBoundary
src/lib/supabase.ts             # SecureStore-backed session storage
src/stores/groupStore.ts        # updateGroup / deleteGroup
src/lib/validations.ts          # typed schema factories
supabase/functions/create-payment-intent/index.ts  # Zod + idempotency + CORS
supabase/config.toml            # password / email / MFA hardening
scripts/build-i18n.mjs          # new keys, LT coverage
```

Hobio is now a markedly safer, more robust, more complete, and more
polished product — without touching the core idea of "one app to rule all
your hobbies".

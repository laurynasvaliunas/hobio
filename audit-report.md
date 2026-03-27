# Hobio — Phase 1 Audit Report

> Generated: 2026-02-11
> Scope: Full codebase scan of `app/`, `src/`, `assets/`
> Status: **AWAITING APPROVAL** — No code changes made.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Zombie Code](#2-zombie-code)
3. [Hardcoded Values](#3-hardcoded-values)
4. [State Management Issues](#4-state-management-issues)
5. [Type Safety Issues](#5-type-safety-issues)
6. [Refactor Priority Matrix](#6-refactor-priority-matrix)

---

## 1. Executive Summary

| Category              | Issues Found | Severity |
|-----------------------|:------------:|:--------:|
| Unused imports        | 12           | Low      |
| Unused components     | 8            | Medium   |
| Unused hooks/exports  | 11           | Medium   |
| Inline hex colors     | 80+          | Medium   |
| Magic numbers         | 200+         | Medium   |
| Hardcoded strings     | 100+         | High     |
| Large useState chains | 5 files      | Medium   |
| Missing error states  | 6 hooks      | High     |
| `any` type usage      | 50+          | High     |
| Type assertions (`as`)| 80+          | Medium   |
| Missing interfaces    | 10+          | Medium   |
| Missing return types  | 30+          | Low      |

**Top 3 risks:**
1. Missing error states in data-fetching hooks — users see no feedback on failure
2. 50+ `any` types undermine TypeScript's value — runtime crashes waiting to happen
3. 100+ hardcoded strings make i18n impossible and edits error-prone

---

## 2. Zombie Code

### 2.1 Unused Imports (12 instances)

| File | Unused Import |
|------|---------------|
| `app/(tabs)/dashboard/index.tsx` | `GroupMember` |
| `app/(tabs)/groups/[groupId]/sessions.tsx` | `MapPin` |
| `app/(tabs)/groups/[groupId]/members.tsx` | `Share2`, `MoreHorizontal` |
| `app/(tabs)/groups/[groupId]/payments.tsx` | `format` (date-fns) |
| `app/(tabs)/profile/account.tsx` | `Lock` |
| `app/(tabs)/profile/switch-role.tsx` | `Users` |
| `app/(tabs)/profile/organizer-prefs.tsx` | `UserPlus` |
| `app/modals/create-group.tsx` | `ScreenWrapper` |
| `src/components/map/GroupDetailSheet.tsx` | `ExternalLink` |
| `src/components/ui/ProfileDropdown.tsx` | `User` |

### 2.2 Unused Components (8 components)

| Component | Location | Notes |
|-----------|----------|-------|
| `AppLock` | `src/components/AppLock.tsx` | Never imported anywhere |
| `AchievementGrid` | `src/components/gamification/AchievementGrid.tsx` | Never imported |
| `HeroStatsBar` | `src/components/gamification/HeroStatsBar.tsx` | Never imported |
| `LeaderboardCard` | `src/components/gamification/LeaderboardCard.tsx` | Never imported |
| `LevelRingAvatar` | `src/components/gamification/LevelRingAvatar.tsx` | Only imported by unused `LeaderboardCard` |
| `FamilyTimeline` | `src/components/dashboard/FamilyTimeline.tsx` | Never imported |
| `MembershipJoinFlow` | `src/components/contracts/MembershipJoinFlow.tsx` | Never imported |
| `ContractSignatureSheet` | `src/components/contracts/ContractSignatureSheet.tsx` | Only imported by unused `MembershipJoinFlow` |

> **Note:** The entire gamification system (`AchievementGrid`, `HeroStatsBar`, `LeaderboardCard`, `LevelRingAvatar`) is fully implemented but never wired into any screen. Decision needed: integrate or remove.

### 2.3 Unused Hooks & Exports

| Hook / Export | Location | Notes |
|---------------|----------|-------|
| `useAnnouncements` | `src/hooks/useAnnouncements.ts` | Never imported |
| `useContracts` | `src/hooks/useContracts.ts` | Never imported |
| `useGamification` | `src/hooks/useGamification.ts` | Never imported (only `useLeaderboard` used) |
| `useMemberAttendanceStats` | `src/hooks/useAttendance.ts` | Never imported |
| `useMyInvoices` | `src/hooks/useInvoices.ts` | Never imported |
| `geocodeAddress` | `src/lib/geo.ts` | Never imported |
| `isPointInRegion` | `src/lib/geo.ts` | Never imported |
| `getNextBillingRange` | `src/lib/billing.ts` | Never imported |
| `getSessionsForDate` | `src/lib/scheduling.ts` | Never imported |
| `getSessionsForWeek` | `src/lib/scheduling.ts` | Never imported |
| `hasOverlap` | `src/lib/scheduling.ts` | Never imported |
| `truncate` | `src/lib/helpers.ts` | Never imported |

### 2.4 Unused Assets

| Asset | Status |
|-------|--------|
| `assets/adaptive-icon.png` | Auto-used by Expo (OK) |
| `assets/splash-icon.png` | Auto-used by Expo (OK) |
| `assets/icon.png` | Auto-used by Expo (OK) |
| `assets/hobio-logo.png` | Referenced only in `app.json` and unused `AppLock.tsx` |

---

## 3. Hardcoded Values

### 3.1 Inline Hex Colors (80+ instances)

The theme system (`src/constants/colors.ts`) exists but is **inconsistently adopted**. Common offenders:

**`#FFFFFF` / `#FFF` — found in 30+ files:**
- `src/components/ui/Button.tsx:89,90,93,131`
- `src/components/map/FilterDrawer.tsx:250,255,329,334,374,379,439,440`
- `app/(tabs)/dashboard/index.tsx:285,378,389,398,409`
- `app/(tabs)/discover/index.tsx:341,346,373,525,547,552,750,752`
- `app/(tabs)/groups/[groupId]/schedule-setup.tsx:177,325,381`
- `app/(tabs)/profile/account.tsx:213,257`
- `app/(tabs)/profile/delete-account.tsx:215`
- All `/(tabs)/profile/*.tsx` screens

> **Fix:** Add `Colors.text.inverse = "#FFFFFF"` to theme and use it everywhere.

**`#000` / `#000000` — backdrops/overlays (8 instances):**
- `src/components/ui/ProfileDropdown.tsx:143` — `"#00000060"`
- `src/components/ui/BirthDatePicker.tsx:206` — `"#00000040"`
- `src/components/ui/Toast.tsx:97` — `shadowColor: "#000"`
- `src/components/map/FilterDrawer.tsx:162` — `backgroundColor: "#000"`
- `src/components/map/GroupDetailSheet.tsx:74`
- `src/components/contracts/MembershipJoinFlow.tsx:164` — `"#00000050"`
- `src/components/contracts/ContractSignatureSheet.tsx:109` — `"#00000050"`

**Special colors not in theme:**
- `src/components/gamification/LeaderboardCard.tsx:46-48` — Medal colors: `#FFD700`, `#C0C0C0`, `#CD7F32`

### 3.2 Magic Numbers (200+ instances)

No spacing/sizing constants exist. Common values repeated everywhere:

| Value | Occurrences | Used For |
|-------|:-----------:|----------|
| `borderRadius: 16` | 30+ | Cards, containers |
| `borderRadius: 12` | 20+ | Buttons, inputs |
| `borderRadius: 20` | 25+ | Badges, pills |
| `padding: 16` | 30+ | Container padding |
| `padding: 24` | 15+ | Screen padding |
| `fontSize: 14` | 40+ | Body text |
| `fontSize: 13` | 30+ | Small body text |
| `fontSize: 12` | 25+ | Captions |
| `gap: 8` | 20+ | Small gaps |
| `gap: 12` | 20+ | Medium gaps |
| `height: 52` | 5+ | Input/button height |

**Worst offenders (most magic numbers per file):**
1. `app/(tabs)/dashboard/index.tsx` — 40+ instances
2. `app/(tabs)/discover/index.tsx` — 30+ instances
3. `src/components/contracts/MembershipJoinFlow.tsx` — 30+ instances
4. `src/components/map/FilterDrawer.tsx` — 20+ instances
5. `src/components/map/GroupDetailSheet.tsx` — 25+ instances

### 3.3 Hardcoded Strings (100+ instances)

No i18n or string constants file exists. Every user-facing string is inline.

**Error messages (scattered across 15+ files):**
- `"Something went wrong. Please try again."` — appears in 5+ places
- `"Failed to save"` / `"Failed to load"` — appears in 8+ places
- `"Please enter..."` validation messages in every form

**Placeholder text:**
- `"you@example.com"` — `AppLock.tsx:286`
- `"e.g. U12 Football - Monday"` — `create-group.tsx:120`
- `"e.g. Emma Johnson"` — `family-setup.tsx:257`
- `"+1 555-000-0000"` — `emergency-contact.tsx:124`, `add-child.tsx:164`

**UI labels/titles (every screen has inline labels):**
- Section titles: `"Today's Schedule"`, `"My Groups"`, `"Quick Stats"`
- Button labels: `"Get Started"`, `"Save Contact"`, `"Create Group"`, `"Add Child"`
- Tab labels, filter labels, status badges — all inline

### 3.4 Hardcoded URLs

| Location | URL | Should Be |
|----------|-----|-----------|
| `src/lib/geo.ts:64` | `https://maps.googleapis.com/maps/api/geocode/json?...` | Constants file |
| `src/lib/geo.ts:102-107` | Vilnius coordinates (`54.6872, 25.2797`) | Config / device location |

### 3.5 StyleSheet.create Usage

**None found.** The codebase uses inline style objects consistently. Good — but all those inline styles contain the hardcoded values listed above.

---

## 4. State Management Issues

### 4.1 Large useState Chains (5 files)

| File | useState Count | Recommendation |
|------|:--------------:|----------------|
| `app/modals/create-group.tsx` | **8** | `useReducer` for form state |
| `app/(tabs)/profile/account.tsx` | **7** | Split into profile + password forms with `useReducer` |
| `app/(tabs)/groups/[groupId]/schedule-setup.tsx` | **7** | `useReducer` for schedule form |
| `app/(tabs)/dashboard/index.tsx` (via `useRevenueSummary`) | **4** | Return single object from hook |
| `app/(tabs)/discover/index.tsx` | **4** | Move filters to Zustand store |

### 4.2 Missing Error States (6 hooks)

These hooks fetch data but swallow errors silently — users get no feedback:

| Hook | Has `isLoading` | Has `error` |
|------|:---------------:|:-----------:|
| `useSessions` | Yes | **No** |
| `useMembers` | Yes | **No** |
| `useInvoices` | Yes | **No** |
| `useMapDiscovery` | Yes | **No** |
| `useGamification` | Yes | **No** |
| `schedule-setup.tsx` (inline) | Yes | **No** |

### 4.3 Duplicate State

- `app/(tabs)/discover/index.tsx`: Filter state exists **both** in component (`filters`, line 90) and in `useMapDiscovery` hook (`activeFilter`).
- `app/(tabs)/dashboard/index.tsx`: Groups fetched independently in both `useGroupStore` and `useSessions`.

### 4.4 State That Should Be in Zustand

| Current Location | Data | Why Zustand |
|------------------|------|-------------|
| `useMapDiscovery` hook | User location, region, groups, filters | Cross-screen map state |
| `useGamification` hook | XP, level, achievements | Global user progression |
| `useRevenueSummary` (dashboard) | Revenue totals, counts | Dashboard-wide state |

---

## 5. Type Safety Issues

### 5.1 `any` Type Usage (50+ instances)

**Critical — `any` in production code:**

| File | Line(s) | Usage |
|------|---------|-------|
| `app/(tabs)/discover/index.tsx` | 49-53, 72 | `MapViewComponent: React.ComponentType<any>`, `MarkerComponent: any`, `PROVIDER_GOOGLE_VAL: any`, `mapRef: any` |
| `src/hooks/useGamification.ts` | 383-385 | Nested `as unknown as` chains |
| `src/hooks/useMapDiscovery.ts` | 121-125 | `Record<string, unknown>` casts |
| `src/stores/authStore.ts` | 19, 164, 173 | `Record<string, unknown>` for metadata |

### 5.2 Excessive Type Assertions — `as` (80+ instances)

Almost every Supabase query result is force-cast with `as`. This is the **#1 type safety risk**.

**Pattern found everywhere:**
```typescript
const { data } = await supabase.from("table").select("*");
const typed = (data as MyType[]) ?? [];
```

**Worst offenders:**
| File | `as` Count | Example |
|------|:----------:|---------|
| `src/stores/groupStore.ts` | 8 | `as Group[]`, `as Organization[]` |
| `src/hooks/useInvoices.ts` | 8 | `as Invoice[]`, `as InvoiceStatus` |
| `src/hooks/useSessions.ts` | 5 | `as Session[]`, `as RecurringSchedule[]` |
| `src/hooks/useGamification.ts` | 8 | `as UserStats`, `as Achievement[]`, `as XpLog[]` |
| `src/hooks/useMembers.ts` | 5 | `as MemberWithDetails[]`, `as Profile[]` |
| `src/stores/authStore.ts` | 3 | `as Profile` |
| `src/stores/notificationStore.ts` | 2 | `as AppNotification[]` |
| `app/(tabs)/dashboard/payments.tsx` | 5 | Multiple invoice property casts |

> **Root cause:** Supabase client is not typed with the database schema. Generating types with `npx supabase gen types typescript` would eliminate most of these.

### 5.3 Missing Interfaces (10+ components)

Components with inline prop types instead of named interfaces:

| File | Component |
|------|-----------|
| `app/(tabs)/dashboard/index.tsx` | `StatCard`, `QuickActionButton` |
| `app/(tabs)/discover/index.tsx` | `LegendItem`, `ListCard` |
| `app/(tabs)/groups/[groupId]/sessions.tsx` | `SessionCard` |
| `app/(tabs)/groups/[groupId]/invoices.tsx` | `RevenueChart`, `InvoiceRow` |
| `app/(tabs)/groups/[groupId]/members.tsx` | `MemberRow` |
| `app/(tabs)/groups/[groupId]/attendance/[sessionId].tsx` | `AttendanceRow` |
| `src/components/map/FilterDrawer.tsx` | `SectionLabel` |

### 5.4 Missing Return Types (30+ functions)

All hooks in `src/hooks/` lack explicit return types:
- `useSessions`, `useMembers`, `useInvoices`, `useGamification`, `useMapDiscovery`, `useAttendance`, `useDocuments`, `useContracts`, `useChildren`

All store actions in `src/stores/` lack return types on async functions.

---

## 6. Refactor Priority Matrix

### P0 — Critical (fix before any feature work)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Add error states to all data-fetching hooks | Users see failures | Low |
| 2 | Generate Supabase types (`npx supabase gen types`) | Eliminates 80+ `as` casts | Low |
| 3 | Replace `any` in `discover/index.tsx` map components | Runtime crash risk | Low |

### P1 — High (next sprint)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 4 | Create `src/constants/strings.ts` for all UI text | i18n-ready, single source of truth | Medium |
| 5 | Create `src/constants/spacing.ts` for layout values | Consistent spacing | Low |
| 6 | Add `Colors.text.inverse` and replace all `#FFF` | Theme consistency | Low |
| 7 | Extract inline component props into named interfaces | Code readability | Low |
| 8 | Consolidate `create-group.tsx` (8 useState) with `useReducer` | Maintainability | Low |

### P2 — Medium (scheduled cleanup)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 9 | Remove unused components or integrate gamification | Reduce bundle size | Medium |
| 10 | Remove unused imports (12 instances) | Clean code | Low |
| 11 | Remove unused hooks/exports (11 instances) | Reduce dead code | Low |
| 12 | Add explicit return types to all hooks | Developer experience | Medium |
| 13 | Move filter state to Zustand store | Cross-screen consistency | Medium |
| 14 | Consolidate `account.tsx` (7 useState) | Maintainability | Low |

### P3 — Low (backlog)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 15 | Replace all magic numbers with spacing/sizing constants | Full theme control | High |
| 16 | Move map discovery state to Zustand | Architecture | Medium |
| 17 | Extract all hardcoded URLs to constants | Configuration | Low |
| 18 | Add missing return types to store actions | TypeScript strictness | Medium |

---

## Files Most in Need of Refactoring

Ranked by total issues found:

1. **`app/(tabs)/discover/index.tsx`** — 6 `any` types, 30+ magic numbers, 10+ hardcoded colors, conditional dynamic imports
2. **`app/(tabs)/dashboard/index.tsx`** — 40+ magic numbers, unused import, inline props, 4 useState in hook
3. **`src/hooks/useGamification.ts`** — 8 type assertions, missing error state, entirely unused hook
4. **`app/modals/create-group.tsx`** — 8 useState, unused import, hardcoded strings/colors
5. **`src/components/map/FilterDrawer.tsx`** — 20+ magic numbers, 8+ hardcoded colors, inline props
6. **`app/(tabs)/profile/account.tsx`** — 7 useState, unused import, hardcoded strings
7. **`src/stores/groupStore.ts`** — 8 type assertions
8. **`src/hooks/useInvoices.ts`** — 8 type assertions, missing error state, unused export

---

> **Next step:** Review this report and approve for Phase 2 (Testing Infrastructure) or request changes to the audit scope.

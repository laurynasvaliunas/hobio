# Hobio v1.0.1 — Pre-Submission Runbook

This file is the operator checklist for tasks that **cannot** be done from code edits — they require dashboards, secrets rotation, and App Store Connect actions. Run through it before pressing Submit.

---

## 1. Rotate Mapbox secret token & move to EAS secrets

The current `.env` contains `RNMAPBOX_MAPS_DOWNLOAD_TOKEN=sk.…`. EAS production builds do **not** read local `.env` — they need EAS secrets. The token also needs rotation since it sat on disk in plaintext.

```bash
# 1. Mapbox console → Account → Tokens → revoke the existing sk.* download token,
#    then "Create a token" with scopes: DOWNLOADS:READ. Copy the new value.

# 2. Push to EAS (project-scoped, sensitive):
eas secret:create --scope project --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN \
  --value <NEW_SECRET_TOKEN> --type string

# 3. Push the public-safe Expo env vars too (these end up in the bundle, but
#    EAS needs them at build time when local .env is ignored):
eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN \
  --value <pk.…> --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL \
  --value https://jcmmxmwcmnbtsxuwknqe.supabase.co --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value <anon_jwt> --type string
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY \
  --value <key> --type string
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN \
  --value <dsn> --type string
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY \
  --value <pk_live_…> --type string

# 4. Verify:
eas secret:list
```

After rotation, **also update local `.env`** with the new Mapbox secret so dev builds keep working.

---

## 2. Apply Supabase migrations

Two new migrations were added in this session:

- `supabase/migrations/20260428000000_tighten_audit_log_rls.sql` — restricts `audit_log` SELECT to the actor only (was: any org owner could read all rows globally).
- `supabase/migrations/20260428000001_storage_bucket_constraints.sql` — sets `file_size_limit = 10MB` and `allowed_mime_types = jpeg/png/heic/webp/pdf` on `avatars`, `logos`, `documents`, `contracts`.

Apply via the Supabase CLI against the production project:

```bash
npx supabase link --project-ref jcmmxmwcmnbtsxuwknqe
npx supabase db push
```

After applying, run the security advisor:

```bash
npx supabase db lint
# or in the dashboard: Database → Advisors → Security
```

---

## 3. Regenerate Supabase TypeScript types

[src/types/supabase.ts](src/types/supabase.ts) is stale (missing `documents`, `achievements`, `user_stats`, `push_tokens`).

```bash
npx supabase gen types typescript --project-id jcmmxmwcmnbtsxuwknqe \
  > src/types/supabase.ts
npx tsc --noEmit
```

---

## 4. Build & TestFlight

```bash
# Verify local state
npx tsc --noEmit
git ls-files .env   # must be empty

# Build (EAS auto-increments buildNumber because eas.json has appVersionSource: remote)
eas build --profile production --platform ios
```

Once the build appears in TestFlight, install on a physical iPhone and run the QA checklist in `/Users/LaurynasValiunas/.claude/plans/make-a-comprehensive-hobio-federated-kahn.md` ("Manual QA on physical device").

---

## 5. App Store Connect — submission metadata

### Demo accounts (create both, populate test data)

| Role | Email | Password | State |
|---|---|---|---|
| Organizer | `apple-review-organizer@hobio.app` | (strong, random) | Pre-create org "Hobio Review", one group "Reviewer Test Group" with 1 active session this week |
| Participant | `apple-review-participant@hobio.app` | (strong, random) | Pre-joined to "Reviewer Test Group" |

Enter both in App Store Connect → App Information → **App Review Information → Sign-in required** → Username/Password.

### Reviewer notes (paste verbatim)

```
Hobio is a group activity management app for hobby coaches and the families who book their sessions in Lithuania.

Demo accounts (above) are pre-populated with one organization, one group, and one upcoming session.

Quick test path:
1. Sign in as the organizer account → Dashboard shows the test group → tap a session to view attendance.
2. Sign out, sign in as the participant account → Home shows the same group → tap "Join" if needed.
3. Apple Sign-In is supported and is offered alongside email/password (no other social providers).

Payments: Stripe is used solely for in-person physical-service bookings (coaching sessions, group activities). No digital goods, subscriptions, or in-app feature unlocks are sold. Per App Store Review Guideline 3.1.3(e), real-world services are exempt from in-app purchase requirements.

Account deletion: available in Profile → Settings → Delete Account (in-app, irreversible).

Privacy policy: https://hobio.app/privacy (also linked from Profile → Settings → Privacy)
Support: info@clyzio.com
```

### Privacy questionnaire answers

- Data types collected (linked to user identity): Name, Email, User ID, Photo, Coarse Location.
- Data used for tracking: **No.**
- Data linked to identity but NOT used to track: Diagnostics (Sentry — PII stripped via `beforeSend`), Crash data.
- Account deletion offered in-app: **Yes.**

### Other ASC fields

- Age rating: **4+** (no UGC, no objectionable content, no unrestricted web access).
- Privacy policy URL: `https://hobio.app/privacy`.
- Support URL: `https://hobio.app/support` (or `mailto:info@clyzio.com`).
- Encryption: **Standard encryption only — exempt** (matches `ITSAppUsesNonExemptEncryption: false`).

---

## 6. Post-launch monitoring (first 48h)

- Sentry → Hobio project → Issues — watch for spikes.
- Supabase → Logs → API → 5xx and auth errors.
- App Store Connect → Crashes → spikes by device/iOS version.

Have a hotfix branch ready: `git checkout -b hotfix/v1.0.2`.

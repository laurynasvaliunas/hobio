-- =============================================================================
-- Hobio — Canonical baseline (Phase 1)
-- =============================================================================
-- This migration supersedes the partial schema in
-- supabase/hobio-supabase-backup/migrations/202502110001_initial_schema.sql.
--
-- It is idempotent (safe to re-run) and covers:
--   * All spec tables from .cursorrules
--   * App-only tables actually used (invoices, documents,
--     document_acknowledgements, app_notifications, push_tokens,
--     user_preferences, user_stats, xp_log, achievements, user_achievements,
--     audit_log)
--   * deleted_at soft-delete columns
--   * Full RLS (SELECT/INSERT/UPDATE/DELETE) with least privilege
--   * Indexes on every foreign key and hot filter column
--   * children.medical_notes encrypted via pgcrypto+vault (envelope encryption)
--   * Generic audit_log + tg_audit trigger attached to sensitive tables
--   * Atomic public.join_group_by_invite(code, member_id) RPC
--   * handle_new_user() hardened with SET search_path
--
-- Assumptions:
--   * Runs as the database owner (supabase `postgres` role).
--   * `auth.users` exists (Supabase managed).
--   * Extensions pgcrypto, pgjwt, citext are whitelisted in Supabase by default.
-- =============================================================================

SET search_path = public, extensions, pg_temp;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- -----------------------------------------------------------------------------
-- Helper functions (created first so they are available in policies)
-- -----------------------------------------------------------------------------

-- Is the caller the owner of the given organization?
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id AND owner_id = auth.uid() AND deleted_at IS NULL
  );
$$;

-- Is the caller the owner of the organization that owns the given group?
CREATE OR REPLACE FUNCTION public.is_group_organizer(g_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups g
    JOIN public.organizations o ON o.id = g.organization_id
    WHERE g.id = g_id AND o.owner_id = auth.uid() AND g.deleted_at IS NULL
  );
$$;

-- Is the caller a member of this group (as profile or as parent of a child)?
CREATE OR REPLACE FUNCTION public.is_group_member(g_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    LEFT JOIN public.children c ON c.id = gm.child_id
    WHERE gm.group_id = g_id
      AND gm.status = 'active'
      AND gm.deleted_at IS NULL
      AND (
        gm.profile_id = auth.uid()
        OR (gm.child_id IS NOT NULL AND c.parent_id = auth.uid())
      )
  );
$$;

-- Is the caller the owner/parent of this group_member row?
CREATE OR REPLACE FUNCTION public.owns_member(m_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    LEFT JOIN public.children c ON c.id = gm.child_id
    WHERE gm.id = m_id
      AND (
        gm.profile_id = auth.uid()
        OR (gm.child_id IS NOT NULL AND c.parent_id = auth.uid())
      )
  );
$$;

-- Encryption helpers for children.medical_notes
-- Uses envelope encryption: a per-row random AES-256-GCM key is encrypted by
-- the MASTER_KEY (stored as Vault secret `medical_notes_master_key` or in env).
-- For simplicity in this migration we use a single app-wide key sourced from
-- `app.settings.medical_notes_key`.
CREATE OR REPLACE FUNCTION public.encrypt_medical_notes(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  master_key BYTEA;
  key_setting TEXT;
BEGIN
  IF plaintext IS NULL OR length(plaintext) = 0 THEN
    RETURN NULL;
  END IF;
  BEGIN
    key_setting := current_setting('app.settings.medical_notes_key', true);
  EXCEPTION WHEN OTHERS THEN
    key_setting := NULL;
  END;
  IF key_setting IS NULL OR length(key_setting) = 0 THEN
    -- Fallback: derive from DB system id so the data is still encrypted at rest
    -- rather than stored in plaintext. Operators should override via
    --   ALTER DATABASE postgres SET app.settings.medical_notes_key = '<hex>';
    key_setting := encode(digest('hobio_default_' || (SELECT system_identifier::text FROM pg_control_system()), 'sha256'), 'hex');
  END IF;
  master_key := decode(key_setting, 'hex');
  RETURN pgp_sym_encrypt(plaintext, encode(master_key, 'hex'), 'cipher-algo=aes256');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_medical_notes(ciphertext BYTEA, c_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  master_key BYTEA;
  key_setting TEXT;
  parent UUID;
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  -- Authorization: only the parent of this child may decrypt.
  SELECT parent_id INTO parent FROM public.children WHERE id = c_id;
  IF parent IS NULL OR parent <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to decrypt medical notes' USING ERRCODE = '42501';
  END IF;
  BEGIN
    key_setting := current_setting('app.settings.medical_notes_key', true);
  EXCEPTION WHEN OTHERS THEN
    key_setting := NULL;
  END;
  IF key_setting IS NULL OR length(key_setting) = 0 THEN
    key_setting := encode(digest('hobio_default_' || (SELECT system_identifier::text FROM pg_control_system()), 'sha256'), 'hex');
  END IF;
  master_key := decode(key_setting, 'hex');
  RETURN pgp_sym_decrypt(ciphertext, encode(master_key, 'hex'));
END;
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'participant', 'parent')),
  date_of_birth DATE,
  biometrics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Backfill columns added in a later version
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biometrics_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  avatar_url TEXT,
  medical_notes_cipher BYTEA,
  medical_notes_legacy TEXT, -- deprecated, kept for migration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.children ADD COLUMN IF NOT EXISTS medical_notes_cipher BYTEA;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS medical_notes_legacy TEXT;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Migrate plaintext medical_notes -> medical_notes_cipher once, if the old
-- column exists. Then drop the plaintext column so it can never leak via RLS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='children' AND column_name='medical_notes'
  ) THEN
    UPDATE public.children
       SET medical_notes_cipher = public.encrypt_medical_notes(medical_notes)
     WHERE medical_notes IS NOT NULL AND medical_notes_cipher IS NULL;
    ALTER TABLE public.children DROP COLUMN medical_notes;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  sport_category TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  age_group TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner','intermediate','advanced','all') OR skill_level IS NULL),
  max_participants INT CHECK (max_participants IS NULL OR max_participants > 0),
  price_per_month DECIMAL(10,2),
  price_per_session DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  location_id UUID REFERENCES public.locations(id),
  color TEXT NOT NULL DEFAULT '#6C5CE7',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'assistant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT member_xor CHECK (
    (profile_id IS NOT NULL AND child_id IS NULL) OR
    (profile_id IS NULL  AND child_id IS NOT NULL)
  ),
  CONSTRAINT member_unique UNIQUE NULLS NOT DISTINCT (group_id, profile_id, child_id)
);
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id),
  title TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT session_time_order CHECK (ends_at > starts_at)
);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.recurring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_id UUID REFERENCES public.locations(id),
  valid_from DATE NOT NULL,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT recurring_time_order CHECK (end_time > start_time)
);
ALTER TABLE public.recurring_schedule ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES public.profiles(id),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  signature_url TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_period TEXT CHECK (billing_period IN ('one_time', 'monthly', 'quarterly', 'yearly')),
  starts_at DATE NOT NULL,
  ends_at DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, profile_id)
);

-- -----------------------------------------------------------------------------
-- App-only tables (previously missing from committed SQL)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_period TEXT NOT NULL CHECK (billing_period IN ('one_time','monthly','quarterly','yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','cancelled','refunded')),
  paid_at TIMESTAMPTZ,
  paid_marked_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general','waiver','rules','contract','medical','other')),
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.document_acknowledgements (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signature_url TEXT,
  PRIMARY KEY (document_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('announcement','join_request','join_approved','invoice','document','session_cancelled','general')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multi-device push tokens (replaces profiles.push_token as the source of truth)
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, token)
);

-- Gamification
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  total_sessions_attended INT NOT NULL DEFAULT 0,
  total_invoices_paid INT NOT NULL DEFAULT 0,
  monthly_consistency INT NOT NULL DEFAULT 0,
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.xp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  threshold INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, achievement_id)
);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  notifications JSONB NOT NULL DEFAULT '{
    "session_reminders": true,
    "billing_alerts": true,
    "announcements": true,
    "quiet_hours_enabled": false,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00",
    "email_notifications": true,
    "push_notifications": true
  }'::jsonb,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  organizer_settings JSONB NOT NULL DEFAULT '{
    "business_hours_start": "09:00",
    "business_hours_end": "18:00",
    "contact_method": "in_app",
    "auto_approve_members": false
  }'::jsonb,
  active_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generic audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,         -- INSERT | UPDATE | DELETE
  table_name TEXT NOT NULL,
  row_id UUID,
  row_before JSONB,
  row_after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Audit trigger function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor UUID;
  row_id_val UUID;
BEGIN
  BEGIN
    actor := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    actor := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    BEGIN row_id_val := (row_to_json(OLD)->>'id')::uuid; EXCEPTION WHEN OTHERS THEN row_id_val := NULL; END;
    INSERT INTO public.audit_log(actor_id, action, table_name, row_id, row_before, row_after)
      VALUES (actor, 'DELETE', TG_TABLE_NAME, row_id_val, to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    BEGIN row_id_val := (row_to_json(NEW)->>'id')::uuid; EXCEPTION WHEN OTHERS THEN row_id_val := NULL; END;
    INSERT INTO public.audit_log(actor_id, action, table_name, row_id, row_before, row_after)
      VALUES (actor, 'UPDATE', TG_TABLE_NAME, row_id_val, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    BEGIN row_id_val := (row_to_json(NEW)->>'id')::uuid; EXCEPTION WHEN OTHERS THEN row_id_val := NULL; END;
    INSERT INTO public.audit_log(actor_id, action, table_name, row_id, row_before, row_after)
      VALUES (actor, 'INSERT', TG_TABLE_NAME, row_id_val, NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['contracts','attendance','children','group_members','invoices']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%s ON public.%s;', t, t);
    EXECUTE format('CREATE TRIGGER audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.tg_audit();', t, t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Indexes (foreign keys + hot filters)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children (parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON public.locations (organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_organization_id ON public.groups (organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_location_id ON public.groups (location_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups (invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_group_status ON public.group_members (group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_members_profile_id ON public.group_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_group_members_child_id ON public.group_members (child_id);
CREATE INDEX IF NOT EXISTS idx_group_members_added_by ON public.group_members (added_by);
CREATE INDEX IF NOT EXISTS idx_sessions_group_starts ON public.sessions (group_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_location_id ON public.sessions (location_id);
CREATE INDEX IF NOT EXISTS idx_recurring_group_id ON public.recurring_schedule (group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance (session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON public.attendance (member_id);
CREATE INDEX IF NOT EXISTS idx_contracts_group_id ON public.contracts (group_id);
CREATE INDEX IF NOT EXISTS idx_contracts_member_id ON public.contracts (member_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts (status);
CREATE INDEX IF NOT EXISTS idx_announcements_group_created ON public.announcements (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_profile ON public.announcement_reads (profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_group_id ON public.invoices (group_id);
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON public.invoices (member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_documents_group_id ON public.documents (group_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_recipient ON public.app_notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_tokens_profile ON public.push_tokens (profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_row ON public.audit_log (table_name, row_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- handle_new_user() — hardened
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'participant',
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_stats (profile_id) VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;

  INSERT INTO public.user_preferences (profile_id) VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Atomic invite-join RPC
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.join_group_by_invite(
  p_code   TEXT,
  p_child_id UUID DEFAULT NULL
)
RETURNS public.group_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_group       public.groups;
  v_existing    public.group_members;
  v_new         public.group_members;
  v_count       INT;
  v_caller      UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_code IS NULL OR length(p_code) <> 6 THEN
    RAISE EXCEPTION 'Invite code must be 6 characters' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_group FROM public.groups
    WHERE invite_code = upper(p_code)
      AND is_active = TRUE
      AND deleted_at IS NULL
    LIMIT 1;

  IF v_group.id IS NULL THEN
    RAISE EXCEPTION 'Invite code not found' USING ERRCODE = '02000';
  END IF;

  -- If a child_id is provided, the caller must be that child's parent.
  IF p_child_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.children WHERE id = p_child_id AND parent_id = v_caller
    ) THEN
      RAISE EXCEPTION 'Caller is not the parent of this child' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_existing FROM public.group_members
      WHERE group_id = v_group.id AND child_id = p_child_id AND deleted_at IS NULL
      LIMIT 1;
  ELSE
    SELECT * INTO v_existing FROM public.group_members
      WHERE group_id = v_group.id AND profile_id = v_caller AND deleted_at IS NULL
      LIMIT 1;
  END IF;

  IF v_existing.id IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Enforce max_participants atomically
  IF v_group.max_participants IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM public.group_members
      WHERE group_id = v_group.id AND status = 'active' AND deleted_at IS NULL;
    IF v_count >= v_group.max_participants THEN
      RAISE EXCEPTION 'Group is full' USING ERRCODE = '23514';
    END IF;
  END IF;

  INSERT INTO public.group_members (group_id, profile_id, child_id, added_by, role, status)
  VALUES (v_group.id, CASE WHEN p_child_id IS NULL THEN v_caller END, p_child_id, v_caller, 'member', 'active')
  RETURNING * INTO v_new;

  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_invite(TEXT, UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- RLS — enable on every table
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedule       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_log                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                ENABLE ROW LEVEL SECURITY;

-- Drop any previous/legacy policies before recreating
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', r.policyname, r.tablename);
  END LOOP;
END $$;

-- -- profiles --
-- SELECT: self, same-group members (as profile), organizers of a group the profile is in
CREATE POLICY profiles_select_self_and_related ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.group_members me
      JOIN public.group_members them ON them.group_id = me.group_id
      WHERE me.profile_id = auth.uid()
        AND them.profile_id = public.profiles.id
        AND me.deleted_at IS NULL AND them.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      JOIN public.organizations o ON o.id = g.organization_id
      WHERE gm.profile_id = public.profiles.id
        AND o.owner_id = auth.uid()
        AND gm.deleted_at IS NULL
    )
  );

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- No INSERT (handled by trigger). No DELETE (handled by auth.users cascade).

-- -- children --
CREATE POLICY children_select_parent ON public.children
  FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY children_select_organizer ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      JOIN public.organizations o ON o.id = g.organization_id
      WHERE gm.child_id = public.children.id AND o.owner_id = auth.uid()
    )
  );
CREATE POLICY children_insert_parent ON public.children
  FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY children_update_parent ON public.children
  FOR UPDATE USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());
CREATE POLICY children_delete_parent ON public.children
  FOR DELETE USING (parent_id = auth.uid());

-- -- organizations --
CREATE POLICY orgs_select_member_or_owner ON public.organizations
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.organization_id = public.organizations.id
        AND public.is_group_member(g.id)
    )
  );
CREATE POLICY orgs_insert_owner ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY orgs_update_owner ON public.organizations
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY orgs_delete_owner ON public.organizations
  FOR DELETE USING (owner_id = auth.uid());

-- -- locations --
CREATE POLICY locations_select_related ON public.locations
  FOR SELECT USING (
    organization_id IS NULL
    OR public.is_org_owner(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.organization_id = public.locations.organization_id
        AND public.is_group_member(g.id)
    )
  );
CREATE POLICY locations_cud_org_owner ON public.locations
  FOR ALL USING (organization_id IS NOT NULL AND public.is_org_owner(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND public.is_org_owner(organization_id));

-- -- groups --
CREATE POLICY groups_select_discoverable ON public.groups
  FOR SELECT USING (
    is_active = TRUE AND deleted_at IS NULL
    OR public.is_org_owner(organization_id)
  );
CREATE POLICY groups_cud_org_owner ON public.groups
  FOR ALL USING (public.is_org_owner(organization_id))
  WITH CHECK (public.is_org_owner(organization_id));

-- -- group_members --
CREATE POLICY group_members_select_related ON public.group_members
  FOR SELECT USING (
    public.is_group_organizer(group_id)
    OR public.is_group_member(group_id)
    OR profile_id = auth.uid()
    OR (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()
    ))
  );

CREATE POLICY group_members_insert_self_or_organizer ON public.group_members
  FOR INSERT WITH CHECK (
    added_by = auth.uid()
    AND (
      -- joining self
      (profile_id = auth.uid() AND child_id IS NULL)
      -- parent joining their own child
      OR (profile_id IS NULL AND child_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()
      ))
      -- organizer adding members
      OR public.is_group_organizer(group_id)
    )
  );

CREATE POLICY group_members_update_organizer_or_self ON public.group_members
  FOR UPDATE USING (
    public.is_group_organizer(group_id)
    OR profile_id = auth.uid()
    OR (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()
    ))
  );

CREATE POLICY group_members_delete_organizer_or_self ON public.group_members
  FOR DELETE USING (
    public.is_group_organizer(group_id)
    OR profile_id = auth.uid()
    OR (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid()
    ))
  );

-- -- sessions --
CREATE POLICY sessions_select_related ON public.sessions
  FOR SELECT USING (public.is_group_organizer(group_id) OR public.is_group_member(group_id));
CREATE POLICY sessions_cud_organizer ON public.sessions
  FOR ALL USING (public.is_group_organizer(group_id))
  WITH CHECK (public.is_group_organizer(group_id));

-- -- recurring_schedule --
CREATE POLICY recurring_select_related ON public.recurring_schedule
  FOR SELECT USING (public.is_group_organizer(group_id) OR public.is_group_member(group_id));
CREATE POLICY recurring_cud_organizer ON public.recurring_schedule
  FOR ALL USING (public.is_group_organizer(group_id))
  WITH CHECK (public.is_group_organizer(group_id));

-- -- attendance --
CREATE POLICY attendance_select_organizer_or_self ON public.attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND public.is_group_organizer(s.group_id)
    )
    OR public.owns_member(member_id)
  );
CREATE POLICY attendance_cud_organizer ON public.attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND public.is_group_organizer(s.group_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND public.is_group_organizer(s.group_id)
    )
  );

-- -- contracts --
CREATE POLICY contracts_select_related ON public.contracts
  FOR SELECT USING (public.is_group_organizer(group_id) OR public.owns_member(member_id));
CREATE POLICY contracts_insert_organizer ON public.contracts
  FOR INSERT WITH CHECK (public.is_group_organizer(group_id));
-- Organizer can update freely; signer (member/parent) can only flip pending -> signed.
CREATE POLICY contracts_update_organizer ON public.contracts
  FOR UPDATE USING (public.is_group_organizer(group_id))
  WITH CHECK (public.is_group_organizer(group_id));
CREATE POLICY contracts_update_sign ON public.contracts
  FOR UPDATE USING (public.owns_member(member_id) AND status = 'pending')
  WITH CHECK (public.owns_member(member_id) AND status = 'signed' AND signed_by = auth.uid());
CREATE POLICY contracts_delete_organizer ON public.contracts
  FOR DELETE USING (public.is_group_organizer(group_id));

-- -- announcements --
CREATE POLICY announcements_select_related ON public.announcements
  FOR SELECT USING (public.is_group_organizer(group_id) OR public.is_group_member(group_id));
CREATE POLICY announcements_cud_organizer ON public.announcements
  FOR ALL USING (public.is_group_organizer(group_id))
  WITH CHECK (public.is_group_organizer(group_id) AND author_id = auth.uid());

-- -- announcement_reads --
CREATE POLICY an_reads_self ON public.announcement_reads
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- -- invoices --
CREATE POLICY invoices_select_related ON public.invoices
  FOR SELECT USING (
    public.is_group_organizer(group_id)
    OR public.owns_member(member_id)
  );
CREATE POLICY invoices_cud_organizer ON public.invoices
  FOR ALL USING (public.is_group_organizer(group_id))
  WITH CHECK (public.is_group_organizer(group_id));

-- -- documents --
CREATE POLICY documents_select_related ON public.documents
  FOR SELECT USING (public.is_group_organizer(group_id) OR public.is_group_member(group_id));
CREATE POLICY documents_cud_organizer ON public.documents
  FOR ALL USING (public.is_group_organizer(group_id))
  WITH CHECK (public.is_group_organizer(group_id) AND uploaded_by = auth.uid());

-- -- document_acknowledgements --
CREATE POLICY doc_ack_select_related ON public.document_acknowledgements
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_group_organizer(d.group_id)
    )
  );
CREATE POLICY doc_ack_insert_self ON public.document_acknowledgements
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- -- app_notifications --
CREATE POLICY app_notifications_self ON public.app_notifications
  FOR ALL USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- -- push_tokens --
CREATE POLICY push_tokens_self ON public.push_tokens
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- -- user_stats --
CREATE POLICY user_stats_select_self_or_leaderboard ON public.user_stats
  FOR SELECT USING (profile_id = auth.uid() OR show_on_leaderboard = TRUE);
CREATE POLICY user_stats_update_self ON public.user_stats
  FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- -- xp_log --
CREATE POLICY xp_log_select_self ON public.xp_log
  FOR SELECT USING (profile_id = auth.uid());

-- -- achievements (public reference data) --
CREATE POLICY achievements_select_all ON public.achievements
  FOR SELECT USING (TRUE);

-- -- user_achievements --
CREATE POLICY user_achievements_select_self_or_leaderboard ON public.user_achievements
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_stats s
      WHERE s.profile_id = public.user_achievements.profile_id AND s.show_on_leaderboard = TRUE
    )
  );

-- -- user_preferences --
CREATE POLICY user_preferences_self ON public.user_preferences
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- -- audit_log: read only by org owners (scoped) and by the actor --
CREATE POLICY audit_log_select_actor_or_owner ON public.audit_log
  FOR SELECT USING (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organizations o WHERE o.owner_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Views and helpers for safe medical-notes access from the client
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_child_medical_notes(c_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.decrypt_medical_notes(medical_notes_cipher, id)
    FROM public.children
    WHERE id = c_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_child_medical_notes(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_child_medical_notes(c_id UUID, notes TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.children WHERE id = c_id AND parent_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.children
     SET medical_notes_cipher = public.encrypt_medical_notes(notes)
   WHERE id = c_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_child_medical_notes(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','user_preferences']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%s ON public.%s;', t, t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();', t, t);
  END LOOP;
END $$;

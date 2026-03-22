-- Hobio Initial Schema
-- Run this in your Supabase project SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'participant', 'parent')),
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children (parent → child)
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  avatar_url TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  sport_category TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  age_group TEXT,
  skill_level TEXT,
  max_participants INT,
  price_per_month DECIMAL(10,2),
  price_per_session DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  location_id UUID REFERENCES locations(id),
  color TEXT DEFAULT '#10B981',
  is_active BOOLEAN DEFAULT TRUE,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'assistant')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT member_xor CHECK (
    (profile_id IS NOT NULL AND child_id IS NULL) OR
    (profile_id IS NULL AND child_id IS NOT NULL)
  )
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  title TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring schedule
CREATE TABLE IF NOT EXISTS recurring_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_id UUID REFERENCES locations(id),
  valid_from DATE NOT NULL,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES profiles(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, member_id)
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  billing_period TEXT CHECK (billing_period IN ('one_time', 'monthly', 'quarterly', 'yearly')),
  starts_at DATE NOT NULL,
  ends_at DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement reads
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (announcement_id, profile_id)
);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'participant'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: enable on all tables (basic policies; expand as needed)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any, update own
CREATE POLICY "Profiles read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Children: parent only
CREATE POLICY "Children parent CRUD" ON children FOR ALL USING (auth.uid() = parent_id);

-- Organizations: read all, owner write
CREATE POLICY "Orgs read" ON organizations FOR SELECT USING (true);
CREATE POLICY "Orgs owner" ON organizations FOR ALL USING (auth.uid() = owner_id);

-- Groups: read active, org owner write
CREATE POLICY "Groups read" ON groups FOR SELECT USING (is_active = true);
CREATE POLICY "Groups org owner" ON groups FOR ALL
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Group members: read if member of group, insert for join
CREATE POLICY "Group members read" ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE profile_id = auth.uid()
    )
    OR group_id IN (
      SELECT g.id FROM groups g
      JOIN organizations o ON g.organization_id = o.id
      WHERE o.owner_id = auth.uid()
    )
  );
CREATE POLICY "Group members insert" ON group_members FOR INSERT
  WITH CHECK (added_by = auth.uid() AND (profile_id = auth.uid() OR profile_id IS NULL));

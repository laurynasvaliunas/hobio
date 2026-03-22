export type UserRole = "organizer" | "participant" | "parent";
export type MemberRole = "member" | "assistant";
export type MemberStatus = "active" | "inactive" | "pending";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type ContractStatus = "pending" | "signed" | "expired" | "cancelled";
export type BillingPeriod = "one_time" | "monthly" | "quarterly" | "yearly";
export type AnnouncementPriority = "normal" | "important" | "urgent";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";
export type InvoiceStatus = "unpaid" | "paid" | "overdue" | "cancelled" | "refunded";
export type DocumentCategory = "general" | "waiver" | "rules" | "contract" | "medical" | "other";
export type NotificationType = "announcement" | "join_request" | "join_approved" | "invoice" | "document" | "session_cancelled" | "general";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  date_of_birth: string | null;
  biometrics_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string;
  avatar_url: string | null;
  medical_notes: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  sport_category: string;
  website: string | null;
  phone: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  organization_id: string | null;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  age_group: string | null;
  skill_level: SkillLevel | null;
  max_participants: number | null;
  price_per_month: number | null;
  price_per_session: number | null;
  currency: string;
  location_id: string | null;
  color: string;
  is_active: boolean;
  invite_code: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  profile_id: string | null;
  child_id: string | null;
  added_by: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
}

export interface Session {
  id: string;
  group_id: string;
  location_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface RecurringSchedule {
  id: string;
  group_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location_id: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  member_id: string;
  status: AttendanceStatus;
  marked_by: string | null;
  marked_at: string;
}

export interface Contract {
  id: string;
  group_id: string;
  member_id: string;
  title: string;
  description: string | null;
  document_url: string | null;
  price: number;
  currency: string;
  billing_period: BillingPeriod | null;
  starts_at: string;
  ends_at: string | null;
  status: ContractStatus;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  created_at: string;
}

export interface AnnouncementRead {
  announcement_id: string;
  profile_id: string;
  read_at: string;
}

export interface Document {
  id: string;
  group_id: string;
  uploaded_by: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  category: DocumentCategory;
  is_required: boolean;
  created_at: string;
}

export interface DocumentAcknowledgement {
  document_id: string;
  profile_id: string;
  acknowledged_at: string;
  signature_url: string | null;
}

export interface Invoice {
  id: string;
  group_id: string;
  member_id: string;
  profile_id: string | null;
  child_id: string | null;
  amount: number;
  currency: string;
  billing_period: BillingPeriod;
  period_start: string;
  period_end: string;
  status: InvoiceStatus;
  paid_at: string | null;
  paid_marked_by: string | null;
  notes: string | null;
  stripe_invoice_id: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── Gamification ──

export interface UserStats {
  id: string;
  profile_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_sessions_attended: number;
  total_invoices_paid: number;
  monthly_consistency: number;
  show_on_leaderboard: boolean;
  updated_at: string;
}

export interface XpLog {
  id: string;
  profile_id: string;
  amount: number;
  reason: string;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  threshold: number | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export type ThemeMode = "light" | "dark" | "system";
export type ContactMethod = "in_app" | "email" | "phone";

export interface NotificationPreferences {
  session_reminders: boolean;
  billing_alerts: boolean;
  announcements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface OrganizerSettings {
  business_hours_start: string;
  business_hours_end: string;
  contact_method: ContactMethod;
  auto_approve_members: boolean;
}

export interface UserPreferences {
  id: string;
  profile_id: string;
  notifications: NotificationPreferences;
  theme: ThemeMode;
  organizer_settings: OrganizerSettings;
  active_role: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified Database type placeholder.
 * Replace with auto-generated types via:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 *
 * For now, we use `any` to avoid generic conflicts with the Supabase client.
 * The entity interfaces above remain the source of truth for app-level typing.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Database {
  [key: string]: unknown;
}

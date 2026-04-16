import { z } from "zod";
import i18n from "../i18n";

/**
 * Shared Zod schemas for every form in the app.
 *
 * All schemas are factory functions so translations re-evaluate whenever the
 * user switches language — importing an eagerly-built schema would bake in
 * whichever locale was active at module load.
 *
 * Password rules match the Supabase `password_requirements` setting:
 *   - minimum 12 characters
 *   - at least one lower, one upper, one digit, one symbol
 */
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

/** Sign-in form schema. */
export function getSignInSchema() {
  return z.object({
    email: z
      .string()
      .min(1, i18n.t("validation.emailRequired"))
      .email(i18n.t("validation.emailInvalid")),
    password: z.string().min(1, i18n.t("validation.passwordRequired")),
  });
}
export type SignInFormData = z.infer<ReturnType<typeof getSignInSchema>>;

/** Sign-up form schema. Enforces the strong password policy. */
export function getSignUpSchema() {
  return z
    .object({
      fullName: z
        .string()
        .min(1, i18n.t("validation.nameRequired"))
        .min(2, i18n.t("validation.nameMin")),
      email: z
        .string()
        .min(1, i18n.t("validation.emailRequired"))
        .email(i18n.t("validation.emailInvalid")),
      password: z
        .string()
        .min(1, i18n.t("validation.passwordRequired"))
        .min(12, i18n.t("validation.passwordMin"))
        .regex(STRONG_PASSWORD, i18n.t("validation.passwordWeak")),
      confirmPassword: z.string().min(1, i18n.t("validation.confirmPassword")),
      acceptTerms: z.literal(true, {
        errorMap: () => ({ message: i18n.t("validation.termsRequired") }),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: i18n.t("validation.passwordsNoMatch"),
      path: ["confirmPassword"],
    });
}
export type SignUpFormData = z.infer<ReturnType<typeof getSignUpSchema>>;

export function getForgotPasswordSchema() {
  return z.object({
    email: z
      .string()
      .min(1, i18n.t("validation.emailRequired"))
      .email(i18n.t("validation.emailInvalid")),
  });
}
export type ForgotPasswordFormData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

/** Child (Family Vault) schema. */
export function getChildSchema() {
  return z.object({
    fullName: z
      .string()
      .min(1, i18n.t("validation.nameRequired"))
      .min(2, i18n.t("validation.nameMin")),
    dateOfBirth: z
      .string()
      .min(1, i18n.t("validation.dobRequired"))
      .regex(/^\d{4}-\d{2}-\d{2}$/, i18n.t("validation.dobFormat")),
    medicalNotes: z.string().max(2000).optional(),
  });
}
export type ChildFormData = z.infer<ReturnType<typeof getChildSchema>>;

/** Organization/create schema — used by organizer-setup and settings. */
export function getOrganizationSchema() {
  return z.object({
    name: z
      .string()
      .min(1, i18n.t("validation.orgNameRequired"))
      .min(2, i18n.t("validation.orgNameMin"))
      .max(80),
    description: z.string().max(500).optional(),
    sport_category: z.string().min(1, i18n.t("validation.sportRequired")),
    website: z.string().url(i18n.t("validation.urlInvalid")).optional().or(z.literal("")),
    phone: z.string().max(32).optional(),
  });
}
export type OrganizationFormData = z.infer<ReturnType<typeof getOrganizationSchema>>;

/** Group create/edit schema. */
export function getGroupSchema() {
  return z.object({
    name: z
      .string()
      .min(1, i18n.t("groups.groupNameRequired"))
      .min(2)
      .max(80),
    description: z.string().max(500).optional(),
    age_group: z.string().max(40).optional(),
    skill_level: z
      .enum(["beginner", "intermediate", "advanced", "all"])
      .optional(),
    max_participants: z
      .number()
      .int()
      .positive()
      .max(10_000)
      .optional(),
    price_per_month: z.number().min(0).max(100_000).optional(),
    price_per_session: z.number().min(0).max(100_000).optional(),
    currency: z.string().length(3).default("EUR"),
    color: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
      .default("#6C5CE7"),
    location_id: z.string().uuid().nullable().optional(),
  });
}
export type GroupFormData = z.infer<ReturnType<typeof getGroupSchema>>;

/** One-off session schema. */
export function getSessionSchema() {
  return z
    .object({
      group_id: z.string().uuid(),
      title: z.string().max(120).optional(),
      starts_at: z.string().datetime(),
      ends_at: z.string().datetime(),
      location_id: z.string().uuid().nullable().optional(),
      notes: z.string().max(500).optional(),
    })
    .refine((d) => new Date(d.ends_at).getTime() > new Date(d.starts_at).getTime(), {
      message: i18n.t("validation.endAfterStart"),
      path: ["ends_at"],
    });
}
export type SessionFormData = z.infer<ReturnType<typeof getSessionSchema>>;

/** Announcement schema. */
export function getAnnouncementSchema() {
  return z.object({
    group_id: z.string().uuid(),
    title: z.string().min(1, i18n.t("validation.titleRequired")).max(120),
    body: z.string().min(1, i18n.t("validation.bodyRequired")).max(4000),
    priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  });
}
export type AnnouncementFormData = z.infer<ReturnType<typeof getAnnouncementSchema>>;

/** Contract create schema (organizer). */
export function getContractSchema() {
  return z.object({
    group_id: z.string().uuid(),
    member_id: z.string().uuid(),
    title: z.string().min(1).max(120),
    description: z.string().max(4000).optional(),
    document_url: z.string().url().optional().or(z.literal("")),
    price: z.number().min(0).max(1_000_000),
    currency: z.string().length(3).default("EUR"),
    billing_period: z.enum(["one_time", "monthly", "quarterly", "yearly"]).default("monthly"),
    starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  });
}
export type ContractFormData = z.infer<ReturnType<typeof getContractSchema>>;

/** Invite code input schema (used by the join screen). */
export function getInviteCodeSchema() {
  return z.object({
    code: z
      .string()
      .trim()
      .length(6, i18n.t("groups.invalidCodeLength"))
      .regex(/^[A-Z2-9]{6}$/, i18n.t("groups.invalidCode")),
  });
}
export type InviteCodeFormData = z.infer<ReturnType<typeof getInviteCodeSchema>>;

import { z } from "zod";
import i18n from "../i18n";

/** Sign-in form schema — messages follow current locale */
export function getSignInSchema() {
  return z.object({
    email: z
      .string()
      .min(1, i18n.t("validation.emailRequired"))
      .email(i18n.t("validation.emailInvalid")),
    password: z
      .string()
      .min(1, i18n.t("validation.passwordRequired"))
      .min(6, i18n.t("validation.passwordMin")),
  });
}

export type SignInFormData = z.infer<ReturnType<typeof getSignInSchema>>;

/** Sign-up form schema */
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
        .min(6, i18n.t("validation.passwordMin")),
      confirmPassword: z.string().min(1, i18n.t("validation.confirmPassword")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: i18n.t("validation.passwordsNoMatch"),
      path: ["confirmPassword"],
    });
}

export type SignUpFormData = z.infer<ReturnType<typeof getSignUpSchema>>;

/** Child form schema (for Family Vault) */
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
    medicalNotes: z.string().optional(),
  });
}

export type ChildFormData = z.infer<ReturnType<typeof getChildSchema>>;

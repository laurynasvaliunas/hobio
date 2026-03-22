import { z } from "zod";

/** Sign-in form schema */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "At least 6 characters"),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/** Sign-up form schema */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "At least 6 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

/** Child form schema (for Family Vault) */
export const childSchema = z.object({
  fullName: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  medicalNotes: z.string().optional(),
});

export type ChildFormData = z.infer<typeof childSchema>;

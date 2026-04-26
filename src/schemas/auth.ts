import { z } from "zod"

export const RoleSchema = z.enum(["renter", "realtor"])
export type Role = z.infer<typeof RoleSchema>

/**
 * Supabase enforces a 6-character minimum on signup. We mirror it here so the
 * client surfaces the same ceiling instead of round-tripping a network error.
 */
const PasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password is too long")

const EmailSchema = z
  .email("Enter a valid email address")
  .min(1, "Email is required")
  .max(254, "Email is too long")

export const LoginPayloadSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
  role: RoleSchema,
})
export type LoginPayload = z.infer<typeof LoginPayloadSchema>

export const SignupPayloadSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirm: z.string().min(1, "Please confirm your password"),
    role: RoleSchema,
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })
export type SignupPayload = z.infer<typeof SignupPayloadSchema>

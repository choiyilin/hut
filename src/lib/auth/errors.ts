/**
 * Translate a Supabase `AuthError` (or anything we don't recognize) into a
 * compact taxonomy plus a user-facing message. The form layer pattern-matches
 * on `kind` to decide where to show the error (e.g. invalid-credentials goes
 * on the password field; rate-limited goes on a top-level banner).
 *
 * Pure: no Supabase SDK import — we accept the shape we need so the function
 * stays unit-testable without spinning up a client.
 */

export type AuthErrorCategory =
  | { readonly kind: "invalid-credentials"; readonly message: string }
  | { readonly kind: "user-not-confirmed"; readonly message: string }
  | { readonly kind: "user-already-exists"; readonly message: string }
  | { readonly kind: "weak-password"; readonly message: string }
  | { readonly kind: "rate-limited"; readonly message: string }
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "unknown"; readonly message: string }

/** The slice of Supabase's `AuthError` we actually look at. */
export type AuthErrorLike = {
  readonly message?: string | undefined
  readonly status?: number | undefined
  readonly code?: string | undefined
  readonly name?: string | undefined
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again."

export function categorizeAuthError(error: AuthErrorLike | null | undefined): AuthErrorCategory {
  if (!error) return { kind: "unknown", message: FALLBACK_MESSAGE }
  const code = error.code?.toLowerCase() ?? ""
  const message = error.message ?? ""
  const lower = message.toLowerCase()

  // Code-based matching first — Supabase 2.x emits stable codes.
  if (code === "invalid_credentials" || code === "invalid_grant") {
    return { kind: "invalid-credentials", message: "Email or password is incorrect." }
  }
  if (code === "email_not_confirmed") {
    return {
      kind: "user-not-confirmed",
      message: "Please confirm your email — check your inbox for the link.",
    }
  }
  if (code === "user_already_exists" || code === "email_exists") {
    return {
      kind: "user-already-exists",
      message: "An account with that email already exists. Try signing in.",
    }
  }
  if (code === "weak_password") {
    return { kind: "weak-password", message: message || "That password is too weak." }
  }
  if (code === "over_email_send_rate_limit" || error.status === 429) {
    return {
      kind: "rate-limited",
      message: "Too many attempts. Please wait a moment and try again.",
    }
  }

  // Message-based fallback for older Supabase versions / proxied errors.
  if (lower.includes("invalid login credentials")) {
    return { kind: "invalid-credentials", message: "Email or password is incorrect." }
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return {
      kind: "user-not-confirmed",
      message: "Please confirm your email — check your inbox for the link.",
    }
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return {
      kind: "user-already-exists",
      message: "An account with that email already exists. Try signing in.",
    }
  }
  if (
    error.name === "TypeError" ||
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return {
      kind: "network",
      message: "Couldn't reach the auth server. Check your connection and retry.",
    }
  }

  return { kind: "unknown", message: message || FALLBACK_MESSAGE }
}

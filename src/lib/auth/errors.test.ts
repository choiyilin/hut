import { describe, expect, it } from "vitest"

import { categorizeAuthError } from "./errors"

describe("categorizeAuthError", () => {
  it("returns unknown with a fallback message for null/undefined", () => {
    expect(categorizeAuthError(null)).toEqual({
      kind: "unknown",
      message: "Something went wrong. Please try again.",
    })
    expect(categorizeAuthError(undefined).kind).toBe("unknown")
  })

  describe("by code", () => {
    it("recognizes invalid_credentials", () => {
      const result = categorizeAuthError({ code: "invalid_credentials", message: "anything" })
      expect(result.kind).toBe("invalid-credentials")
      expect(result.message).toBe("Email or password is incorrect.")
    })

    it("recognizes invalid_grant as invalid-credentials", () => {
      expect(categorizeAuthError({ code: "invalid_grant" }).kind).toBe("invalid-credentials")
    })

    it("recognizes email_not_confirmed", () => {
      expect(categorizeAuthError({ code: "email_not_confirmed" }).kind).toBe("user-not-confirmed")
    })

    it("recognizes user_already_exists and email_exists", () => {
      expect(categorizeAuthError({ code: "user_already_exists" }).kind).toBe("user-already-exists")
      expect(categorizeAuthError({ code: "email_exists" }).kind).toBe("user-already-exists")
    })

    it("recognizes weak_password and uses the upstream message when present", () => {
      expect(categorizeAuthError({ code: "weak_password", message: "Password too short" })).toEqual(
        { kind: "weak-password", message: "Password too short" },
      )
    })

    it("falls back to a default message when weak_password has no message", () => {
      expect(categorizeAuthError({ code: "weak_password" }).message).toBe(
        "That password is too weak.",
      )
    })

    it("recognizes rate-limit by code or HTTP status", () => {
      expect(categorizeAuthError({ code: "over_email_send_rate_limit" }).kind).toBe("rate-limited")
      expect(categorizeAuthError({ status: 429 }).kind).toBe("rate-limited")
    })

    it("treats code matching as case-insensitive", () => {
      expect(categorizeAuthError({ code: "INVALID_CREDENTIALS" }).kind).toBe("invalid-credentials")
    })
  })

  describe("by message", () => {
    it("matches legacy 'Invalid login credentials' string", () => {
      expect(categorizeAuthError({ message: "Invalid login credentials" }).kind).toBe(
        "invalid-credentials",
      )
    })

    it("matches 'Email not confirmed'", () => {
      expect(categorizeAuthError({ message: "Email not confirmed" }).kind).toBe(
        "user-not-confirmed",
      )
    })

    it("matches 'User already registered'", () => {
      expect(categorizeAuthError({ message: "User already registered" }).kind).toBe(
        "user-already-exists",
      )
    })

    it("recognizes a TypeError as a network failure", () => {
      expect(categorizeAuthError({ name: "TypeError", message: "failed to fetch" }).kind).toBe(
        "network",
      )
    })

    it("recognizes 'network' in any case as a network failure", () => {
      expect(categorizeAuthError({ message: "Network request failed" }).kind).toBe("network")
    })
  })

  it("falls back to unknown with the upstream message", () => {
    const result = categorizeAuthError({ message: "Something weird happened" })
    expect(result).toEqual({ kind: "unknown", message: "Something weird happened" })
  })

  it("falls back to a default message when there's nothing to surface", () => {
    expect(categorizeAuthError({}).message).toBe("Something went wrong. Please try again.")
  })
})

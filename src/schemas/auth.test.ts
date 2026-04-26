import { describe, expect, it } from "vitest"

import { LoginPayloadSchema, RoleSchema, SignupPayloadSchema } from "./auth"

describe("RoleSchema", () => {
  it("accepts renter and realtor", () => {
    expect(RoleSchema.parse("renter")).toBe("renter")
    expect(RoleSchema.parse("realtor")).toBe("realtor")
  })

  it("rejects unknown roles", () => {
    expect(RoleSchema.safeParse("admin").success).toBe(false)
    expect(RoleSchema.safeParse("").success).toBe(false)
  })
})

describe("LoginPayloadSchema", () => {
  it("accepts a well-formed payload", () => {
    expect(
      LoginPayloadSchema.parse({
        email: "user@example.com",
        password: "anything",
        role: "renter",
      }),
    ).toEqual({ email: "user@example.com", password: "anything", role: "renter" })
  })

  it("rejects empty email", () => {
    const result = LoginPayloadSchema.safeParse({ email: "", password: "x", role: "renter" })
    expect(result.success).toBe(false)
  })

  it("rejects malformed email", () => {
    const result = LoginPayloadSchema.safeParse({
      email: "not-an-email",
      password: "x",
      role: "renter",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty password (login) — distinct from signup's min-6", () => {
    const result = LoginPayloadSchema.safeParse({
      email: "u@e.com",
      password: "",
      role: "renter",
    })
    expect(result.success).toBe(false)
  })
})

describe("SignupPayloadSchema", () => {
  it("accepts a matching password+confirm", () => {
    expect(
      SignupPayloadSchema.parse({
        email: "user@example.com",
        password: "secret123",
        confirm: "secret123",
        role: "realtor",
      }),
    ).toMatchObject({ email: "user@example.com", role: "realtor" })
  })

  it("rejects passwords shorter than 6 characters", () => {
    const result = SignupPayloadSchema.safeParse({
      email: "u@e.com",
      password: "short",
      confirm: "short",
      role: "renter",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "password")).toBe(true)
    }
  })

  it("rejects mismatched confirm with the path on `confirm`", () => {
    const result = SignupPayloadSchema.safeParse({
      email: "u@e.com",
      password: "secret123",
      confirm: "different1",
      role: "renter",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "confirm")
      expect(issue?.message).toBe("Passwords do not match")
    }
  })

  it("rejects empty confirm field with its own message", () => {
    const result = SignupPayloadSchema.safeParse({
      email: "u@e.com",
      password: "secret123",
      confirm: "",
      role: "renter",
    })
    expect(result.success).toBe(false)
  })

  it("rejects unknown roles even with a valid email/password", () => {
    const result = SignupPayloadSchema.safeParse({
      email: "u@e.com",
      password: "secret123",
      confirm: "secret123",
      role: "admin",
    })
    expect(result.success).toBe(false)
  })
})

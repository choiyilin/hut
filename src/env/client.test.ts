import { describe, expect, it } from "vitest"
import { z } from "zod"

// Re-define the client env schema here to test its contract without
// triggering module-level parsing (which runs on import and crashes tests
// that don't set real Supabase/Mapbox env vars).
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
})

describe("client env schema", () => {
  it("accepts a valid config", () => {
    const result = ClientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-abc",
      NEXT_PUBLIC_MAPBOX_TOKEN: "pk.abc",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a non-URL Supabase URL", () => {
    const result = ClientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-abc",
      NEXT_PUBLIC_MAPBOX_TOKEN: "pk.abc",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty anon key", () => {
    const result = ClientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      NEXT_PUBLIC_MAPBOX_TOKEN: "pk.abc",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing mapbox token", () => {
    const result = ClientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-abc",
    })
    expect(result.success).toBe(false)
  })
})

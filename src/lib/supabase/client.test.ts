import { describe, expect, it } from "vitest"

import { createClient } from "./client"

describe("createClient (browser)", () => {
  it("returns a Supabase client wired to the public env", () => {
    const client = createClient()
    expect(client.auth).toBeDefined()
    expect(typeof client.from).toBe("function")
  })
})

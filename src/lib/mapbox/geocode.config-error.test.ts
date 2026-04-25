import { describe, expect, it, vi } from "vitest"

// Separate test file because the env mock has to be hoisted at the module
// boundary — geocode.ts reads `mapboxToken` at call-time, not import-time, so
// a per-test mock would still see the real token from the parent test file.
vi.mock("server-only", () => ({}))
vi.mock("@/env/server", () => ({
  mapboxToken: undefined,
  serverEnv: { NODE_ENV: "test" },
}))

import { geocode } from "./geocode"

describe("geocode — config error", () => {
  it("returns config-error when no Mapbox token is configured", async () => {
    expect(await geocode("anywhere")).toEqual({
      kind: "config-error",
      reason: "MAPBOX_SECRET_TOKEN / NEXT_PUBLIC_MAPBOX_TOKEN unset",
    })
  })
})

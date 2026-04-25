import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { makeRealtorRow } from "../../../../tests/fixtures/realtor-listing-row"

import { selectListingById, selectListingsByOwner, selectPublicListings } from "./listings"

// ── Fake Supabase builder ────────────────────────────────────────────────────
//
// The real Supabase JS client is chainable; each filter method returns the
// builder. The terminal methods (.abortSignal / .maybeSingle / await) resolve
// to { data, error }. This fake records the calls and short-circuits to a
// configured response.

type FakeResponse = { data: unknown; error: { name?: string; message: string } | null }

type Builder = {
  readonly calls: { method: string; args: unknown[] }[]
} & PromiseLike<FakeResponse> & {
    select: (...args: unknown[]) => Builder
    in: (...args: unknown[]) => Builder
    eq: (...args: unknown[]) => Builder
    order: (...args: unknown[]) => Builder
    abortSignal: (...args: unknown[]) => Builder
    maybeSingle: () => Promise<FakeResponse>
  }

function fakeClient(response: FakeResponse): {
  client: SupabaseClient
  builder: Builder
} {
  const calls: { method: string; args: unknown[] }[] = []
  const builder = new Proxy({} as Builder, {
    get(_target, prop) {
      if (prop === "calls") return calls
      if (prop === "then") {
        return (
          onResolve: (value: FakeResponse) => unknown,
          onReject?: (reason: unknown) => unknown,
        ) => Promise.resolve(response).then(onResolve, onReject)
      }
      if (prop === "maybeSingle") {
        return () => {
          calls.push({ method: "maybeSingle", args: [] })
          return Promise.resolve(response)
        }
      }
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args })
        return builder
      }
    },
  })

  const fromFn = vi.fn(() => builder)
  const client = { from: fromFn } as unknown as SupabaseClient
  return { client, builder }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("selectPublicListings", () => {
  it("returns ok with mapped Listings on a clean fetch", async () => {
    const row = makeRealtorRow({ id: "row-1", title: "T" })
    const { client } = fakeClient({ data: [row], error: null })

    const result = await selectPublicListings(client)

    expect(result.kind).toBe("ok")
    if (result.kind === "ok") {
      expect(result.listings).toHaveLength(1)
      expect(result.listings[0]?.id).toBe("row-1")
      expect(result.listings[0]?.title).toBe("T")
    }
  })

  it("filters to active+pending and orders by date_posted desc", async () => {
    const { client, builder } = fakeClient({ data: [], error: null })
    await selectPublicListings(client)
    const inCall = builder.calls.find((c) => c.method === "in")
    const orderCall = builder.calls.find((c) => c.method === "order")
    expect(inCall?.args).toEqual(["status", ["active", "pending"]])
    expect(orderCall?.args).toEqual(["date_posted", { ascending: false }])
  })

  it("returns db-error when Supabase reports a failure", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } })
    expect(await selectPublicListings(client)).toEqual({ kind: "db-error", message: "boom" })
  })

  it("returns timeout when the abort signal fires", async () => {
    const { client } = fakeClient({
      data: null,
      error: { name: "AbortError", message: "aborted" },
    })
    expect(await selectPublicListings(client)).toEqual({ kind: "timeout" })
  })

  it("returns validation-error when a row fails the Zod schema", async () => {
    const bad = { ...makeRealtorRow(), price: "not-a-number" }
    const { client } = fakeClient({ data: [bad], error: null })
    const result = await selectPublicListings(client)
    expect(result.kind).toBe("validation-error")
  })

  it("merges an external abort signal with the timeout", async () => {
    const ctrl = new AbortController()
    const { client, builder } = fakeClient({ data: [], error: null })
    await selectPublicListings(client, { signal: ctrl.signal, timeoutMs: 5_000 })
    const abortCall = builder.calls.find((c) => c.method === "abortSignal")
    expect(abortCall).toBeDefined()
  })
})

describe("selectListingById", () => {
  it("returns the matching listing", async () => {
    const { client } = fakeClient({ data: makeRealtorRow({ id: "x" }), error: null })
    const result = await selectListingById(client, "x")
    expect(result.kind).toBe("ok")
    if (result.kind === "ok") expect(result.listings[0]?.id).toBe("x")
  })

  it("returns ok with empty listings when no row matches", async () => {
    const { client } = fakeClient({ data: null, error: null })
    expect(await selectListingById(client, "nope")).toEqual({ kind: "ok", listings: [] })
  })

  it("returns db-error on a Supabase failure", async () => {
    const { client } = fakeClient({ data: null, error: { message: "down" } })
    expect(await selectListingById(client, "x")).toEqual({ kind: "db-error", message: "down" })
  })

  it("returns validation-error when the row fails the schema", async () => {
    const { client } = fakeClient({ data: { ...makeRealtorRow(), beds: "many" }, error: null })
    const result = await selectListingById(client, "x")
    expect(result.kind).toBe("validation-error")
  })
})

describe("selectListingsByOwner", () => {
  it("filters by user_id and orders by date_posted desc", async () => {
    const { client, builder } = fakeClient({ data: [], error: null })
    await selectListingsByOwner(client, "user-42")
    const eqCall = builder.calls.find((c) => c.method === "eq")
    const orderCall = builder.calls.find((c) => c.method === "order")
    expect(eqCall?.args).toEqual(["user_id", "user-42"])
    expect(orderCall?.args).toEqual(["date_posted", { ascending: false }])
  })

  it("returns the owner's listings on success", async () => {
    const row = makeRealtorRow({ id: "owned-1", user_id: "user-42" })
    const { client } = fakeClient({ data: [row], error: null })
    const result = await selectListingsByOwner(client, "user-42")
    expect(result.kind).toBe("ok")
    if (result.kind === "ok") expect(result.listings).toHaveLength(1)
  })

  it("returns db-error on a Supabase failure", async () => {
    const { client } = fakeClient({ data: null, error: { message: "perm denied" } })
    expect(await selectListingsByOwner(client, "u")).toEqual({
      kind: "db-error",
      message: "perm denied",
    })
  })

  it("returns validation-error on schema failure", async () => {
    const { client } = fakeClient({ data: [{ ...makeRealtorRow(), beds: null }], error: null })
    expect((await selectListingsByOwner(client, "u")).kind).toBe("validation-error")
  })
})

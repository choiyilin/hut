import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const cookieGetAll = vi.fn(() => [{ name: "x", value: "1" }])
const cookieSet = vi.fn()
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ getAll: cookieGetAll, set: cookieSet }),
}))

import { createClient, makeCookieAdapter } from "./server"

describe("makeCookieAdapter", () => {
  it("getAll proxies to the store", () => {
    const store = { getAll: vi.fn(() => [{ name: "a", value: "b" }]), set: vi.fn() }
    const adapter = makeCookieAdapter(store as never)
    expect(adapter.getAll()).toEqual([{ name: "a", value: "b" }])
    expect(store.getAll).toHaveBeenCalledOnce()
  })

  it("setAll forwards each cookie as a ResponseCookie object to store.set", () => {
    const store = { getAll: vi.fn(() => []), set: vi.fn() }
    const adapter = makeCookieAdapter(store as never)
    const opts = { httpOnly: true, sameSite: "lax" as const }
    adapter.setAll([
      { name: "a", value: "1", options: opts },
      { name: "b", value: "2" },
    ])
    expect(store.set).toHaveBeenNthCalledWith(1, { name: "a", value: "1", ...opts })
    expect(store.set).toHaveBeenNthCalledWith(2, { name: "b", value: "2" })
  })

  it("setAll on an empty list is a no-op", () => {
    const store = { getAll: vi.fn(), set: vi.fn() }
    makeCookieAdapter(store as never).setAll([])
    expect(store.set).not.toHaveBeenCalled()
  })
})

describe("createClient (server)", () => {
  it("returns a Supabase client wired through the cookie adapter", async () => {
    const client = await createClient()
    expect(client.auth).toBeDefined()
    expect(typeof client.from).toBe("function")
  })
})

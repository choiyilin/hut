import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { SavedStorageAdapter } from "./storage"
import { SavedProvider, useSaved, type AuthResolver } from "./provider"

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  }),
}))

function makeAdapter(initial: Record<string, ReadonlySet<string>> = {}): SavedStorageAdapter {
  const backing = new Map<string, ReadonlySet<string>>(Object.entries(initial))
  return {
    load: vi.fn(
      async (userId): Promise<ReadonlySet<string>> =>
        backing.get(userId ?? "__anon__") ?? new Set<string>(),
    ),
    save: vi.fn(async (userId, ids) => {
      backing.set(userId ?? "__anon__", new Set(ids))
    }),
  }
}

function makeResolver(userId: string | null): AuthResolver {
  const subs = new Set<(id: string | null) => void>()
  return {
    getUserId: vi.fn(async () => userId),
    subscribe: vi.fn((cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    }),
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("SavedProvider + useSaved", () => {
  it("hydrates from the adapter for the resolved user", async () => {
    const adapter = makeAdapter({ u1: new Set(["a", "b"]) })
    const resolver = makeResolver("u1")
    const { result } = renderHook(() => useSaved(), {
      wrapper: ({ children }) => (
        <SavedProvider adapter={adapter} authResolver={resolver}>
          {children}
        </SavedProvider>
      ),
    })
    await waitFor(() => {
      expect([...result.current.savedIds].sort()).toEqual(["a", "b"])
    })
    expect(result.current.isSaved("a")).toBe(true)
    expect(result.current.isSaved("zzz")).toBe(false)
  })

  it("toggleSaved during loading is replayed onto the loaded set", async () => {
    let resolveLoad!: () => void
    const adapter: SavedStorageAdapter = {
      load: vi.fn(
        () =>
          new Promise<ReadonlySet<string>>((res) => {
            resolveLoad = () => res(new Set(["a"]))
          }),
      ),
      save: vi.fn(async () => {}),
    }
    const resolver = makeResolver("u1")
    const { result } = renderHook(() => useSaved(), {
      wrapper: ({ children }) => (
        <SavedProvider adapter={adapter} authResolver={resolver}>
          {children}
        </SavedProvider>
      ),
    })

    // Wait for loading state to begin (auth resolves async via Promise)
    await waitFor(() => {
      expect(adapter.load).toHaveBeenCalled()
    })

    // Toggle "b" while still loading; this should NOT be lost when load resolves
    act(() => {
      result.current.toggleSaved("b")
    })

    act(() => {
      resolveLoad()
    })

    await waitFor(() => {
      expect([...result.current.savedIds].sort()).toEqual(["a", "b"])
    })
    expect(adapter.save).toHaveBeenCalledWith("u1", new Set(["a", "b"]))
  })

  it("renders the children", () => {
    const adapter = makeAdapter()
    const resolver = makeResolver(null)
    render(
      <SavedProvider adapter={adapter} authResolver={resolver}>
        <p>hello</p>
      </SavedProvider>,
    )
    expect(screen.getByText("hello")).toBeInTheDocument()
  })

  it("re-hydrates when the auth resolver fires", async () => {
    const adapter = makeAdapter({
      __anon__: new Set(["anon-id"]),
      u1: new Set(["u1-id"]),
    })
    const subs = new Set<(id: string | null) => void>()
    const resolver: AuthResolver = {
      getUserId: vi.fn(async () => null),
      subscribe: vi.fn((cb) => {
        subs.add(cb)
        return () => subs.delete(cb)
      }),
    }
    const { result } = renderHook(() => useSaved(), {
      wrapper: ({ children }) => (
        <SavedProvider adapter={adapter} authResolver={resolver}>
          {children}
        </SavedProvider>
      ),
    })
    await waitFor(() => {
      expect([...result.current.savedIds]).toEqual(["anon-id"])
    })
    act(() => {
      for (const cb of subs) cb("u1")
    })
    await waitFor(() => {
      expect([...result.current.savedIds]).toEqual(["u1-id"])
    })
  })

  it("toggling after ready updates ids and persists", async () => {
    const adapter = makeAdapter({ u1: new Set() })
    const resolver = makeResolver("u1")
    const { result } = renderHook(() => useSaved(), {
      wrapper: ({ children }) => (
        <SavedProvider adapter={adapter} authResolver={resolver}>
          {children}
        </SavedProvider>
      ),
    })
    await waitFor(() => {
      expect(result.current.savedIds.size).toBe(0)
    })
    act(() => {
      result.current.toggleSaved("xyz")
    })
    expect(result.current.isSaved("xyz")).toBe(true)
    await waitFor(() => {
      expect(adapter.save).toHaveBeenCalledWith("u1", new Set(["xyz"]))
    })
  })

  it("throws when useSaved is called outside the provider", () => {
    // Suppress the React "uncaught error" log for this expected-throw case
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useSaved())).toThrow(
      /useSaved must be used inside a <SavedProvider>/,
    )
    errSpy.mockRestore()
  })
})

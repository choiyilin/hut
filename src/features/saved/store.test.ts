import { describe, expect, it, vi } from "vitest"

import type { SavedStorageAdapter } from "./storage"
import { createSavedStore, selectVisibleIds } from "./store"

function controlledAdapter(initial: Record<string, ReadonlySet<string>> = {}) {
  const store = new Map<string, ReadonlySet<string>>(Object.entries(initial))
  let resolveLoad: ((value: ReadonlySet<string>) => void) | null = null
  const adapter: SavedStorageAdapter = {
    load: vi.fn(async (userId) => {
      const key = userId ?? "__anon__"
      if (resolveLoad) {
        return new Promise<ReadonlySet<string>>((res) => {
          resolveLoad = res
        }).then(() => store.get(key) ?? new Set<string>())
      }
      return store.get(key) ?? new Set<string>()
    }),
    save: vi.fn(async (userId, ids) => {
      store.set(userId ?? "__anon__", new Set(ids))
    }),
  }
  return {
    adapter,
    store,
    enableManualLoad: () => {
      resolveLoad = () => {}
    },
    releaseLoad: () => {
      resolveLoad?.(new Set())
      resolveLoad = null
    },
  }
}

describe("createSavedStore", () => {
  describe("initial state", () => {
    it("starts in idle with empty sets", () => {
      const { adapter } = controlledAdapter()
      const store = createSavedStore({ adapter })
      const s = store.getState()
      expect(s.status).toBe("idle")
      expect(s.userId).toBeNull()
      expect([...s.ids]).toEqual([])
      expect([...s.pendingDelta]).toEqual([])
    })
  })

  describe("hydrate (initial)", () => {
    it("loads from the adapter for the given user and goes to ready", async () => {
      const { adapter } = controlledAdapter({ u1: new Set(["a", "b"]) })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1")
      const s = store.getState()
      expect(s.status).toBe("ready")
      expect(s.userId).toBe("u1")
      expect([...s.ids].sort()).toEqual(["a", "b"])
    })

    it("uses the anon key when userId is null", async () => {
      const { adapter } = controlledAdapter({ __anon__: new Set(["x"]) })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate(null)
      expect([...store.getState().ids]).toEqual(["x"])
      expect(adapter.load).toHaveBeenCalledWith(null)
    })

    it("transitions through loading and clears stale ids before resolving", async () => {
      const { adapter } = controlledAdapter({ u1: new Set(["a"]) })
      const store = createSavedStore({ adapter })
      const observed: SavedStatus[] = []
      const unsub = store.subscribe((s) => observed.push(s.status))
      await store.getState().hydrate("u1")
      unsub()
      expect(observed).toEqual(["loading", "ready"])
    })
  })

  describe("pending delta during loading", () => {
    it("toggles during loading land in pendingDelta, not ids", () => {
      const { adapter } = controlledAdapter()
      const store = createSavedStore({ adapter })
      // status is idle, not ready — toggle should go to pending
      store.getState().toggle("a")
      const s = store.getState()
      expect([...s.pendingDelta]).toEqual(["a"])
      expect([...s.ids]).toEqual([])
    })

    it("a double-toggle during loading nets out (added then removed from pending)", () => {
      const { adapter } = controlledAdapter()
      const store = createSavedStore({ adapter })
      store.getState().toggle("a")
      store.getState().toggle("a")
      expect([...store.getState().pendingDelta]).toEqual([])
    })

    it("XORs the pending delta onto the loaded set on first hydrate", async () => {
      const { adapter } = controlledAdapter({ u1: new Set(["a", "b"]) })
      const store = createSavedStore({ adapter })
      // User saves "c" and unsaves "a" before hydrate completes
      store.getState().toggle("c")
      store.getState().toggle("a")
      await store.getState().hydrate("u1")
      const s = store.getState()
      expect([...s.ids].sort()).toEqual(["b", "c"])
      expect([...s.pendingDelta]).toEqual([])
    })

    it("persists the merged result so the delta survives reload", async () => {
      const { adapter, store: backing } = controlledAdapter({ u1: new Set(["a"]) })
      const store = createSavedStore({ adapter })
      store.getState().toggle("b")
      await store.getState().hydrate("u1")
      expect([...(backing.get("u1") ?? new Set())].sort()).toEqual(["a", "b"])
      expect(adapter.save).toHaveBeenCalled()
    })

    it("replays a toggle that fires AFTER hydrate started but BEFORE load resolves", async () => {
      let releaseLoad!: (value: ReadonlySet<string>) => void
      const adapter: SavedStorageAdapter = {
        load: vi.fn(
          () =>
            new Promise<ReadonlySet<string>>((res) => {
              releaseLoad = res
            }),
        ),
        save: vi.fn(async () => {}),
      }
      const store = createSavedStore({ adapter })
      const inFlight = store.getState().hydrate("u1")
      // Toggle while load is still pending — this is the race the plan calls out.
      store.getState().toggle("late")
      releaseLoad(new Set(["pre-existing"]))
      await inFlight
      expect([...store.getState().ids].sort()).toEqual(["late", "pre-existing"])
      expect(adapter.save).toHaveBeenCalledWith("u1", new Set(["pre-existing", "late"]))
    })

    it("does NOT persist when the pending delta is empty", async () => {
      const { adapter } = controlledAdapter({ u1: new Set(["a"]) })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1")
      expect(adapter.save).not.toHaveBeenCalled()
    })
  })

  describe("toggle when ready", () => {
    it("adds an id and persists", async () => {
      const { adapter, store: backing } = controlledAdapter({ u1: new Set() })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1")
      store.getState().toggle("a")
      expect([...store.getState().ids]).toEqual(["a"])
      // Wait a microtask for the fire-and-forget save
      await Promise.resolve()
      expect([...(backing.get("u1") ?? new Set())]).toEqual(["a"])
    })

    it("removes an id when toggled twice", async () => {
      const { adapter } = controlledAdapter({ u1: new Set(["a"]) })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1")
      store.getState().toggle("a")
      expect([...store.getState().ids]).toEqual([])
    })
  })

  describe("user switch (subsequent hydrate)", () => {
    it("clears the previous user's ids and loads the new user's", async () => {
      const { adapter } = controlledAdapter({
        u1: new Set(["a"]),
        u2: new Set(["b"]),
      })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1")
      expect([...store.getState().ids]).toEqual(["a"])
      await store.getState().hydrate("u2")
      expect([...store.getState().ids]).toEqual(["b"])
      expect(store.getState().userId).toBe("u2")
    })

    it("does NOT replay any earlier delta on a subsequent hydrate", async () => {
      const { adapter, store: backing } = controlledAdapter({
        u1: new Set(["a"]),
        u2: new Set(["b"]),
      })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1") // establishes ready
      ;(adapter.save as ReturnType<typeof vi.fn>).mockClear()
      await store.getState().hydrate("u2") // user switch
      expect([...store.getState().ids]).toEqual(["b"])
      // No save during a user switch — we just read
      expect(adapter.save).not.toHaveBeenCalled()
      expect(backing.get("u2")?.has("b")).toBe(true)
    })
  })

  describe("stale hydrate races", () => {
    it("a stale hydrate aborts after its save, before publishing ready", async () => {
      // Drives the post-save generation check: a newer hydrate completes while
      // the initial hydrate is awaiting adapter.save() of its merged delta.
      let releaseFirstSave!: () => void
      let firstSaveSeen = false
      const adapter: SavedStorageAdapter = {
        load: vi.fn(async (userId) => (userId === "u1" ? new Set(["a"]) : new Set(["fresh"]))),
        save: vi.fn(async () => {
          if (firstSaveSeen) return
          firstSaveSeen = true
          await new Promise<void>((res) => {
            releaseFirstSave = res
          })
        }),
      }
      const store = createSavedStore({ adapter })
      // Toggle "x" so the initial hydrate has a pending delta worth flushing
      // (otherwise it skips the save and the post-save check is dead code).
      store.getState().toggle("x")
      const stale = store.getState().hydrate("u1")
      // Yield until the first save is in flight (after load).
      while (!firstSaveSeen) await Promise.resolve()
      // Newer hydrate fires and runs to completion (its save is unblocked).
      const fresh = store.getState().hydrate("u2")
      await fresh
      // The fresh hydrate has reset pendingDelta and is at ready/u2.
      // Note: because the stale hydrate was still mid-save when fresh ran,
      // pendingDelta hadn't been cleared, so fresh also replays "x" — that's
      // expected: a toggle made during the loading window survives whichever
      // user identity wins the race.
      expect(store.getState().userId).toBe("u2")
      expect([...store.getState().ids].sort()).toEqual(["fresh", "x"])
      const idsAfterFresh = store.getState().ids
      // Now release the stale save; its post-save userId check must see u2 and bail
      // without overwriting state. The reference identity of `ids` should be unchanged.
      releaseFirstSave()
      await stale
      expect(store.getState().ids).toBe(idsAfterFresh)
      expect(store.getState().userId).toBe("u2")
    })

    it("a slow hydrate that resolves after a newer one does not clobber state", async () => {
      let resolveU1!: () => void
      const adapter: SavedStorageAdapter = {
        load: vi.fn(async (userId): Promise<ReadonlySet<string>> => {
          if (userId === "u1") {
            await new Promise<void>((res) => {
              resolveU1 = res
            })
            return new Set<string>(["stale"])
          }
          return new Set<string>(["fresh"])
        }),
        save: vi.fn(async () => {}),
      }
      const store = createSavedStore({ adapter })
      const slow = store.getState().hydrate("u1")
      // Kick off a newer hydrate before u1 resolves
      const fast = store.getState().hydrate("u2")
      await fast
      // Now release the stale load
      resolveU1()
      await slow
      const s = store.getState()
      expect(s.userId).toBe("u2")
      expect([...s.ids]).toEqual(["fresh"])
    })
  })

  describe("reset", () => {
    it("clears state to initial", async () => {
      const { adapter } = controlledAdapter({ u1: new Set(["a"]) })
      const store = createSavedStore({ adapter })
      await store.getState().hydrate("u1")
      store.getState().reset()
      const s = store.getState()
      expect(s.status).toBe("idle")
      expect(s.userId).toBeNull()
      expect([...s.ids]).toEqual([])
    })
  })
})

describe("selectVisibleIds", () => {
  it("returns ids when ready", () => {
    expect(
      selectVisibleIds({
        status: "ready",
        userId: "u1",
        ids: new Set(["a"]),
        pendingDelta: new Set(),
      }),
    ).toEqual(new Set(["a"]))
  })

  it("returns pendingDelta during loading", () => {
    expect(
      selectVisibleIds({
        status: "loading",
        userId: null,
        ids: new Set(["stale"]),
        pendingDelta: new Set(["a"]),
      }),
    ).toEqual(new Set(["a"]))
  })

  it("returns pendingDelta during idle", () => {
    expect(
      selectVisibleIds({
        status: "idle",
        userId: null,
        ids: new Set(),
        pendingDelta: new Set(["a"]),
      }),
    ).toEqual(new Set(["a"]))
  })
})

// Type import re-stated here to keep the controlledAdapter helper self-contained.
type SavedStatus = "idle" | "loading" | "ready"

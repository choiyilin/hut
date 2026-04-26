import { createStore, type StoreApi } from "zustand/vanilla"

import type { SavedStorageAdapter } from "./storage"

/**
 * Lifecycle phases for the store:
 * - `idle`: pre-mount, no auth lookup attempted yet.
 * - `loading`: the user identity is being resolved and storage is being read.
 *   Heart-toggles during this window are recorded in `pendingDelta` and replayed
 *   onto the loaded set, fixing the original race where a save during the
 *   anon-then-user transition could be silently lost.
 * - `ready`: identity known, set hydrated; toggles persist immediately.
 */
export type SavedStatus = "idle" | "loading" | "ready"

export type SavedState = {
  readonly status: SavedStatus
  readonly userId: string | null
  readonly ids: ReadonlySet<string>
  /** IDs toggled before the first hydrate completed; applied as XOR onto the loaded set. */
  readonly pendingDelta: ReadonlySet<string>
}

export type SavedActions = {
  hydrate: (userId: string | null) => Promise<void>
  toggle: (id: string) => void
  reset: () => void
}

export type SavedStore = SavedState & SavedActions
export type SavedStoreApi = StoreApi<SavedStore>

const INITIAL: SavedState = {
  status: "idle",
  userId: null,
  ids: new Set(),
  pendingDelta: new Set(),
}

function xor(base: ReadonlySet<string>, delta: ReadonlySet<string>): Set<string> {
  const out = new Set(base)
  for (const id of delta) {
    if (out.has(id)) out.delete(id)
    else out.add(id)
  }
  return out
}

export function createSavedStore({ adapter }: { adapter: SavedStorageAdapter }): SavedStoreApi {
  return createStore<SavedStore>((set, get) => ({
    ...INITIAL,

    hydrate: async (userId) => {
      const isInitial = get().status !== "ready"

      // Move into loading and immediately clear visible ids so a stale set from
      // a previous user can never flash on screen during a user switch.
      set({ status: "loading", userId, ids: new Set() })

      const loaded = await adapter.load(userId)

      // If a newer hydrate started while we awaited (e.g. rapid login/logout),
      // bail — the newer call will produce the authoritative result.
      if (get().userId !== userId) return

      // Read pendingDelta AFTER awaiting load — toggles fired during loading
      // accumulate here and must all be replayed, not just the ones present
      // when hydrate began.
      const delta = get().pendingDelta
      let next = new Set(loaded)
      if (isInitial && delta.size > 0) {
        next = xor(loaded, delta)
        await adapter.save(userId, next)
      }

      // Re-check generation after save (await) to avoid clobbering a newer hydrate.
      if (get().userId !== userId) return

      set({ status: "ready", ids: next, pendingDelta: new Set() })
    },

    toggle: (id) => {
      const { status, ids, pendingDelta, userId } = get()
      if (status === "ready") {
        const nextIds = new Set(ids)
        if (nextIds.has(id)) nextIds.delete(id)
        else nextIds.add(id)
        set({ ids: nextIds })
        // Fire-and-forget; the adapter swallows write failures so the in-memory
        // state stays consistent for the session even if storage is unavailable.
        void adapter.save(userId, nextIds)
        return
      }
      const nextDelta = new Set(pendingDelta)
      if (nextDelta.has(id)) nextDelta.delete(id)
      else nextDelta.add(id)
      set({ pendingDelta: nextDelta })
    },

    reset: () => set({ ...INITIAL }),
  }))
}

/**
 * Selector matching the legacy `useSaved()` shape. Returns the user's set when
 * ready; during the loading window it returns the pending delta so that an
 * optimistic toggle still appears pressed before hydration finishes.
 */
export function selectVisibleIds(state: SavedState): ReadonlySet<string> {
  return state.status === "ready" ? state.ids : state.pendingDelta
}

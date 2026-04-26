import { z } from "zod"

/**
 * Persistence boundary for saved-listing IDs. Keeping this behind a type
 * lets us swap localStorage for a Supabase `saved_listings` table later without
 * touching the store or any UI consumers.
 */
export type SavedStorageAdapter = {
  load: (userId: string | null) => Promise<ReadonlySet<string>>
  save: (userId: string | null, ids: ReadonlySet<string>) => Promise<void>
}

export const STORAGE_KEY_PREFIX = "hut_saved_"
export const ANON_STORAGE_KEY = `${STORAGE_KEY_PREFIX}anon`

export function storageKeyFor(userId: string | null): string {
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : ANON_STORAGE_KEY
}

const PersistedSchema = z.array(z.string())

/**
 * Reads/writes saved IDs from `window.localStorage`. Tolerates legacy or
 * corrupted payloads by returning an empty set rather than throwing — losing
 * a heart icon is far preferable to crashing the listings page.
 */
export const localStorageAdapter: SavedStorageAdapter = {
  load: (userId) => Promise.resolve(loadSync(userId)),
  save: (userId, ids) => {
    saveSync(userId, ids)
    return Promise.resolve()
  },
}

function loadSync(userId: string | null): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set()
  let raw: string | null
  try {
    raw = window.localStorage.getItem(storageKeyFor(userId))
  } catch {
    return new Set()
  }
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    const result = PersistedSchema.safeParse(parsed)
    return result.success ? new Set(result.data) : new Set()
  } catch {
    return new Set()
  }
}

function saveSync(userId: string | null, ids: ReadonlySet<string>): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKeyFor(userId), JSON.stringify([...ids]))
  } catch {
    // Quota exceeded / privacy mode — drop silently; the in-memory store
    // still reflects the toggle so the UI stays consistent for this session.
  }
}

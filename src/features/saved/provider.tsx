"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useStore } from "zustand"

import { createClient } from "@/lib/supabase/client"

import { localStorageAdapter, type SavedStorageAdapter } from "./storage"
import { createSavedStore, selectVisibleIds, type SavedStore, type SavedStoreApi } from "./store"

const SavedStoreContext = createContext<SavedStoreApi | null>(null)

export type AuthResolver = {
  getUserId: () => Promise<string | null>
  subscribe: (cb: (userId: string | null) => void) => () => void
}

export type SavedProviderProps = {
  children: ReactNode
  /** Override hooks for tests; defaults wire to localStorage + Supabase. */
  adapter?: SavedStorageAdapter
  authResolver?: AuthResolver
}

function defaultAuthResolver(): AuthResolver {
  const supabase = createClient()
  return {
    getUserId: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    subscribe: (cb) => {
      const { data } = supabase.auth.onAuthStateChange((_, session) => {
        cb(session?.user.id ?? null)
      })
      return () => {
        data.subscription.unsubscribe()
      }
    },
  }
}

export function SavedProvider({
  children,
  adapter = localStorageAdapter,
  authResolver,
}: SavedProviderProps) {
  // useState's initializer runs exactly once per component mount, on both
  // server and client. The resulting store is purely in-memory and
  // SSR-safe (idle state, empty sets) — auth-driven hydration kicks in via
  // the effect below, browser-only.
  const [store] = useState<SavedStoreApi>(() => createSavedStore({ adapter }))

  useEffect(() => {
    const resolver = authResolver ?? defaultAuthResolver()
    let cancelled = false

    void resolver.getUserId().then((userId) => {
      if (cancelled) return
      void store.getState().hydrate(userId)
    })

    const unsubscribe = resolver.subscribe((userId) => {
      void store.getState().hydrate(userId)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [authResolver, store])

  return <SavedStoreContext.Provider value={store}>{children}</SavedStoreContext.Provider>
}

function useSavedStoreApi(): SavedStoreApi {
  const ctx = useContext(SavedStoreContext)
  if (!ctx) {
    throw new Error("useSaved must be used inside a <SavedProvider>")
  }
  return ctx
}

/**
 * Drop-in replacement for the legacy `useSaved()` hook. Same shape:
 * `{ savedIds, toggleSaved, isSaved }`. Internally subscribes to the Zustand
 * store so re-renders happen exactly when the visible set changes.
 */
export function useSaved(): {
  savedIds: ReadonlySet<string>
  toggleSaved: (id: string) => void
  isSaved: (id: string) => boolean
} {
  const store = useSavedStoreApi()
  const savedIds = useStore(store, selectVisibleIds)
  const toggle = useStore(store, (s: SavedStore) => s.toggle)
  const toggleSaved = useCallback((id: string) => toggle(id), [toggle])
  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])
  return useMemo(() => ({ savedIds, toggleSaved, isSaved }), [savedIds, toggleSaved, isSaved])
}

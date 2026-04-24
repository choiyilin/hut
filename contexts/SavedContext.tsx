"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type SavedContextType = {
  savedIds: Set<string>
  toggleSaved: (id: string) => void
  isSaved: (id: string) => boolean
}

const SavedContext = createContext<SavedContextType>({
  savedIds: new Set(),
  toggleSaved: () => {},
  isSaved: () => false,
})

const storageKey = (userId: string | null) =>
  userId ? `hut_saved_${userId}` : "hut_saved_anon"

const loadFromStorage = (userId: string | null): Set<string> => {
  try {
    const stored = localStorage.getItem(storageKey(userId))
    return new Set(stored ? (JSON.parse(stored) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    return loadFromStorage(null)
  })
  // Ref so toggleSaved always writes to the correct user's key
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Load saved IDs for the initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      userIdRef.current = user?.id ?? null
      setSavedIds(loadFromStorage(userIdRef.current))
    })

    // Reload whenever the user logs in, logs out, or switches accounts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      userIdRef.current = session?.user?.id ?? null
      setSavedIds(loadFromStorage(userIdRef.current))
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(storageKey(userIdRef.current), JSON.stringify([...next]))
      return next
    })
  }

  const isSaved = (id: string) => savedIds.has(id)

  return (
    <SavedContext.Provider value={{ savedIds, toggleSaved, isSaved }}>
      {children}
    </SavedContext.Provider>
  )
}

export const useSaved = () => useContext(SavedContext)

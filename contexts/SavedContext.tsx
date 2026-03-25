"use client"

import { createContext, useContext, useEffect, useState } from "react"

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

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hut_saved")
      if (stored) setSavedIds(new Set(JSON.parse(stored) as string[]))
    } catch {}
  }, [])

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem("hut_saved", JSON.stringify([...next]))
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

"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import { decodeFilters, encodeFilters } from "@/domain/filter-url"
import type { FilterState } from "@/schemas/filter-state"

export type FilterStateHook = {
  filters: FilterState
  setFilters: (partial: Partial<FilterState>) => void
  clearFilters: () => void
}

/**
 * URL-as-state for browse filters. Reads `useSearchParams()` on every render
 * (Next's reactive hook), memoizes the decoded `FilterState` by the URL's
 * query-string identity, and writes back via `router.replace` so that the
 * browser back/forward buttons traverse filter history naturally.
 *
 * This is a non-breaking enhancement: the previous in-memory filter state
 * yielded the same object shape; only the persistence boundary changed.
 */
export function useFilterState(): FilterStateHook {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Stable string key for memoization — `useSearchParams` returns a fresh
  // ReadonlyURLSearchParams instance per render but the serialized form is
  // stable when the URL hasn't actually changed.
  const searchKey = searchParams.toString()

  const filters = useMemo<FilterState>(
    () => decodeFilters(Object.fromEntries(searchParams.entries())),
    // Including searchParams would defeat the cache (new instance each render);
    // searchKey captures the only thing we depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchKey],
  )

  const writeUrl = useCallback(
    (next: FilterState) => {
      const qs = encodeFilters(next).toString()
      const target = qs ? `${pathname}?${qs}` : pathname
      router.replace(target, { scroll: false })
    },
    [pathname, router],
  )

  const setFilters = useCallback(
    (partial: Partial<FilterState>) => {
      writeUrl({ ...filters, ...partial })
    },
    [filters, writeUrl],
  )

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  return { filters, setFilters, clearFilters }
}

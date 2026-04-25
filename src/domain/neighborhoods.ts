import { NYC_BOROUGHS } from "@/data/nyc-neighborhoods"

// ── Parent → sub-neighborhood expansion ──────────────────────────────────────
//
// Selecting a parent neighborhood (e.g. "Chelsea") in the filter also matches
// its indented sub-neighborhoods (e.g. "West Chelsea"). Selecting a sub matches
// only that sub. Built once at module load from the curated NYC_BOROUGHS data.

export const PARENT_TO_SUBS: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const map = new Map<string, Set<string>>()
  for (const borough of NYC_BOROUGHS) {
    for (const area of borough.areas) {
      let parent: string | null = null
      let subs = new Set<string>()
      for (const n of area.neighborhoods) {
        if (!n.sub) {
          if (parent && subs.size > 0) map.set(parent, new Set(subs))
          parent = n.name
          subs = new Set()
        } else if (parent) {
          subs.add(n.name)
        }
      }
      if (parent && subs.size > 0) map.set(parent, new Set(subs))
    }
  }
  return map
})()

/**
 * True if `listingNeighborhood` matches any of the user's selected
 * neighborhoods, either directly or as a sub-neighborhood of a selected parent.
 */
export function matchesNeighborhoodSelection(
  listingNeighborhood: string,
  selected: readonly string[],
): boolean {
  if (selected.length === 0) return true
  return selected.some(
    (sel) =>
      sel === listingNeighborhood || (PARENT_TO_SUBS.get(sel)?.has(listingNeighborhood) ?? false),
  )
}

import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { core as zCore } from "zod"

import { realtorRowToListing } from "@/domain/realtor-row-to-listing"
import type { Listing } from "@/schemas/listing"
import { RealtorListingRowSchema } from "@/schemas/realtor-listing-row"

// Minimal DB shape so the untyped `.from()` resolves to a record (instead of
// `any`) until generated types land in Phase 6/7. Using Record<string, unknown>
// rather than `unknown` so `data | null` narrows correctly: `maybeSingle()`
// genuinely returns null when no row matches, and ESLint's no-unnecessary-
// condition only stays accurate if the type actually expresses nullability.
type RealtorListingRowShape = Record<string, unknown>
type AppDatabase = {
  public: {
    Tables: {
      realtor_listings: {
        Row: RealtorListingRowShape
        Insert: RealtorListingRowShape
        Update: Partial<RealtorListingRowShape>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
export type AppSupabaseClient = SupabaseClient<AppDatabase>

const TABLE = "realtor_listings"
const PUBLIC_STATUSES = ["active", "pending"] as const

// ── Result taxonomy ──────────────────────────────────────────────────────────

export type ListingsQueryError =
  | { readonly kind: "db-error"; readonly message: string }
  | { readonly kind: "validation-error"; readonly issues: readonly zCore.$ZodIssue[] }
  | { readonly kind: "timeout" }

export type ListingsQueryResult =
  | { readonly kind: "ok"; readonly listings: readonly Listing[] }
  | ListingsQueryError

export type ListingsQueryOptions = {
  readonly signal?: AbortSignal
  readonly timeoutMs?: number
}

// ── Public queries ───────────────────────────────────────────────────────────

/**
 * Active + pending listings owned by every realtor — what a renter sees in
 * the public browse page.
 *
 * Validates each row with Zod before returning. A single bad row poisons the
 * whole result so callers can decide policy (skip the page? page through with
 * the bad row dropped?). Phase 7's admin dashboard will surface validation
 * issues so we can fix the rows.
 */
export async function selectPublicListings(
  client: AppSupabaseClient,
  options: ListingsQueryOptions = {},
): Promise<ListingsQueryResult> {
  const signal = withTimeoutSignal(options)

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .in("status", [...PUBLIC_STATUSES])
    .order("date_posted", { ascending: false })
    .abortSignal(signal)

  if (error) {
    if (error.name === "AbortError") return { kind: "timeout" }
    return { kind: "db-error", message: error.message }
  }

  const validated = validateRows(data)
  if (validated.kind !== "ok") return validated

  return {
    kind: "ok",
    listings: validated.rows.map((row) => realtorRowToListing(row)),
  }
}

/**
 * One listing by id — used by the detail page. Includes drafts so realtor
 * preview links work; the route handler is responsible for owner-gating those.
 */
export async function selectListingById(
  client: AppSupabaseClient,
  id: string,
): Promise<ListingsQueryResult> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .in("status", ["active", "pending", "draft"])
    .maybeSingle()

  if (error) return { kind: "db-error", message: error.message }
  if (!data) return { kind: "ok", listings: [] }

  const validated = validateRows([data])
  if (validated.kind !== "ok") return validated

  return {
    kind: "ok",
    listings: validated.rows.map((row) => realtorRowToListing(row)),
  }
}

/**
 * Listings owned by a specific user — drives the realtor's own profile page.
 * Returns every status (including draft and off-market) — the UI filters.
 */
export async function selectListingsByOwner(
  client: AppSupabaseClient,
  userId: string,
): Promise<ListingsQueryResult> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("date_posted", { ascending: false })

  if (error) return { kind: "db-error", message: error.message }

  const validated = validateRows(data)
  if (validated.kind !== "ok") return validated

  return {
    kind: "ok",
    listings: validated.rows.map((row) => realtorRowToListing(row)),
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function validateRows(
  rows: readonly unknown[],
): { kind: "ok"; rows: ReturnType<typeof RealtorListingRowSchema.parse>[] } | ListingsQueryError {
  const parsed: ReturnType<typeof RealtorListingRowSchema.parse>[] = []
  for (const row of rows) {
    const result = RealtorListingRowSchema.safeParse(row)
    if (!result.success) return { kind: "validation-error", issues: result.error.issues }
    parsed.push(result.data)
  }
  return { kind: "ok", rows: parsed }
}

function withTimeoutSignal(options: ListingsQueryOptions): AbortSignal {
  const timeoutMs = options.timeoutMs ?? 10_000
  const timeout = AbortSignal.timeout(timeoutMs)
  if (!options.signal) return timeout
  // AbortSignal.any merges; if either fires, the result aborts.
  return AbortSignal.any([options.signal, timeout])
}

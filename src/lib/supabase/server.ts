import "server-only"

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

import { clientEnv } from "@/env/client"

type CookieStore = Awaited<ReturnType<typeof cookies>>

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Adapter between Next.js's cookie store and the @supabase/ssr cookie API.
 * Extracted as a pure function so the mutation path is testable in isolation
 * without spinning up the full Supabase client.
 */
export function makeCookieAdapter(store: CookieStore) {
  return {
    getAll: () => store.getAll(),
    setAll: (next: CookieToSet[]) => {
      for (const { name, value, options } of next) {
        // Single-arg form takes a ResponseCookie object — structurally
        // compatible with @supabase/ssr's CookieOptions and avoids the
        // overload-parameter mismatch that flags the 3-arg form.
        store.set({ name, value, ...options })
      }
    },
  }
}

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: makeCookieAdapter(cookieStore) },
  )
}

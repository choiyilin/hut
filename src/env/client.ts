import { z } from "zod"

const ClientEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1),
})

const parsed = ClientEnv.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env["NEXT_PUBLIC_MAPBOX_TOKEN"],
})

if (!parsed.success) {
  throw new Error(
    `Invalid public environment: ${parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`,
  )
}

export const clientEnv = parsed.data
export type ClientEnv = typeof parsed.data

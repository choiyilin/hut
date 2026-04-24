import "server-only"

import { z } from "zod"

import { clientEnv } from "./client"

const ServerEnv = z.object({
  MAPBOX_SECRET_TOKEN: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]),
})

const parsed = ServerEnv.safeParse({
  MAPBOX_SECRET_TOKEN: process.env["MAPBOX_SECRET_TOKEN"],
  NODE_ENV: process.env["NODE_ENV"],
})

if (!parsed.success) {
  throw new Error(
    `Invalid server environment: ${parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`,
  )
}

export const serverEnv = { ...clientEnv, ...parsed.data }
export type ServerEnv = typeof serverEnv

export const mapboxToken = serverEnv.MAPBOX_SECRET_TOKEN ?? serverEnv.NEXT_PUBLIC_MAPBOX_TOKEN

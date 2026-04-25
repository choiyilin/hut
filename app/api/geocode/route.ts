import { z } from "zod"

import { geocode } from "@/lib/mapbox/geocode"

const RequestSchema = z.object({ address: z.string().trim().min(1) })

export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 })

  const result = await geocode(parsed.data.address)

  switch (result.kind) {
    case "found":
      return Response.json({ lat: result.coords.lat, lng: result.coords.lng })
    case "not-found":
      return Response.json({ error: "address not found" }, { status: 404 })
    case "rate-limited":
      return Response.json(
        { error: "rate limited", retryAfterMs: result.retryAfterMs },
        { status: 429, headers: { "retry-after": String(Math.ceil(result.retryAfterMs / 1000)) } },
      )
    case "timeout":
      return Response.json({ error: "geocoding timed out" }, { status: 504 })
    case "upstream-error":
      return Response.json({ error: "geocoding failed" }, { status: 502 })
    case "config-error":
      return Response.json({ error: result.reason }, { status: 500 })
  }
}

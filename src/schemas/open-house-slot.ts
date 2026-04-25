import { z } from "zod"

export const OpenHouseSlotSchema = z.object({
  date: z.string(),
  time: z.string(),
  notes: z.string(),
})

export type OpenHouseSlot = z.infer<typeof OpenHouseSlotSchema>

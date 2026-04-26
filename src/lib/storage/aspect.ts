/**
 * Aspect-ratio classification for uploaded videos. Reels render at 9:16,
 * so a portrait video that's "close enough" plays correctly; anything
 * else gets a soft warning surfaced to the realtor (we don't block —
 * the plan calls for warning, not enforcement).
 */
export type AspectClassification = "9-16" | "portrait-other" | "square" | "landscape" | "unknown"

/** Default tolerance: ±3% on the ratio. 9:16 = 0.5625 → accepts 0.546–0.580. */
export const DEFAULT_ASPECT_TOLERANCE = 0.03

export function classifyAspect(
  width: number,
  height: number,
  tolerance: number = DEFAULT_ASPECT_TOLERANCE,
): AspectClassification {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "unknown"
  }
  const ratio = width / height
  const target = 9 / 16
  if (Math.abs(ratio - target) <= tolerance) return "9-16"
  if (Math.abs(ratio - 1) <= tolerance) return "square"
  if (ratio < 1) return "portrait-other"
  return "landscape"
}

/** True when the dimensions are close enough to 9:16 to play cleanly in reels. */
export function isReelsCompatible(width: number, height: number): boolean {
  return classifyAspect(width, height) === "9-16"
}

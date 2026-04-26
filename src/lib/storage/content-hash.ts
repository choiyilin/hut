/**
 * Compute a content-addressed filename for a file: `<sha256-hex>.<ext>`.
 *
 * Replaces the old `${user.id}/${Date.now()}-${i}.${ext}` scheme, which
 * could collide when the user uploads several files inside the same
 * millisecond (drag-and-dropping a folder fires the picker handler with
 * the whole batch in a single tick).
 *
 * Uses Web Crypto's `subtle.digest`, available on `globalThis.crypto` in
 * every modern browser and in Node 18+.
 */
export async function contentHashFilename(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `${hex}.${extensionOf(file.name)}`
}

/**
 * Lowercased file extension, sans dot. Defaults to `bin` when the name has
 * no extension or only a leading dot — Supabase Storage requires *some*
 * extension to set the right Content-Type on download.
 */
export function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf(".")
  if (idx <= 0 || idx === filename.length - 1) return "bin"
  return filename.slice(idx + 1).toLowerCase()
}

/**
 * Upload pipeline: parallel uploads with per-file exponential-backoff retry,
 * and full rollback when any file ultimately fails. The previous form sent
 * each file via `Promise.all` with no retry and no rollback — a single
 * Supabase 502 produced an inconsistent half-uploaded state.
 *
 * The pipeline is framework-agnostic: callers inject `upload` and `remove`
 * adapters so this file stays unit-testable without spinning up Supabase.
 */

export type UploadOk = { readonly kind: "ok"; readonly publicUrl: string }
export type UploadFailure = { readonly kind: "error"; readonly message: string }
export type UploadOutcome = UploadOk | UploadFailure

export type UploadFn = (file: File, path: string) => Promise<UploadOutcome>
export type RemoveFn = (path: string) => Promise<void>

export type PipelineResult =
  | { readonly kind: "ok"; readonly publicUrls: readonly string[] }
  | {
      readonly kind: "partial-failure"
      readonly failedCount: number
      readonly totalCount: number
      readonly message: string
    }

export type PipelineOptions = {
  /** Per-file retry attempts BEYOND the initial try. Default 2 → up to 3 calls. */
  readonly retries?: number
  /** Backoff base in ms; nth retry waits `base * 2^n`. Default 200. */
  readonly backoffBaseMs?: number
  /** Injectable for tests so we don't actually sleep. */
  readonly sleep?: (ms: number) => Promise<void>
}

const DEFAULT_RETRIES = 2
const DEFAULT_BACKOFF_BASE_MS = 200

const realSleep = (ms: number): Promise<void> =>
  new Promise<void>((res) => {
    setTimeout(res, ms)
  })

export async function uploadFilesWithRollback({
  files,
  pathFor,
  upload,
  remove,
  options = {},
}: {
  readonly files: readonly File[]
  readonly pathFor: (file: File, index: number) => Promise<string>
  readonly upload: UploadFn
  readonly remove: RemoveFn
  readonly options?: PipelineOptions
}): Promise<PipelineResult> {
  const retries = options.retries ?? DEFAULT_RETRIES
  const backoffBaseMs = options.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS
  const sleep = options.sleep ?? realSleep

  if (files.length === 0) {
    return { kind: "ok", publicUrls: [] }
  }

  const settled = await Promise.allSettled(
    files.map(async (file, index) => {
      const path = await pathFor(file, index)
      let lastMessage = "no attempts made"
      for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
          await sleep(backoffBaseMs * 2 ** (attempt - 1))
        }
        const result = await upload(file, path)
        if (result.kind === "ok") return { path, url: result.publicUrl }
        lastMessage = result.message
      }
      throw new UploadAttemptError(file.name, lastMessage, path)
    }),
  )

  const successful: { path: string; url: string }[] = []
  let failedCount = 0
  for (const entry of settled) {
    if (entry.status === "fulfilled") successful.push(entry.value)
    else failedCount += 1
  }

  if (failedCount === 0) {
    return { kind: "ok", publicUrls: successful.map((s) => s.url) }
  }

  // Roll back the partial successes — leaving them dangling means the
  // realtor's bucket fills with orphaned files no row references.
  await Promise.allSettled(successful.map(({ path }) => remove(path)))

  return {
    kind: "partial-failure",
    failedCount,
    totalCount: files.length,
    message: `${String(failedCount)} of ${String(files.length)} uploads failed`,
  }
}

class UploadAttemptError extends Error {
  constructor(
    public readonly fileName: string,
    public readonly lastMessage: string,
    public readonly path: string,
  ) {
    super(`Upload of ${fileName} failed: ${lastMessage}`)
    this.name = "UploadAttemptError"
  }
}

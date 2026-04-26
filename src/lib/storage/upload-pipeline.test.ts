import { describe, expect, it, vi } from "vitest"

import {
  uploadFilesWithRollback,
  type RemoveFn,
  type UploadFn,
  type UploadOutcome,
} from "./upload-pipeline"

function ok(publicUrl: string): UploadOutcome {
  return { kind: "ok", publicUrl }
}

function err(message: string): UploadOutcome {
  return { kind: "error", message }
}

function makeFile(name: string): File {
  return new File([new Uint8Array([0])], name)
}

function pathByName(file: File): Promise<string> {
  return Promise.resolve(`u/${file.name}`)
}

describe("uploadFilesWithRollback", () => {
  it("returns ok with the empty list when given no files", async () => {
    const result = await uploadFilesWithRollback({
      files: [],
      pathFor: pathByName,
      upload: vi.fn(),
      remove: vi.fn(),
    })
    expect(result).toEqual({ kind: "ok", publicUrls: [] })
  })

  it("uploads all files in parallel and returns their public URLs in order", async () => {
    const upload: UploadFn = vi.fn(async (file: File) => ok(`https://cdn/${file.name}`))
    const remove: RemoveFn = vi.fn()
    const result = await uploadFilesWithRollback({
      files: [makeFile("a.jpg"), makeFile("b.jpg"), makeFile("c.jpg")],
      pathFor: pathByName,
      upload,
      remove,
      options: { sleep: vi.fn() },
    })
    expect(result).toEqual({
      kind: "ok",
      publicUrls: ["https://cdn/a.jpg", "https://cdn/b.jpg", "https://cdn/c.jpg"],
    })
    expect(upload).toHaveBeenCalledTimes(3)
    expect(remove).not.toHaveBeenCalled()
  })

  it("retries up to the configured count before declaring failure", async () => {
    let attempts = 0
    const upload: UploadFn = vi.fn(async () => {
      attempts += 1
      if (attempts < 3) return err(`flaky ${String(attempts)}`)
      return ok("https://cdn/ok")
    })
    const sleep = vi.fn(async () => {})
    const result = await uploadFilesWithRollback({
      files: [makeFile("flaky.jpg")],
      pathFor: pathByName,
      upload,
      remove: vi.fn(),
      options: { retries: 2, backoffBaseMs: 100, sleep },
    })
    expect(result).toEqual({ kind: "ok", publicUrls: ["https://cdn/ok"] })
    expect(upload).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenNthCalledWith(1, 100)
    expect(sleep).toHaveBeenNthCalledWith(2, 200)
  })

  it("rolls back successful uploads when a sibling ultimately fails", async () => {
    const upload: UploadFn = vi.fn(async (file: File) => {
      if (file.name === "bad.jpg") return err("nope")
      return ok(`https://cdn/${file.name}`)
    })
    const remove: RemoveFn = vi.fn()
    const result = await uploadFilesWithRollback({
      files: [makeFile("good1.jpg"), makeFile("bad.jpg"), makeFile("good2.jpg")],
      pathFor: pathByName,
      upload,
      remove,
      options: { retries: 0, sleep: vi.fn() },
    })
    expect(result.kind).toBe("partial-failure")
    if (result.kind === "partial-failure") {
      expect(result.failedCount).toBe(1)
      expect(result.totalCount).toBe(3)
      expect(result.message).toMatch(/1 of 3/)
    }
    expect(remove).toHaveBeenCalledTimes(2)
    expect(remove).toHaveBeenCalledWith("u/good1.jpg")
    expect(remove).toHaveBeenCalledWith("u/good2.jpg")
  })

  it("does not call remove when there were no successful uploads to roll back", async () => {
    const upload: UploadFn = vi.fn(async () => err("dead"))
    const remove: RemoveFn = vi.fn()
    const result = await uploadFilesWithRollback({
      files: [makeFile("a.jpg")],
      pathFor: pathByName,
      upload,
      remove,
      options: { retries: 0, sleep: vi.fn() },
    })
    expect(result.kind).toBe("partial-failure")
    expect(remove).not.toHaveBeenCalled()
  })

  it("ignores remove() rejections during rollback so the surface result is stable", async () => {
    const upload: UploadFn = vi.fn(async (file: File) =>
      file.name === "bad.jpg" ? err("nope") : ok(`https://cdn/${file.name}`),
    )
    const remove: RemoveFn = vi.fn(async () => {
      throw new Error("Supabase unreachable")
    })
    const result = await uploadFilesWithRollback({
      files: [makeFile("good.jpg"), makeFile("bad.jpg")],
      pathFor: pathByName,
      upload,
      remove,
      options: { retries: 0, sleep: vi.fn() },
    })
    expect(result.kind).toBe("partial-failure")
  })

  it("uses the default sleep implementation when none is provided", async () => {
    const upload: UploadFn = vi
      .fn<UploadFn>()
      .mockResolvedValueOnce(err("flaky"))
      .mockResolvedValueOnce(ok("https://cdn/ok"))
    const result = await uploadFilesWithRollback({
      files: [makeFile("a.jpg")],
      pathFor: pathByName,
      upload,
      remove: vi.fn(),
      options: { retries: 1, backoffBaseMs: 1 },
    })
    expect(result).toEqual({ kind: "ok", publicUrls: ["https://cdn/ok"] })
  })

  it("delegates path naming to the caller (so content-hash filenames plug in cleanly)", async () => {
    const pathFor = vi.fn(
      async (file: File, index: number) => `realtor/abc/${String(index)}-${file.name}`,
    )
    const upload: UploadFn = vi.fn(async (_file: File, path: string) => ok(`https://cdn/${path}`))
    await uploadFilesWithRollback({
      files: [makeFile("x.jpg"), makeFile("y.jpg")],
      pathFor,
      upload,
      remove: vi.fn(),
      options: { sleep: vi.fn() },
    })
    expect(pathFor).toHaveBeenNthCalledWith(1, expect.any(File), 0)
    expect(pathFor).toHaveBeenNthCalledWith(2, expect.any(File), 1)
  })
})

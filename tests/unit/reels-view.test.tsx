import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ReelsView } from "@/../components/ReelsView"
import { SavedProvider, type AuthResolver } from "@/features/saved"
import type { SavedStorageAdapter } from "@/features/saved/storage"
import { makeListing } from "@/../tests/fixtures/listing"

// ── next/navigation mock ────────────────────────────────────────────────────
const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// supabase client is touched transitively by the SavedProvider's default auth
// resolver path. We pass an explicit resolver in tests, so this mock just
// keeps the import graph satisfied.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  }),
}))

// ── IntersectionObserver harness ────────────────────────────────────────────
// jsdom doesn't ship IntersectionObserver. The component's behavior IS the
// observer wiring, so we install a controllable fake that lets each test
// drive intersection events deterministically.
type ObserverInstance = {
  callback: IntersectionObserverCallback
  options: IntersectionObserverInit | undefined
  targets: Element[]
}

let observers: ObserverInstance[] = []

function installIntersectionObserver(): void {
  class FakeIO implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ""
    readonly thresholds: readonly number[] = []
    private readonly _instance: ObserverInstance
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this._instance = { callback, options, targets: [] }
      observers.push(this._instance)
    }
    observe(target: Element): void {
      this._instance.targets.push(target)
    }
    unobserve(target: Element): void {
      this._instance.targets = this._instance.targets.filter((t) => t !== target)
    }
    disconnect(): void {
      this._instance.targets = []
    }
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: FakeIO,
  })
}

function fireIntersection(target: Element, isIntersecting: boolean): void {
  for (const observer of observers) {
    if (!observer.targets.includes(target)) continue
    const entry = { isIntersecting, target } as IntersectionObserverEntry
    act(() => {
      observer.callback([entry], {} as IntersectionObserver)
    })
  }
}

// ── HTMLVideoElement spies ──────────────────────────────────────────────────
let playSpy: ReturnType<typeof vi.fn>
let pauseSpy: ReturnType<typeof vi.fn>

function stubVideoElement(): void {
  playSpy = vi.fn().mockResolvedValue(undefined)
  pauseSpy = vi.fn()
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: playSpy,
  })
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: pauseSpy,
  })
}

// ── Test wrapper — SavedProvider with in-memory adapter ─────────────────────
function makeAdapter(initial = new Set<string>()): SavedStorageAdapter {
  const backing = new Map<string, ReadonlySet<string>>([["__anon__", initial]])
  return {
    load: vi.fn(async (userId) => backing.get(userId ?? "__anon__") ?? new Set<string>()),
    save: vi.fn(async (userId, ids) => {
      backing.set(userId ?? "__anon__", new Set(ids))
    }),
  }
}

function makeResolver(): AuthResolver {
  return {
    getUserId: vi.fn(async () => null),
    subscribe: vi.fn(() => () => {}),
  }
}

function renderReels(listings: ReturnType<typeof makeListing>[], initialSaved = new Set<string>()) {
  return render(
    <SavedProvider adapter={makeAdapter(initialSaved)} authResolver={makeResolver()}>
      <ReelsView listings={listings} />
    </SavedProvider>,
  )
}

// ── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  observers = []
  pushSpy.mockReset()
  installIntersectionObserver()
  stubVideoElement()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── Tests ───────────────────────────────────────────────────────────────────
describe("ReelsView", () => {
  it("renders one slide per listing with neighborhood, price, address", () => {
    const listings = [
      makeListing({
        id: "a",
        videoUrl: "https://video.test/a.mp4",
        neighborhood: "Park Slope",
        price: 4500,
        address: "247 Garfield Place, Brooklyn, NY 11215",
      }),
      makeListing({
        id: "b",
        videoUrl: "https://video.test/b.mp4",
        neighborhood: "Williamsburg",
        price: 5200,
        address: "100 Bedford Ave, Brooklyn, NY 11211",
      }),
    ]
    renderReels(listings)

    expect(screen.getByText("Park Slope")).toBeInTheDocument()
    expect(screen.getByText("Williamsburg")).toBeInTheDocument()
    expect(screen.getByText("$4,500")).toBeInTheDocument()
    expect(screen.getByText("$5,200")).toBeInTheDocument()
    expect(screen.getByText("247 Garfield Place, Brooklyn, NY 11215")).toBeInTheDocument()
  })

  it("appends /mo to rent listings and omits it for sale listings", () => {
    const listings = [
      makeListing({ id: "rent", videoUrl: "v1", price: 3000 }),
      makeListing({ id: "sale", videoUrl: "v2", price: 999_000, listingType: "sale" }),
    ]
    renderReels(listings)

    // Rent slide: /mo present next to the price
    const rentPrice = screen.getByText("$3,000")
    expect(within(rentPrice).getByText("/mo")).toBeInTheDocument()

    // Sale slide: no /mo
    const salePrice = screen.getByText("$999,000")
    expect(within(salePrice).queryByText("/mo")).not.toBeInTheDocument()
  })

  it.each([
    [0, "Studio"],
    [1, "1 bed"],
    [2, "2 beds"],
    [4, "4 beds"],
  ])("renders bed label for %i beds as %s", (beds, expected) => {
    renderReels([makeListing({ id: `b-${String(beds)}`, videoUrl: "v", beds })])
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it.each([
    [1, "1 bath"],
    [2, "2 baths"],
    [3, "3 baths"],
  ])("renders bath label for %i baths as %s", (baths, expected) => {
    renderReels([makeListing({ id: `bt-${String(baths)}`, videoUrl: "v", baths })])
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it("save button reflects initial saved state and toggles on click", async () => {
    renderReels([makeListing({ id: "saved-id", videoUrl: "v" })], new Set(["saved-id"]))

    // SavedProvider hydrates async — wait for the resolver promise to settle.
    const removeBtn = await screen.findByRole("button", { name: /remove from saved/i })
    fireEvent.click(removeBtn)
    expect(await screen.findByRole("button", { name: /save listing/i })).toBeInTheDocument()
  })

  it("clicking the info overlay navigates to the listing detail page", () => {
    renderReels([makeListing({ id: "apt-99", videoUrl: "v" })])
    // Click the address — it sits inside the overlay's onClick wrapper.
    fireEvent.click(screen.getByText(/247 Garfield Place/))
    expect(pushSpy).toHaveBeenCalledWith("/listings/apt-99")
  })

  it("View button navigates to detail without triggering parent overlay handler twice", () => {
    renderReels([makeListing({ id: "apt-7", videoUrl: "v" })])
    fireEvent.click(screen.getByRole("button", { name: /view full listing/i }))
    expect(pushSpy).toHaveBeenCalledTimes(1)
    expect(pushSpy).toHaveBeenCalledWith("/listings/apt-7")
  })

  it("first slide preloads eagerly; later slides start with preload=none", () => {
    const { container } = renderReels([
      makeListing({ id: "first", videoUrl: "https://v/first.mp4" }),
      makeListing({ id: "second", videoUrl: "https://v/second.mp4" }),
    ])
    const videos = container.querySelectorAll("video")
    expect(videos[0]?.getAttribute("preload")).toBe("auto")
    expect(videos[1]?.getAttribute("preload")).toBe("none")
  })

  it("playObserver intersect → calls play() and upgrades preload to auto", () => {
    const { container } = renderReels([
      makeListing({ id: "a", videoUrl: "v1" }),
      makeListing({ id: "b", videoUrl: "v2" }),
    ])
    const slides = container.querySelectorAll('[style*="scroll-snap-align"]')
    const secondSlide = slides[1]!
    expect(secondSlide).toBeDefined()

    // Each slide registers TWO observers (preload + play). Fire on the play
    // observer — the one with threshold 0.6.
    fireIntersection(secondSlide, true)

    expect(playSpy).toHaveBeenCalled()
    const videos = container.querySelectorAll("video")
    expect(videos[1]?.getAttribute("preload")).toBe("auto")
  })

  it("playObserver leaving viewport pauses the video", () => {
    const { container } = renderReels([makeListing({ id: "a", videoUrl: "v1" })])
    const slide = container.querySelector('[style*="scroll-snap-align"]')!
    expect(slide).toBeDefined()

    fireIntersection(slide, true)
    playSpy.mockClear()
    pauseSpy.mockClear()
    fireIntersection(slide, false)

    expect(pauseSpy).toHaveBeenCalled()
  })

  it("renders nothing notable but does not crash with empty listings", () => {
    const { container } = renderReels([])
    expect(container.querySelectorAll("video")).toHaveLength(0)
  })
})

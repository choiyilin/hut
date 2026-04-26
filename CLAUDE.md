# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
pnpm dev          # Dev server (Turbopack) at localhost:3000
pnpm build        # Production build
pnpm typecheck    # tsc --noEmit, strictest TS settings
pnpm lint         # ESLint flat config (zero warnings tolerated)
pnpm format       # Prettier --write
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest one-shot (CI mode)
pnpm e2e          # Playwright (auto-starts pnpm dev)
```

Mutation testing runs weekly in CI (`stryker.config.mjs`); locally: `pnpm exec stryker run`.

## Environment

`.env.local` must define:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

All `process.env.X` reads must go through `src/env/client.ts` (public) or `src/env/server.ts` (server-only) — both Zod-validated at startup. Direct `process.env` access outside `src/env/` is banned by ESLint.

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript 5 (strictest mode: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noPropertyAccessFromIndexSignature`)
- Supabase (Postgres + Auth + Storage)
- Mapbox GL + react-map-gl
- Zod 4 (schema-first at every trust boundary; types via `z.infer`)
- Zustand (client state, replaces SavedContext)
- Tailwind v4 (CSS-based config in `app/globals.css`)
- Vitest 4 + jsdom + Testing Library + Playwright
- pnpm 10 + Node 22

## Directory layout

```
hut/
├── app/                          Next.js routes — thin shells, delegate to features/lib
│   ├── api/geocode/              Typed Mapbox adapter behind a route
│   ├── listings/, profile/, saved/, auth/
│   └── …
├── components/                   React components (mostly client)
│   ├── AddListingForm.tsx        Big realtor form; uses src/lib/storage helpers
│   ├── ListingsBrowseMap.tsx     Map; uses src/domain/map-fit
│   ├── LoginForm.tsx, SignupForm.tsx   On Zod schemas + auth-error mapper
│   └── …
├── src/
│   ├── env/                      Zod-validated env. ONLY place process.env is read.
│   ├── schemas/                  Zod source-of-truth; types via z.infer
│   │   ├── listing.ts            Listing
│   │   ├── realtor-listing-row.ts  Mirrors DB row exactly (snake_case)
│   │   ├── filter-state.ts       FilterState + DEFAULT_FILTERS
│   │   ├── auth.ts               Login/Signup payloads
│   │   └── open-house-slot.ts
│   ├── domain/                   Pure logic — zero framework imports
│   │   ├── filter.ts             filterAndSortListings, countActiveFilters
│   │   ├── filter-url.ts         encode/decode FilterState ↔ URLSearchParams
│   │   ├── neighborhoods.ts      parent↔sub mapping
│   │   ├── amenities.ts          deriveAmenities
│   │   ├── realtor-row-to-listing.ts
│   │   └── map-fit.ts            pickFitTarget, geoListings
│   ├── lib/                      Adapters to external systems
│   │   ├── supabase/             client.ts, server.ts, queries/listings.ts
│   │   ├── mapbox/               geocode.ts (LRU cache, rate limit, AbortSignal)
│   │   ├── storage/              content-hash, aspect, probe-video, upload-pipeline
│   │   └── auth/                 errors.ts (categorizeAuthError)
│   └── features/                 Vertical slices
│       ├── saved/                Zustand store + storage adapter + provider/useSaved
│       └── listings-browse/      useFilterState (URL-driven)
├── tests/
│   ├── e2e/                      Playwright smoke tests
│   ├── fixtures/                 Factory functions
│   └── setup.ts                  Vitest setup (jsdom + Storage shim)
├── supabase/migrations/          SQL migrations (RLS lives here)
└── .github/workflows/            ci.yml, e2e.yml, mutation.yml
```

## Conventions

### Imports
- Always use `@/…` alias (resolves to repo root).
- Schemas → `@/schemas/<name>`. Domain logic → `@/domain/<name>`. External adapters → `@/lib/<area>/<name>`. Features → `@/features/<slice>`.
- Never re-export through a barrel. Direct imports keep tree-shaking honest.

### Types
- All trust-boundary types (HTTP, DB, localStorage, env) come from a Zod schema; types are `z.infer` outputs. Never hand-write a type that mirrors a schema.
- No `any`, no non-`as const` casts, no non-null assertions, no `@ts-ignore` — all banned by ESLint. Use `unknown` and Zod-narrow.
- Errors use discriminated unions (`{ kind: "ok" | "error", … }`) instead of throws at adapter boundaries.

### Testing
- TDD when adding logic to `src/`. Coverage gates: 100% on schemas/domain/lib; 85/75 on features.
- Tests must hit the public API only — no peeking at private state. Pure helpers extracted from React components are the testable layer.
- For DOM-touching code (jsdom 29 + vitest 4 quirk), `tests/setup.ts` bridges `globalThis.localStorage` to jsdom's real Storage.

### Auth roles
- Two roles in `user_metadata.role`: `renter` (default) and `realtor`.
- Role gates are server-side in App Router pages. `/profile` and `/listings/new` redirect to `/login` if the role is wrong; the matching client component receives `user` as a validated prop.

### URL-as-state
- Browse filters live in the URL via `useFilterState()` (`src/features/listings-browse`). Parsing/serialization is pure (`src/domain/filter-url.ts`) and only fields that differ from defaults are emitted.

### Saved listings
- `useSaved()` from `@/features/saved` returns `{ savedIds, toggleSaved, isSaved }`. The store stays in `loading` until Supabase auth resolves; toggles during loading land in a `pendingDelta` and XOR-merge onto the loaded set.

### Storage uploads (realtor form)
- Filenames are SHA-256 content hashes (`src/lib/storage/content-hash.ts`).
- Uploads run in parallel with retry + rollback (`src/lib/storage/upload-pipeline.ts`).
- Videos get probed for 9:16 aspect (`src/lib/storage/probe-video.ts`); non-9:16 surfaces a soft amber warning, doesn't block.

### Map
- Markers render off `geoListings(listings)` (drops 0,0). Camera fits via `pickFitTarget()` debounced 220ms. Selection survives unrelated filter changes.

### Styling
- Tailwind v4 CSS config in `app/globals.css` under `@theme inline {}` (no `tailwind.config.ts`).
- Brand: `--color-gold: #c9a96e`, `--color-cream: #f0e9dc`. Fonts: `font-playfair` (logo only), `font-sans` = Plus Jakarta Sans.

## When adding a new DB column to `realtor_listings`

Update three places:
1. `src/schemas/realtor-listing-row.ts` — extend the Zod schema.
2. `src/domain/realtor-row-to-listing.ts` — map it onto `Listing` if user-visible.
3. `components/AddListingForm.tsx` — add the form field + payload mapping.

The Zod schema is the source of truth — TypeScript types update via `z.infer` automatically.

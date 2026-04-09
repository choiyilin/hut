# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack) at localhost:3000
npm run build    # Production build
npm run lint     # ESLint (no test suite exists)
```

No tests are configured in this project.

## Environment

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**HUT** is a Next.js 16 (App Router) NYC rental listings app with Supabase auth and a dual data source.

### Data flow

Listings come from two sources merged in `app/listings/page.tsx` (server component):
1. `data/listings.json` — 25 static mock listings (cast as `Listing[]`)
2. `realtor_listings` Supabase table — realtor-submitted listings, fetched server-side and mapped via `realtorRowToListing()` in `types/index.ts`

All filter/sort logic runs client-side in `ListingsClient` using `filterAndSortListings()` from `types/index.ts`. The types file is the single source of truth for the `Listing` interface, `FilterState`, and filter logic.

### Auth roles

Two user roles stored in Supabase `user_metadata.role`:
- **Default (renter)**: can save listings (heart toggle), view saved page, see profile stats
- **`realtor`**: can post listings via `/listings/new` (AddListingForm → `realtor_listings` table), manage/delete their own listings from profile

Auth flow: Supabase email/password + magic link → `app/auth/callback/route.ts` exchanges code for session → redirects to `/listings`.

### Saved listings

`SavedContext` (wraps entire app in `layout.tsx`) persists saved listing IDs to `localStorage` keyed by user ID (`hut_saved_{userId}` or `hut_saved_anon`). Reloads on auth state change so saved state follows the logged-in user.

### Supabase client helpers

- `lib/supabase/client.ts` — browser client (use in `'use client'` components)
- `lib/supabase/server.ts` — async server client using `next/headers` cookies (use in server components and route handlers)
- `proxy.ts` — Next.js 16 proxy (replaces `middleware.ts`); refreshes Supabase session cookies on every request

### Styling

Tailwind v4 with CSS-based config — all theme customization is in `app/globals.css` under `@theme inline {}`. No `tailwind.config.ts`.

Key tokens:
- `--color-gold: #c9a96e` → `text-gold`, `bg-gold`, `bg-gold/10`
- `--color-cream: #f0e9dc`
- Fonts: `font-playfair` (logo only), `font-sans` = Plus Jakarta Sans (primary UI)
- Icons: Font Awesome 6.5 loaded via CDN in `app/layout.tsx`

The landing page (`app/page.tsx`) uses `page.module.css` for CSS Modules alongside Tailwind — necessary for the video crossfade hero animation.

### `next/image` remote patterns

Configured in `next.config.ts` for `picsum.photos` (mock listing images) and `*.supabase.co` (realtor-uploaded photos from Supabase Storage).

### Key type: `RealtorListingRow`

The `realtor_listings` DB table has snake_case columns with many boolean amenity flags (`has_gym`, `has_doorman`, etc.) not present on the `Listing` interface. `realtorRowToListing()` in `types/index.ts` maps between them. When adding new DB columns, update both `RealtorListingRow` and `realtorRowToListing()`.

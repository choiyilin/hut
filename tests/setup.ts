import "@testing-library/jest-dom/vitest"

// Provide placeholder env vars so module-level Zod env parsers succeed during
// import. Real values flow through Vercel; tests never hit external services.
process.env["NEXT_PUBLIC_SUPABASE_URL"] ??= "https://placeholder.supabase.co"
process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ??= "test-anon-key"
process.env["NEXT_PUBLIC_MAPBOX_TOKEN"] ??= "pk.test"

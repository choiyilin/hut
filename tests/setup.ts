import "@testing-library/jest-dom/vitest"

// Provide placeholder env vars so module-level Zod env parsers succeed during
// import. Real values flow through Vercel; tests never hit external services.
process.env["NEXT_PUBLIC_SUPABASE_URL"] ??= "https://placeholder.supabase.co"
process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ??= "test-anon-key"
process.env["NEXT_PUBLIC_MAPBOX_TOKEN"] ??= "pk.test"

// Vitest 4.1.5 + jsdom 29 regression: `globalThis.localStorage` (and therefore
// `window.localStorage`, since vitest aliases `window === globalThis`) is
// populated as an empty `{}` instead of jsdom's real Storage instance. The
// genuine Storage is reachable via the jsdom escape hatch on the global.
// Re-bind both globals to it so production code that calls
// `window.localStorage.setItem(...)` works under tests.
const jsdomGlobal = (globalThis as { jsdom?: { window: Window } }).jsdom
if (jsdomGlobal?.window.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: jsdomGlobal.window.localStorage,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, "sessionStorage", {
    value: jsdomGlobal.window.sessionStorage,
    writable: true,
    configurable: true,
  })
}

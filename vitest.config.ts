import { defineConfig } from "vitest/config"

export default defineConfig({
  // Honors the `paths` field in tsconfig.json — keeps `@/foo` resolution
  // identical between tsc, Next.js, and Vitest.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/__tests__/**", "src/**/*.d.ts"],
      thresholds: {
        // 100% on the structures of truth (Zod schemas), their pure
        // transforms (domain), and their adapters to external systems
        // (lib). These are where bugs hurt most and tests are cheapest.
        "src/schemas/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "src/domain/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "src/lib/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        // Features mix React + integrations. We cover the testable core
        // (stores, hooks, pure helpers) at 100%; the gap is real third-
        // party integration code (e.g. defaultAuthResolver wrapping the
        // Supabase auth SDK) where unit-mocking the SDK provides little
        // signal. 85/75 catches significant new gaps without forcing
        // shallow tests for them.
        "src/features/**": { lines: 85, branches: 75, functions: 80, statements: 85 },
      },
    },
  },
})

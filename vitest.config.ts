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
        // Phase 1: enforce 100% on schemas + domain (the structures of truth).
        // Phase 7 will add features/* and app/* tiers.
        "src/schemas/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
        "src/domain/**": { lines: 100, branches: 100, functions: 100, statements: 100 },
      },
    },
  },
})

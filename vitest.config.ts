import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "src/$1") },
      // Fallback to repo root for legacy paths not yet migrated to src/.
      { find: /^@legacy\/(.*)$/, replacement: path.resolve(__dirname, "$1") },
    ],
  },
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
        // Phase 0: baseline. Phase 7 promotes these to the final targets:
        //   domain/**, lib/**, schemas/** → 100% line+branch+function
        //   features/**                    → 90%/85%/90%
        //   app/**                         → 80%
        // For now we only require that the instrumented files we DO have tests
        // for pass — thresholds are left empty so new test files set the bar.
      },
    },
  },
})

/**
 * Stryker config for HUT's weekly mutation-testing job.
 *
 * We target the layers that warrant 100% line+branch coverage anyway —
 * `src/domain/**` (pure logic) and `src/lib/**` (typed adapters). These are
 * the layers where a passing test that doesn't actually distinguish two
 * implementations is most dangerous: a Zod schema that "tests" `safeParse`
 * but never asserts the parsed shape, a filter function whose tests pass
 * even if the predicate is inverted, etc.
 *
 * Run locally: `pnpm exec stryker run`
 * CI: invoked weekly by .github/workflows/mutation.yml
 */
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
  },
  reporters: ["progress", "clear-text", "html"],
  coverageAnalysis: "perTest",
  mutate: ["src/domain/**/*.ts", "src/lib/**/*.ts", "!src/**/*.{test,spec}.ts"],
  thresholds: {
    high: 90,
    low: 80,
    break: 85,
  },
  htmlReporter: { fileName: "reports/mutation/index.html" },
  timeoutMS: 60_000,
  concurrency: 4,
}

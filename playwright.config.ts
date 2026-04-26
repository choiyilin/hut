import { defineConfig, devices } from "@playwright/test"

// Empty-string envs come back from GitHub Actions when an `inputs.*` variable
// wasn't supplied — treat them as absent so we don't navigate to "".
const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value

const PORT = nonEmpty(process.env["PORT"]) ?? "3000"
const BASE_URL = nonEmpty(process.env["PLAYWRIGHT_BASE_URL"]) ?? `http://localhost:${PORT}`
const isCI = Boolean(process.env["CI"])
const useExistingServer = nonEmpty(process.env["PLAYWRIGHT_BASE_URL"]) !== undefined

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI ? [["github"], ["html"]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(useExistingServer
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: BASE_URL,
          reuseExistingServer: !isCI,
          stdout: "ignore",
          stderr: "pipe",
          timeout: 120_000,
        },
      }),
})

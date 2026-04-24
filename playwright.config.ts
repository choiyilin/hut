import { defineConfig, devices } from "@playwright/test"

const PORT = process.env["PORT"] ?? "3000"
const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? `http://localhost:${PORT}`
const isCI = Boolean(process.env["CI"])
const useExistingServer = Boolean(process.env["PLAYWRIGHT_BASE_URL"])

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

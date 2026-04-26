import { expect, test } from "@playwright/test"

test("landing page renders hero heading", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /find your perfect hut/i })).toBeVisible()
})

test("listings page renders", async ({ page }) => {
  await page.goto("/listings")
  await expect(page).toHaveURL(/\/listings/)
})

test("URL filters seed the search input on hard reload", async ({ page }) => {
  // Phase 4 contract: filters live in the URL. Hard-loading with ?q= should
  // populate the search box without a client-side hydration round-trip.
  await page.goto("/listings?q=upper")
  const search = page.getByRole("textbox", { name: /search listings/i }).first()
  await expect(search).toHaveValue("upper")
})

test("rent → sale URL toggle switches the heading", async ({ page }) => {
  await page.goto("/listings?type=rent")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/rentals/i)
  await page.goto("/listings?type=sale")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/sale/i)
})

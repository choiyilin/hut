import { test, expect } from "@playwright/test"

test("landing page renders hero heading", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /find your perfect hut/i })).toBeVisible()
})

test("listings page renders", async ({ page }) => {
  await page.goto("/listings")
  await expect(page).toHaveURL(/\/listings/)
})

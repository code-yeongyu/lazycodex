import { test, expect } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"
import { COMMANDS } from "../lib/commands"

/**
 * Landing `/` contract (TDD target state).
 *
 * Selectors are deliberately tolerant of inline <span> splits: headings,
 * links, and buttons go through getByRole; the hero tagline is checked by
 * its distinctive sub-parts ("{your prompt}" + "ultrawork") instead of one
 * exact full-string match; `.first()` guards against strict-mode violations.
 */

test.describe("landing page — hero", () => {
  test("has exactly one h1 reading the wordmark", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: SITE_CONFIG.wordmark }),
    ).toBeVisible()
  })

  test("shows the eyebrow and both hero lines", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText(SITE_CONFIG.eyebrow, { exact: true })).toBeVisible()
    await expect(page.getByText(SITE_CONFIG.heroLineA, { exact: false }).first()).toBeVisible()
    // Tagline may be split across inline spans — assert the distinctive parts.
    await expect(page.getByText("Just prompt", { exact: false }).first()).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.heroLineB.slot, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.heroLineB.keyword, { exact: false }).first(),
    ).toBeVisible()
  })
})

test.describe("landing page — install + commands", () => {
  test("shows the install command and a copy button", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByText(SITE_CONFIG.installCommand, { exact: false }).first(),
    ).toBeVisible()
    await expect(page.getByText("bunx lazycodex-ai install", { exact: false }).first()).toBeVisible()
    await expect(page.getByText(SITE_CONFIG.installEquivalent, { exact: false }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /copy/i }).first()).toBeVisible()
  })

  test("renders every command with its name and syntax", async ({ page }) => {
    await page.goto("/")
    for (const command of COMMANDS) {
      await expect(page.getByText(command.name, { exact: false }).first()).toBeVisible()
      await expect(page.getByText(command.syntax, { exact: false }).first()).toBeVisible()
    }
  })
})

test.describe("landing page — links + footer", () => {
  test("github stars pill links to the stargazers url with a count", async ({ page }) => {
    await page.goto("/")
    const stars = page.locator(`a[href="${SITE_CONFIG.githubStarsUrl}"]`).first()
    await expect(stars).toBeVisible()
    await expect(stars).toContainText(/stars/i)
    await expect(stars).toContainText(/\d/)
  })

  test("has a Docs link pointing at /docs", async ({ page }) => {
    await page.goto("/")
    const docs = page.getByRole("link", { name: /docs/i }).first()
    await expect(docs).toBeVisible()
    await expect(docs).toHaveAttribute("href", SITE_CONFIG.docsPath)
  })

  test("co-brands sisyphuslabs and shows lazycodex.ai", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.locator(`a[href="${SITE_CONFIG.sisyphusUrl}"]`).first(),
    ).toBeVisible()
    await expect(page.getByText("lazycodex.ai", { exact: false }).first()).toBeVisible()
  })
})

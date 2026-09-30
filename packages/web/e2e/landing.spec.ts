import { expect, test } from "@playwright/test"
import { COMMANDS } from "../lib/commands"
import { SITE_CONFIG } from "../lib/site-config"

/**
 * Landing `/` contract (TDD target state).
 *
 * Selectors are deliberately tolerant of inline <span> splits: headings,
 * links, and buttons go through getByRole; the hero tagline is checked by
 * its distinctive sub-parts ("planning" + "verified completion") instead of one
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
    await expect(
      page.getByText(SITE_CONFIG.heroLineB.prefix, { exact: false }).first(),
    ).toBeVisible()
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
    await expect(page.getByText("npx lazycodex-ai install", { exact: false }).first()).toBeVisible()
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

  test("feature workflow guidance keeps the three command pillars first", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator("article h2")).toHaveText(COMMANDS.map((command) => command.name))
    await expect(page.getByText("Harness the whole codebase", { exact: false })).toBeVisible()
    await expect(page.getByText("Context that survives", { exact: false }).first()).toBeVisible()
    await expect(page.getByText("Plans before edits", { exact: false }).first()).toBeVisible()
    await expect(page.getByText("Evidence at the end", { exact: false }).first()).toBeVisible()
    await expect(page.getByText("Built-in skill coverage", { exact: false }).first()).toBeVisible()
  })

  test("places skill coverage before the concept section", async ({ page }) => {
    await page.goto("/")

    const skillsTop = await page
      .getByText("Built-in skill coverage", { exact: false })
      .first()
      .evaluate((node) => node.getBoundingClientRect().top)
    const conceptsTop = await page
      .getByText("Where it comes from", { exact: false })
      .first()
      .evaluate((node) => node.getBoundingClientRect().top)

    expect(skillsTop).toBeLessThan(conceptsTop)
  })
})

test.describe("landing page — links + footer", () => {
  test("github stars pill links to the repository with a count", async ({ page }) => {
    await page.goto("/")
    const stars = page.locator(`a[href="${SITE_CONFIG.githubUrl}"]`).first()
    await expect(stars).toBeVisible()
    await expect(stars).toContainText(/stars/i)
    await expect(stars).toContainText(/\d/)
    await expect(stars).not.toContainText(/^0\sstars$/)
    // GitHub restricted /stargazers pages to repo admins (July 2026) — deep
    // links there now 404 for visitors, so the pill must never point at one.
    const stargazersLinks = page.locator('a[href*="/stargazers"]')
    await expect(stargazersLinks).toHaveCount(0)
  })

  test("updates the github stars pill from the live API", async ({ page }) => {
    // A count the fallback label can never show, served before navigation, so
    // the pill passes only when the API response actually reaches the DOM.
    await page.route("**/api/github-stars", (route) =>
      route.fulfill({ json: { stars: 987_654, formatted: "987.7k", source: "github" } }),
    )
    await page.goto("/")

    const stars = page.locator(`a[href="${SITE_CONFIG.githubUrl}"]`).first()
    await expect(stars).toHaveText("987.7k stars")
    await expect(stars).toHaveAttribute("aria-label", "987.7k stars on GitHub")
  })

  test("has a Docs link pointing at /docs", async ({ page }) => {
    await page.goto("/")
    const docs = page.getByRole("link", { name: /docs/i }).first()
    await expect(docs).toBeVisible()
    await expect(docs).toHaveAttribute("href", SITE_CONFIG.docsPath)
  })

  test("links to OmO and shows lazycodex.ai", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.locator(`a[href="${SITE_CONFIG.omoUrl}"]`).first(),
    ).toBeVisible()
    await expect(page.getByText("lazycodex.ai", { exact: false }).first()).toBeVisible()
  })
})

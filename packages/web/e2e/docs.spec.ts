import { test, expect } from "@playwright/test"
import { DOC_SECTIONS } from "../lib/docs-sections"

/**
 * Docs `/docs` contract (TDD target state).
 *
 * The page must be fully server-rendered: every section id present, every
 * heading prose in the DOM with JavaScript disabled, and an in-page nav
 * whose entries jump to the matching anchors.
 */

const ULW_LOOP = DOC_SECTIONS.find((section) => section.id === "ulw-loop")

test.describe("docs page — structure", () => {
  test("responds 200", async ({ request }) => {
    const res = await request.get("/docs")
    expect(res.status()).toBe(200)
  })

  test("has exactly one h1", async ({ page }) => {
    await page.goto("/docs")
    await expect(page.locator("h1")).toHaveCount(1)
  })

  test("renders every section as a visible element carrying its id + title", async ({ page }) => {
    await page.goto("/docs")
    for (const section of DOC_SECTIONS) {
      const node = page.locator(`#${section.id}`)
      await expect(node).toHaveCount(1)
      await expect(node).toBeVisible()
      await expect(node).toContainText(section.title)
    }
  })

  test("nav lists all six section titles as links or buttons", async ({ page }) => {
    await page.goto("/docs")
    const nav = page.getByRole("navigation")
    for (const section of DOC_SECTIONS) {
      const entry = nav
        .getByRole("link", { name: section.title })
        .or(nav.getByRole("button", { name: section.title }))
      await expect(entry.first()).toBeVisible()
    }
  })

  test("documents lazycodex-ai as the npm install alias", async ({ page }) => {
    await page.goto("/docs")
    await expect(page.getByText("bunx lazycodex-ai install", { exact: false }).first()).toBeVisible()
    await expect(
      page
        .getByText("bunx lazycodex-ai install --no-tui --codex-autonomous", { exact: false })
        .first(),
    ).toBeVisible()
    await expect(
      page
        .getByText("bunx --package @code-yeongyu/lazycodex lazycodex install", { exact: false })
        .first(),
    ).toBeVisible()
  })
})

test.describe("docs page — navigation", () => {
  test("clicking the $ulw-loop nav entry jumps to that section", async ({ page }) => {
    if (!ULW_LOOP) throw new Error("DOC_SECTIONS must include the ulw-loop section")
    await page.goto("/docs")
    const nav = page.getByRole("navigation")
    const trigger = nav
      .getByRole("link", { name: ULW_LOOP.title })
      .or(nav.getByRole("button", { name: ULW_LOOP.title }))
      .first()
    await trigger.click()
    await expect(page).toHaveURL(new RegExp(`#${ULW_LOOP.id}$`))
    await expect(page.locator(`#${ULW_LOOP.id}`)).toBeInViewport()
  })
})

test.describe("docs page — no-JS SSR", () => {
  test("server-renders every section heading without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      await page.goto("/docs")
      for (const section of DOC_SECTIONS) {
        const node = page.locator(`#${section.id}`)
        await expect(node).toHaveCount(1)
        await expect(node).toBeVisible()
        await expect(node).toContainText(section.title)
        const prose = (await node.textContent()) ?? ""
        expect(
          prose.length,
          `#${section.id} must server-render prose beyond its title`,
        ).toBeGreaterThan(section.title.length)
      }
    } finally {
      await context.close()
    }
  })
})

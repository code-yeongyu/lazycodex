import { expect, type Page, test } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"
import { ULW_DEMO_SCENES } from "../lib/ulw-demo-scenes"

// The one ask the whole demo answers (the user's opening message).
const SESSION_TITLE = SITE_CONFIG.ultraworkExample

/**
 * Ultrawork demo contract — v10 (appending chat replay).
 *
 * CONTRACT CHANGE (v5 → v10): the demo is no longer scene slides. It is ONE
 * chat session replay: the user's opening ask renders as a message bubble,
 * and the run then unfolds BENEATH it — tool-call rows, prose, code chips
 * appended one after another (earlier entries persist; the transcript
 * scrolls internally). The replay walks the whole grounded run to the
 * checkpoint, then loops. Still non-playable: zero interactive controls,
 * no slide progress bar; the footer keeps the running line ("Working
 * for <elapsed>") plus the run-progress track that fills by phase.
 * Reduced motion renders the COMPLETED transcript statically. The window
 * is fixed dark; the sidebar shows the single constant session; the
 * window's outer box never changes (inner scroll only).
 */

const RESEARCH = ULW_DEMO_SCENES[0]
const CHECKPOINT = ULW_DEMO_SCENES[7]

function activeSession(page: Page) {
  return page
    .locator("#ulw-demo")
    .getByRole("navigation", { name: "Sessions" })
    .locator('[aria-current="true"]')
}

test.describe("ulw demo — chat replay @happy", () => {
  test("one ask, then the run appends beneath it", async ({ page }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    // The user's ask opens the session as a chat bubble; the mode flag and
    // the first run entries are server-rendered beneath it.
    await expect(demo.locator(".ulw-app-user")).toContainText(SESSION_TITLE)
    await expect(page.getByText("ULTRAWORK MODE ENABLED!", { exact: true })).toBeVisible()
    await expect(demo.locator(".ulw-window")).toHaveAttribute("data-window-theme", "dark")
    await expect(activeSession(page)).toContainText(SESSION_TITLE)

    // NOT playable, no slide-timer chrome — just the alive markers.
    await expect(demo.locator(".ulw-window button")).toHaveCount(0)
    await expect(demo.locator(".ulw-app-progress")).toHaveCount(0)
    await expect(demo.locator(".ulw-spinner")).toHaveCount(2)
    await expect(demo.locator(".ulw-run-progress")).toHaveCount(1)

    // The transcript APPENDS: entry count grows while earlier entries stay.
    const entries = demo.locator(".ulw-entry")
    const before = await entries.count()
    expect(before).toBeGreaterThan(0)
    await expect
      .poll(async () => entries.count(), { timeout: 12_000 })
      .toBeGreaterThan(before)
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(demo.locator(".ulw-app-user")).toContainText(SESSION_TITLE)

    // Inner scroll only: the window's outer box is unchanged by growth.
    const ulwWindow = demo.locator(".ulw-window")
    const boxA = await ulwWindow.boundingBox()
    await page.waitForTimeout(4_000)
    const boxB = await ulwWindow.boundingBox()
    expect(boxA).not.toBeNull()
    expect(boxB).not.toBeNull()
    expect(Math.abs((boxA?.height ?? 0) - (boxB?.height ?? 0))).toBeLessThanOrEqual(1)

    await page.screenshot({
      path: "../../.omo/evidence/v10-replay-playing.png",
      fullPage: false,
    })
  })

  test("walks the whole run to the checkpoint, then loops", async ({ page }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.locator(".ulw-window").scrollIntoViewIfNeeded()

    // The replay reaches the final phase (multi-day elapsed on the goal) …
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible({
      timeout: 75_000,
    })
    await expect(demo.getByText(`Working for ${CHECKPOINT.elapsed}`, { exact: true })).toBeVisible()

    // … and loops: the transcript resets to the opening state.
    const entries = demo.locator(".ulw-entry")
    await expect
      .poll(async () => entries.count(), { timeout: 20_000 })
      .toBeLessThan(10)
    await expect(demo.locator(".ulw-app-user")).toContainText(SESSION_TITLE)
  })
})

test.describe("ulw demo — reduced motion + mobile @edge", () => {
  test("reduced motion shows the completed run statically", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    // The full transcript is there at once — nothing to wait for, nothing
    // to click, and nothing appends afterwards.
    await expect(demo.locator(".ulw-app-user")).toContainText(SESSION_TITLE)
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible()
    await expect(demo.locator(".ulw-window button")).toHaveCount(0)

    const entries = demo.locator(".ulw-entry")
    const settled = await entries.count()
    await page.waitForTimeout(3_000)
    await expect(entries).toHaveCount(settled)
  })

  test("no horizontal overflow at 390x844 and the sidebar collapses", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.locator(".ulw-window").scrollIntoViewIfNeeded()

    // The session sidebar is hidden at mobile widths, like the real app.
    await expect(page.getByRole("navigation", { name: "Sessions" })).toBeHidden()

    // The replay keeps appending; dynamic entries must not overflow.
    const entries = demo.locator(".ulw-entry")
    const before = await entries.count()
    await expect
      .poll(async () => entries.count(), { timeout: 12_000 })
      .toBeGreaterThan(before)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    await page.screenshot({
      path: "../../.omo/evidence/v10-replay-mobile.png",
      fullPage: false,
    })
  })
})

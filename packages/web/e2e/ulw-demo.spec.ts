import { expect, test } from "@playwright/test"
import { ULW_DEMO_SCENES } from "../lib/ulw-demo-scenes"

/**
 * Interactive Ultrawork demo contract (TDD target state).
 *
 * The demo is a live-DOM Codex-desktop window driven by a typed scene machine:
 * autoplay on scroll-into-view, scene tabs (role=tab), play/pause (aria-pressed),
 * reduced-motion disables autoplay, and no horizontal overflow at 390px.
 */

const RESEARCH = ULW_DEMO_SCENES[0]
const RED = ULW_DEMO_SCENES[4]
const CHECKPOINT = ULW_DEMO_SCENES[7]

test.describe("ulw demo — happy path @happy", () => {
  test("renders scene 0, autoplays forward, and tabs jump to checkpoint", async ({ page }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    // Scene 0 is the server-rendered initial state.
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(page.getByText("ULTRAWORK MODE ENABLED!", { exact: true })).toBeVisible()

    // Autoplay must advance beyond scene 0 once in view (interval ~7s).
    await expect(page.getByRole("tab", { name: ULW_DEMO_SCENES[1].tab })).toHaveAttribute(
      "aria-selected",
      "true",
      { timeout: 12_000 },
    )

    // Direct scene selection: checkpoint updates every pane atomically.
    await page.getByRole("tab", { name: CHECKPOINT.tab }).click()
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible()
    await expect(demo.getByText("checkpoint --status complete", { exact: false }).first()).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.sideTitle, { exact: true })).toBeVisible()

    // Play/pause is a real control with observable state.
    const playToggle = page.getByRole("button", { name: /pause|play/i }).first()
    const before = await playToggle.getAttribute("aria-pressed")
    await playToggle.click()
    await expect(playToggle).not.toHaveAttribute("aria-pressed", String(before))

    await page.screenshot({
      path: "../../.omo/evidence/g2-c1-demo-checkpoint.png",
      fullPage: false,
    })
  })
})

test.describe("ulw demo — reduced motion + mobile @edge", () => {
  test("reduced motion disables autoplay but tabs still switch scenes", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()

    // No autoplay: after > one interval the first tab is still selected.
    await page.waitForTimeout(9_000)
    await expect(page.getByRole("tab", { name: RESEARCH.tab })).toHaveAttribute(
      "aria-selected",
      "true",
    )

    await page.getByRole("tab", { name: RED.tab }).click()
    await expect(page.getByText(RED.title, { exact: true })).toBeVisible()
  })

  test("no horizontal overflow at 390x844 with the last scene open", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    await page.getByRole("tab", { name: CHECKPOINT.tab }).click()
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    await page.screenshot({
      path: "../../.omo/evidence/g2-c2-demo-mobile.png",
      fullPage: false,
    })
  })
})

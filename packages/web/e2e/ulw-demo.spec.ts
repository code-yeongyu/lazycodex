import { expect, type Page, test } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"
import { ULW_DEMO_SCENES } from "../lib/ulw-demo-scenes"

// The one session the whole demo lives in (the goal being pursued for days).
const SESSION_TITLE = SITE_CONFIG.ultraworkExample

/**
 * Ultrawork demo contract — v5 (cinematic, non-playable).
 *
 * CONTRACT CHANGE (v4 → v5): the demo is a STAGED RECORDING, not a widget.
 * There are NO interactive controls inside the window — no play/pause, no
 * replay, no step navigation, no theme toggle. The window is fixed to its
 * dark theme, autoplays through the 8 scenes on a fast interval once in
 * view, and loops forever. The sidebar shows the run's single constant
 * session; the Pursuing-goal chip carries a day-scale elapsed time that
 * keeps rising across scenes. Reduced motion pins the recording statically
 * on scene 1. Preserved from v4: scene-0 SSR text, autoplay advance,
 * constant session identity, no horizontal overflow at 390px, zero outer
 * layout shift across scenes.
 */

const RESEARCH = ULW_DEMO_SCENES[0]
const PLAN = ULW_DEMO_SCENES[1]
const CHECKPOINT = ULW_DEMO_SCENES[7]

function activeSession(page: Page) {
  return page
    .locator("#ulw-demo")
    .getByRole("navigation", { name: "Sessions" })
    .locator('[aria-current="true"]')
}

test.describe("ulw demo — cinematic recording @happy", () => {
  test("plays itself: no controls, fast autoplay, one session, rising elapsed", async ({
    page,
  }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    // Scene 0 is the server-rendered initial state, inside ONE session,
    // in the fixed dark window — with a day-scale elapsed already on the goal.
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(page.getByText("ULTRAWORK MODE ENABLED!", { exact: true })).toBeVisible()
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible()
    await expect(demo.locator(".ulw-window")).toHaveAttribute("data-window-theme", "dark")
    await expect(activeSession(page)).toContainText(SESSION_TITLE)
    await expect(demo.getByText(RESEARCH.elapsed, { exact: true })).toBeVisible()

    // NOT playable: the window contains zero interactive controls — and no
    // progress bar either; the session just looks naturally in progress.
    await expect(demo.locator(".ulw-window button")).toHaveCount(0)
    await expect(demo.locator(".ulw-app-progress")).toHaveCount(0)

    // The run LOOKS alive: spinner glyphs mark the active session and the
    // current step, exactly like the app's running-session indicator.
    await expect(demo.locator(".ulw-spinner")).toHaveCount(2)

    // Fast autoplay advances the recording on its own; the session and the
    // window box stay constant while the elapsed keeps rising.
    const ulwWindow = demo.locator(".ulw-window")
    const boxA = await ulwWindow.boundingBox()
    await expect(demo.getByText("Step 2 / 8", { exact: true })).toBeVisible({
      timeout: 12_000,
    })
    await expect(page.getByText(PLAN.title, { exact: true })).toBeVisible()
    await expect(demo.getByText(PLAN.elapsed, { exact: true })).toBeVisible()
    await expect(activeSession(page)).toContainText(SESSION_TITLE)

    const boxB = await ulwWindow.boundingBox()
    expect(boxA).not.toBeNull()
    expect(boxB).not.toBeNull()
    expect(Math.abs((boxA?.height ?? 0) - (boxB?.height ?? 0))).toBeLessThanOrEqual(1)
    expect(Math.abs((boxA?.y ?? 0) - (boxB?.y ?? 0))).toBeLessThanOrEqual(1)

    await page.screenshot({
      path: "../../.omo/evidence/v5-demo-playing.png",
      fullPage: false,
    })
  })

  test("reaches the multi-day checkpoint and loops back to the start", async ({ page }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.locator(".ulw-window").scrollIntoViewIfNeeded()

    // The recording walks to the final scene (day-scale elapsed) …
    await expect(demo.getByText("Step 8 / 8", { exact: true })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.elapsed, { exact: true })).toBeVisible()

    // … and loops forever instead of stopping.
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(activeSession(page)).toContainText(SESSION_TITLE)
  })
})

test.describe("ulw demo — reduced motion + mobile @edge", () => {
  test("reduced motion pins the recording statically on scene 1", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()

    // No autoplay: after > two intervals the recording is still on step 1,
    // and there is still nothing to click inside the window.
    await page.waitForTimeout(9_000)
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible()
    await expect(page.getByText(PLAN.title, { exact: true })).toBeHidden()
    await expect(demo.locator(".ulw-window button")).toHaveCount(0)
  })

  test("no horizontal overflow at 390x844 and the sidebar collapses", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    // Scroll the window itself into view: the tall mobile section otherwise
    // leaves it below the fold and the IntersectionObserver never arms.
    await demo.locator(".ulw-window").scrollIntoViewIfNeeded()

    // The session sidebar is hidden at mobile widths, like the real app.
    await expect(page.getByRole("navigation", { name: "Sessions" })).toBeHidden()

    // Autoplay still advances the recording; dynamic scenes must not overflow.
    await expect(page.getByText(PLAN.title, { exact: true })).toBeVisible({
      timeout: 12_000,
    })

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    await page.screenshot({
      path: "../../.omo/evidence/v5-demo-mobile.png",
      fullPage: false,
    })
  })
})

import { expect, type Page, test } from "@playwright/test"
import { ULW_DEMO_SCENES } from "../lib/ulw-demo-scenes"

/**
 * Interactive Ultrawork demo contract — v2 (app-faithful window, natural playback).
 *
 * CONTRACT CHANGE (v1 → v2): the external scene-tab strip (role=tab) is
 * REMOVED. Scene navigation is now the app-native sidebar session list —
 * plain buttons inside nav[aria-label="Demo scenes"] carrying aria-current
 * on the active row (hidden at <=768px, like the real app sidebar). Playback
 * controls moved into the window title bar: play/pause (aria-pressed),
 * replay, and a single Light/Dark window-theme toggle (aria-pressed = dark).
 * Assertion strength is preserved 1:1 versus the v1 suite: scene-0 SSR text,
 * autoplay advance within 12s, direct navigation updating every pane,
 * play/pause observable state, reduced-motion static scene 0 with a play
 * affordance, theme flip via click AND keyboard, dark-theme visibility, and
 * no horizontal overflow at 390px. New in v2: the window's outer height must
 * not change across scenes (zero outer layout shift).
 */

const RESEARCH = ULW_DEMO_SCENES[0]
const PLAN = ULW_DEMO_SCENES[1]
const RED = ULW_DEMO_SCENES[4]
const CHECKPOINT = ULW_DEMO_SCENES[7]

function sceneRow(page: Page, tab: string) {
  return page
    .locator("#ulw-demo")
    .getByRole("navigation", { name: "Demo scenes" })
    .getByRole("button", { name: tab, exact: true })
}

function themeToggle(page: Page) {
  return page.getByRole("button", { name: "Toggle the light window theme" })
}

test.describe("ulw demo — happy path @happy", () => {
  test("renders scene 0, autoplays, and sidebar rows jump to checkpoint shift-free", async ({
    page,
  }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    // Scene 0 is the server-rendered initial state.
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(page.getByText("ULTRAWORK MODE ENABLED!", { exact: true })).toBeVisible()
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible()

    // Autoplay must advance beyond scene 0 once in view (interval ~7s).
    await expect(sceneRow(page, PLAN.tab)).toHaveAttribute("aria-current", "true", {
      timeout: 12_000,
    })

    // Zero outer layout shift: the window box is identical across scenes.
    // Bring the whole window into view first so row clicks never auto-scroll
    // (boundingBox is viewport-relative).
    const ulwWindow = demo.locator(".ulw-window")
    await ulwWindow.scrollIntoViewIfNeeded()
    await sceneRow(page, RESEARCH.tab).click()
    const boxA = await ulwWindow.boundingBox()

    // Direct scene selection via a session row updates every pane atomically.
    await sceneRow(page, CHECKPOINT.tab).click()
    await expect(sceneRow(page, CHECKPOINT.tab)).toHaveAttribute("aria-current", "true")
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible()
    await expect(demo.getByText("checkpoint --status complete", { exact: true })).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.sideTitle, { exact: true })).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.composer, { exact: true })).toBeVisible()
    await expect(demo.getByText("Step 8 / 8", { exact: true })).toBeVisible()

    const boxB = await ulwWindow.boundingBox()
    expect(boxA).not.toBeNull()
    expect(boxB).not.toBeNull()
    expect(Math.abs((boxA?.height ?? 0) - (boxB?.height ?? 0))).toBeLessThanOrEqual(1)
    expect(Math.abs((boxA?.y ?? 0) - (boxB?.y ?? 0))).toBeLessThanOrEqual(1)

    // Selecting a row pauses playback; play/pause is a real observable toggle.
    // Anchored: "Replay the demo…" must not match the play/pause button name.
    const playToggle = page.getByRole("button", { name: /^(pause|play) the demo$/i })
    await expect(playToggle).toHaveAttribute("aria-pressed", "false")
    await playToggle.click()
    await expect(playToggle).toHaveAttribute("aria-pressed", "true")

    // Replay restarts the recording from scene 0 and keeps playing.
    await page.getByRole("button", { name: "Replay the demo from the first scene" }).click()
    await expect(sceneRow(page, RESEARCH.tab)).toHaveAttribute("aria-current", "true")
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(playToggle).toHaveAttribute("aria-pressed", "true")

    await page.screenshot({
      path: "../../.omo/evidence/v2-demo-checkpoint.png",
      fullPage: false,
    })
  })
})

test.describe("ulw demo — reduced motion + mobile @edge", () => {
  test("reduced motion pins scene 0 but keeps the play affordance and rows working", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()

    // No autoplay: after > one interval the first session row is still current.
    await page.waitForTimeout(9_000)
    await expect(sceneRow(page, RESEARCH.tab)).toHaveAttribute("aria-current", "true")
    await expect(sceneRow(page, PLAN.tab)).not.toHaveAttribute("aria-current", "true")

    // The play affordance stays available for explicit intent.
    await expect(page.getByRole("button", { name: "Play the demo", exact: true })).toBeVisible()

    await sceneRow(page, RED.tab).click()
    await expect(page.getByText(RED.title, { exact: true })).toBeVisible()
  })

  test("no horizontal overflow at 390x844 and the sidebar collapses", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    // Scroll the window itself into view: the tall mobile section otherwise
    // leaves it below the fold and the IntersectionObserver never arms.
    await demo.locator(".ulw-window").scrollIntoViewIfNeeded()

    // The session sidebar is hidden at mobile widths, like the real app.
    await expect(page.getByRole("navigation", { name: "Demo scenes" })).toBeHidden()

    // Autoplay still advances the recording; dynamic scenes must not overflow.
    await expect(page.getByText(PLAN.title, { exact: true })).toBeVisible({
      timeout: 12_000,
    })

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    await page.screenshot({
      path: "../../.omo/evidence/v2-demo-mobile.png",
      fullPage: false,
    })
  })
})

test.describe("ulw demo — window theme toggle", () => {
  test("defaults to the dark window theme with an accessible toggle @happy", async ({
    page,
  }) => {
    await page.goto("/")
    const ulwWindow = page.locator("#ulw-demo .ulw-window")

    // Dark is the default: the window sits on a near-black canvas, so the
    // elevated dark layer is the restful state; light is the opt-in.
    await expect(ulwWindow).toHaveAttribute("data-window-theme", "dark")
    await expect(themeToggle(page)).toHaveAttribute("aria-pressed", "false")
  })

  test("clicking the toggle flips data-window-theme and aria-pressed @happy", async ({
    page,
  }) => {
    await page.goto("/")
    const ulwWindow = page.locator("#ulw-demo .ulw-window")

    await expect(themeToggle(page)).toBeVisible()
    await themeToggle(page).click()
    await expect(ulwWindow).toHaveAttribute("data-window-theme", "light")
    await expect(themeToggle(page)).toHaveAttribute("aria-pressed", "true")

    await themeToggle(page).click()
    await expect(ulwWindow).toHaveAttribute("data-window-theme", "dark")
    await expect(themeToggle(page)).toHaveAttribute("aria-pressed", "false")
  })

  test("keyboard: Enter on the focused toggle flips the window theme @edge", async ({
    page,
  }) => {
    await page.goto("/")
    const ulwWindow = page.locator("#ulw-demo .ulw-window")

    await expect(themeToggle(page)).toBeVisible()
    await themeToggle(page).focus()
    await expect(themeToggle(page)).toBeFocused()
    await page.keyboard.press("Enter")

    await expect(ulwWindow).toHaveAttribute("data-window-theme", "light")
    await expect(themeToggle(page)).toHaveAttribute("aria-pressed", "true")
  })

  test("light window theme keeps the scene-0 transcript visible @edge", async ({ page }) => {
    // Reduced motion pins the demo on scene 0 so the visibility check is stable.
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const ulwWindow = page.locator("#ulw-demo .ulw-window")

    await expect(themeToggle(page)).toBeVisible()
    await themeToggle(page).click()
    await expect(ulwWindow).toHaveAttribute("data-window-theme", "light")

    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(page.getByText("ULTRAWORK MODE ENABLED!", { exact: true })).toBeVisible()
  })
})

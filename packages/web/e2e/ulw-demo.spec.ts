import { expect, type Page, test } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"
import { ULW_DEMO_SCENES } from "../lib/ulw-demo-scenes"

// The one session the whole demo lives in (the goal being pursued for 30h+).
const SESSION_TITLE = SITE_CONFIG.ultraworkExample

/**
 * Interactive Ultrawork demo contract — v4 (one session, one goal).
 *
 * CONTRACT CHANGE (v2 → v4): the sidebar no longer lists scenes as separate
 * sessions — the whole demo is ONE long-running session ("ulw add
 * authentication") pursuing one goal, exactly like the real app. The sidebar
 * (nav[aria-label="Sessions"], hidden <=768px) shows that single active
 * session, constant across every scene. Scene navigation moved to the step
 * pill's Previous/Next buttons; the Pursuing-goal chip shows a per-scene
 * elapsed time rising past 30h at the checkpoint. Playback controls stay in
 * the title bar: play/pause (aria-pressed), replay, window-theme toggle
 * (dark default, light opt-in). Assertion strength preserved: scene-0 SSR
 * text, autoplay advance within 12s, step nav updating every pane,
 * play/pause observable state, reduced-motion static step 1 with a play
 * affordance, theme flip via click AND keyboard, light-theme visibility,
 * no horizontal overflow at 390px, zero outer layout shift across scenes.
 */

const RESEARCH = ULW_DEMO_SCENES[0]
const PLAN = ULW_DEMO_SCENES[1]
const RED = ULW_DEMO_SCENES[4]
const CHECKPOINT = ULW_DEMO_SCENES[7]

// The sidebar depicts ONE long-running session pursuing one goal — it never
// changes across scenes. Scene jumps live on the step pill's prev/next.
function activeSession(page: Page) {
  return page
    .locator("#ulw-demo")
    .getByRole("navigation", { name: "Sessions" })
    .locator('[aria-current="true"]')
}

function stepNav(page: Page, direction: "Previous step" | "Next step") {
  return page.locator("#ulw-demo").getByRole("button", { name: direction, exact: true })
}

function themeToggle(page: Page) {
  return page.getByRole("button", { name: "Toggle the light window theme" })
}

test.describe("ulw demo — happy path @happy", () => {
  test("one session pursues one goal: autoplay, step nav, rising elapsed, shift-free", async ({
    page,
  }) => {
    await page.goto("/")
    const demo = page.locator("#ulw-demo")
    await demo.scrollIntoViewIfNeeded()

    // Scene 0 is the server-rendered initial state, inside ONE active session.
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(page.getByText("ULTRAWORK MODE ENABLED!", { exact: true })).toBeVisible()
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible()
    await expect(activeSession(page)).toContainText(SESSION_TITLE)
    await expect(demo.getByText(RESEARCH.elapsed, { exact: true })).toBeVisible()

    // Autoplay must advance beyond scene 0 once in view (interval ~7s) —
    // and the sidebar session stays EXACTLY the same (one run, one goal).
    await expect(demo.getByText("Step 2 / 8", { exact: true })).toBeVisible({
      timeout: 12_000,
    })
    await expect(activeSession(page)).toContainText(SESSION_TITLE)

    // Zero outer layout shift: the window box is identical across scenes.
    const ulwWindow = demo.locator(".ulw-window")
    await ulwWindow.scrollIntoViewIfNeeded()
    await stepNav(page, "Previous step").click()
    const boxA = await ulwWindow.boundingBox()

    // Step nav walks the recording; every pane updates atomically and the
    // goal's elapsed time keeps rising toward the 30h+ checkpoint.
    for (let i = 0; i < ULW_DEMO_SCENES.length - 1; i += 1) {
      await stepNav(page, "Next step").click()
    }
    await expect(page.getByText(CHECKPOINT.title, { exact: true })).toBeVisible()
    await expect(demo.getByText("checkpoint --status complete", { exact: true })).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.sideTitle, { exact: true })).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.composer, { exact: true })).toBeVisible()
    await expect(demo.getByText("Step 8 / 8", { exact: true })).toBeVisible()
    await expect(demo.getByText(CHECKPOINT.elapsed, { exact: true })).toBeVisible()
    await expect(stepNav(page, "Next step")).toBeDisabled()
    await expect(activeSession(page)).toContainText(SESSION_TITLE)

    const boxB = await ulwWindow.boundingBox()
    expect(boxA).not.toBeNull()
    expect(boxB).not.toBeNull()
    expect(Math.abs((boxA?.height ?? 0) - (boxB?.height ?? 0))).toBeLessThanOrEqual(1)
    expect(Math.abs((boxA?.y ?? 0) - (boxB?.y ?? 0))).toBeLessThanOrEqual(1)

    // Stepping pauses playback; play/pause is a real observable toggle.
    // Anchored: "Replay the demo…" must not match the play/pause button name.
    const playToggle = page.getByRole("button", { name: /^(pause|play) the demo$/i })
    await expect(playToggle).toHaveAttribute("aria-pressed", "false")
    await playToggle.click()
    await expect(playToggle).toHaveAttribute("aria-pressed", "true")

    // Replay restarts the recording from scene 0 and keeps playing.
    await page.getByRole("button", { name: "Replay the demo from the first scene" }).click()
    await expect(page.getByText(RESEARCH.title, { exact: true })).toBeVisible()
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible()
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

    // No autoplay: after > one interval the recording is still on step 1.
    await page.waitForTimeout(9_000)
    await expect(demo.getByText("Step 1 / 8", { exact: true })).toBeVisible()
    await expect(page.getByText(PLAN.title, { exact: true })).toBeHidden()

    // The play affordance stays available for explicit intent.
    await expect(page.getByRole("button", { name: "Play the demo", exact: true })).toBeVisible()

    // Step nav still works under reduced motion (explicit user intent).
    for (let i = 0; i < 4; i += 1) {
      await stepNav(page, "Next step").click()
    }
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

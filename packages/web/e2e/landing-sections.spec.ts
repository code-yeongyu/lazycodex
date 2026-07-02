import { expect, test } from "@playwright/test"
import { SITE_CONFIG } from "../lib/site-config"

/**
 * New landing sections contract (TDD target state).
 *
 * Team Mode and ulw-research sections render grounded copy only, and the
 * information architecture keeps: install → demo → commands → workflows →
 * team mode → ulw-research → Hephaestus.
 */

async function topOf(page: import("@playwright/test").Page, text: string): Promise<number> {
  return page
    .getByText(text, { exact: false })
    .first()
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY)
}

test.describe("team mode section", () => {
  test("renders the grounded team mode copy", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: SITE_CONFIG.teamMode.title }),
    ).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.teamMode.compositionRule, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.teamMode.whenTitle, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.teamMode.threadNote, { exact: false }).first(),
    ).toBeVisible()
    for (const member of SITE_CONFIG.teamMode.memberThreads) {
      await expect(page.getByText(member.name, { exact: false }).first()).toBeVisible()
    }
  })
})

test.describe("ulw-research section", () => {
  test("renders the grounded ulw-research copy", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: SITE_CONFIG.ulwResearch.title }),
    ).toBeVisible()
    await expect(
      page.getByText(SITE_CONFIG.ulwResearch.body, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.getByText("Activates only on an explicit demand", { exact: false }).first(),
    ).toBeVisible()
  })
})

test.describe("information architecture", () => {
  test("keeps the planned section order", async ({ page }) => {
    await page.goto("/")

    const install = await topOf(page, SITE_CONFIG.installCommand)
    const demo = await page
      .locator("#ulw-demo")
      .evaluate((node) => node.getBoundingClientRect().top + window.scrollY)
    const commands = await topOf(page, "$ulw-loop")
    const workflows = await topOf(page, SITE_CONFIG.featureWorkflows.title)
    const teamMode = await topOf(page, SITE_CONFIG.teamMode.title)
    const research = await topOf(page, SITE_CONFIG.ulwResearch.title)
    // The hero eyebrow contains the omoIntro title case-insensitively, so
    // anchor on the section heading role instead of raw text.
    const hephaestus = await page
      .getByRole("heading", { name: SITE_CONFIG.omoIntro.title })
      .evaluate((node) => node.getBoundingClientRect().top + window.scrollY)

    expect(install).toBeLessThan(demo)
    expect(demo).toBeLessThan(commands)
    expect(commands).toBeLessThan(workflows)
    expect(workflows).toBeLessThan(teamMode)
    expect(teamMode).toBeLessThan(research)
    expect(research).toBeLessThan(hephaestus)

    await page.screenshot({
      path: "../../.omo/evidence/g3-c1/landing-1280-full.png",
      fullPage: true,
    })
  })
})

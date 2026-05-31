import { test, expect } from "@playwright/test"

test.describe("coming-soon page — SEO + metadata", () => {
  test("has a unique <title>, description, canonical, lang, viewport", async ({ page }) => {
    await page.goto("/")

    await expect(page).toHaveTitle(/LazyCodex AI.*Coming June 2026/i)

    const description = await page.locator('meta[name="description"]').getAttribute("content")
    expect(description).toBeTruthy()
    expect(description?.length).toBeGreaterThan(50)
    expect(description?.length).toBeLessThanOrEqual(170)
    expect(description).toMatch(/OpenCode/i)
    expect(description).toMatch(/June 2026/i)

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href")
    // Next.js metadataBase + canonical: "/" can resolve to either with or
    // without trailing slash depending on the App Router version. Accept
    // both; the SEO contract is "the canonical URL points to the apex".
    expect(canonical).toMatch(/^https:\/\/lazycodex\.ai\/?$/)

    const lang = await page.locator("html").getAttribute("lang")
    expect(lang).toBe("en")

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content")
    expect(viewport).toMatch(/width=device-width/)
  })

  test("has OpenGraph and Twitter card tags", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /LazyCodex AI/,
    )
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      /OpenCode/,
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website")
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://lazycodex.ai",
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    )
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1)
  })

  test("has JSON-LD SoftwareApplication structured data", async ({ page }) => {
    await page.goto("/")
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
    expect(jsonLd).toBeTruthy()
    const parsed = JSON.parse(jsonLd ?? "{}")
    expect(parsed["@type"]).toBe("SoftwareApplication")
    expect(parsed.name).toBe("LazyCodex AI")
    expect(parsed.url).toBe("https://lazycodex.ai")
  })

  test("/robots.txt and /sitemap.xml are reachable", async ({ request }) => {
    const robots = await request.get("/robots.txt")
    expect(robots.status()).toBe(200)
    const robotsText = await robots.text()
    expect(robotsText).toMatch(/Allow:\s*\//i)
    expect(robotsText).toMatch(/Sitemap:\s*https:\/\/lazycodex\.ai\/sitemap\.xml/i)

    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    const sitemapText = await sitemap.text()
    expect(sitemapText).toMatch(/<loc>https:\/\/lazycodex\.ai\/<\/loc>/i)
    expect(sitemapText).toMatch(/<loc>https:\/\/lazycodex\.ai\/docs<\/loc>/i)
  })

  test("/docs route is reachable", async ({ request }) => {
    const docs = await request.get("/docs")
    expect(docs.status()).toBe(200)
  })

  test("/manifest.webmanifest is reachable and valid", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest")
    expect(manifest.status()).toBe(200)
    const parsed = await manifest.json()
    expect(parsed.name).toBe("LazyCodex AI")
    expect(parsed.start_url).toBe("/")
  })

  test("opengraph image and twitter image render as PNGs", async ({ request }) => {
    const og = await request.get("/opengraph-image")
    expect(og.status()).toBe(200)
    expect(og.headers()["content-type"]).toMatch(/image\/png/)

    const tw = await request.get("/twitter-image")
    expect(tw.status()).toBe(200)
    expect(tw.headers()["content-type"]).toMatch(/image\/png/)
  })
})

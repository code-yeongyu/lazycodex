import { readFileSync } from "node:fs"
import { join } from "node:path"
import { expect, test } from "@playwright/test"
import {
  fetchGitHubStars,
  parseGitHubStarsPayload,
  parseShieldsStarsPayload,
} from "../lib/github-stars"
import { FALLBACK_GITHUB_STARS, formatStarsCount } from "../lib/github-stars-format"

function restoreEnvVar(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}

test.describe("github stars API", () => {
  test("responds with a numeric live star count", async ({ request }) => {
    const response = await request.get("/api/github-stars")

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(typeof body.stars).toBe("number")
    expect(body.stars).toBeGreaterThan(0)
    expect(typeof body.formatted).toBe("string")
    expect(body.formatted.length).toBeGreaterThan(0)
    expect(["github", "shields"]).toContain(body.source)
    expect(body.source).not.toBe("fallback")
  })
})

test.describe("github stars live source parsing", () => {
  test("uses GH_TOKEN when GITHUB_TOKEN is absent", async () => {
    const originalFetch = globalThis.fetch
    const originalGitHubToken = process.env.GITHUB_TOKEN
    const originalGhToken = process.env.GH_TOKEN
    const authorizationHeaders: string[] = []

    globalThis.fetch = async (_input, init) => {
      authorizationHeaders.push(new Headers(init?.headers).get("Authorization") ?? "")
      return Response.json({ stargazers_count: 321 })
    }

    try {
      delete process.env.GITHUB_TOKEN
      process.env.GH_TOKEN = "ghp_live"

      const stars = await fetchGitHubStars()

      expect(stars).toEqual({ stars: 321, formatted: "321", source: "github" })
      expect(authorizationHeaders).toEqual(["Bearer ghp_live"])
    } finally {
      globalThis.fetch = originalFetch
      restoreEnvVar("GITHUB_TOKEN", originalGitHubToken)
      restoreEnvVar("GH_TOKEN", originalGhToken)
    }
  })

  test("falls back to Shields when GitHub rejects the request", async () => {
    const originalFetch = globalThis.fetch
    const requestedUrls: string[] = []

    globalThis.fetch = async (input, _init) => {
      requestedUrls.push(String(input))
      if (requestedUrls.length === 1) {
        return new Response("rate limited", { status: 403 })
      }

      return Response.json({ message: "1.2k" })
    }

    try {
      const stars = await fetchGitHubStars()

      expect(stars).toEqual({ stars: 1_200, formatted: "1.2k", source: "shields" })
      expect(requestedUrls[0]).toContain("api.github.com")
      expect(requestedUrls[1]).toContain("img.shields.io")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test("parses Shields comma and compact star payloads", () => {
    expect(parseShieldsStarsPayload({ value: "1,234" })).toBe(1_234)
    expect(parseShieldsStarsPayload({ message: "2.5k" })).toBe(2_500)
    expect(parseShieldsStarsPayload({ message: "invalid" })).toBeUndefined()
  })

  test("caches the non-zero fallback instead of serving a zero-star shell", () => {
    const routeSource = readFileSync(join(process.cwd(), "app/api/github-stars/route.ts"), "utf8")

    expect(FALLBACK_GITHUB_STARS).toBeGreaterThan(0)
    expect(formatStarsCount(FALLBACK_GITHUB_STARS)).not.toBe("0")
    expect(routeSource).toContain(
      'const FALLBACK_CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400"',
    )
  })

  test("rejects zero-star upstream payloads as stale or broken source data", () => {
    expect(parseGitHubStarsPayload({ stargazers_count: 0 })).toBeUndefined()
    expect(parseShieldsStarsPayload({ value: 0 })).toBeUndefined()
    expect(parseShieldsStarsPayload({ message: "0" })).toBeUndefined()
  })
})

import { formatStarsCount } from "./github-stars-format"

const GITHUB_API_BASE = "https://api.github.com"
const GITHUB_OWNER = "code-yeongyu"
const GITHUB_REPO = "lazycodex"
const GITHUB_STARS_TIMEOUT_MS = 5_000
const SHIELDS_STARS_URL = `https://img.shields.io/github/stars/${GITHUB_OWNER}/${GITHUB_REPO}.json`

export type GitHubStarsSource = "github" | "shields"

export type GitHubStarsData = {
  readonly stars: number
  readonly formatted: string
  readonly source: GitHubStarsSource
}

class GitHubStarsFetchError extends Error {
  readonly name = "GitHubStarsFetchError"

  constructor(
    readonly source: GitHubStarsSource,
    readonly status: number,
  ) {
    super(`${source} stars request failed with status ${status}`)
  }
}

class GitHubStarsPayloadError extends Error {
  readonly name = "GitHubStarsPayloadError"

  constructor(readonly source: GitHubStarsSource) {
    super(`${source} stars response did not include a parseable star count`)
  }
}

export function parseGitHubStarsPayload(payload: unknown): number | undefined {
  if (typeof payload !== "object" || payload === null || !("stargazers_count" in payload)) {
    return undefined
  }

  const stars = payload.stargazers_count
  if (typeof stars !== "number" || !Number.isFinite(stars) || stars <= 0) {
    return undefined
  }

  return Math.floor(stars)
}

function parseStarsText(value: string): number | undefined {
  const normalized = value.trim().replaceAll(",", "")
  const match = /^(\d+(?:\.\d+)?)([kKmM])?$/.exec(normalized)
  if (!match) return undefined

  const [, amountText, suffix] = match
  const amount = Number(amountText)
  if (!Number.isFinite(amount) || amount <= 0) return undefined

  if (suffix?.toLowerCase() === "m") {
    return Math.round(amount * 1_000_000)
  }

  if (suffix?.toLowerCase() === "k") {
    return Math.round(amount * 1_000)
  }

  return Math.floor(amount)
}

function parseStarsValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }

  if (typeof value === "string") {
    return parseStarsText(value)
  }

  return undefined
}

export function parseShieldsStarsPayload(payload: unknown): number | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  if ("value" in payload) {
    const valueStars = parseStarsValue(payload.value)
    if (valueStars !== undefined) return valueStars
  }

  if ("message" in payload) {
    return parseStarsValue(payload.message)
  }

  return undefined
}

function createGitHubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "User-Agent": "lazycodex-web",
    "X-GitHub-Api-Version": "2022-11-28",
  }
}

async function fetchJson(source: GitHubStarsSource, url: string, headers?: HeadersInit): Promise<unknown> {
  const response = await fetch(url, {
    ...(headers ? { headers } : {}),
    signal: AbortSignal.timeout(GITHUB_STARS_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new GitHubStarsFetchError(source, response.status)
  }

  return response.json()
}

async function fetchGitHubApiStars(): Promise<GitHubStarsData> {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}`
  const payload = await fetchJson("github", url, createGitHubHeaders())
  const stars = parseGitHubStarsPayload(payload)
  if (stars === undefined) {
    throw new GitHubStarsPayloadError("github")
  }

  return {
    stars,
    formatted: formatStarsCount(stars),
    source: "github",
  }
}

async function fetchShieldsStars(): Promise<GitHubStarsData> {
  const payload = await fetchJson("shields", SHIELDS_STARS_URL)
  const stars = parseShieldsStarsPayload(payload)
  if (stars === undefined) {
    throw new GitHubStarsPayloadError("shields")
  }

  return {
    stars,
    formatted: formatStarsCount(stars),
    source: "shields",
  }
}

export async function fetchGitHubStars(): Promise<GitHubStarsData> {
  try {
    return await fetchGitHubApiStars()
  } catch {
    return fetchShieldsStars()
  }
}

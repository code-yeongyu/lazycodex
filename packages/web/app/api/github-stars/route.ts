import { NextResponse } from "next/server"
import { fetchGitHubStars, type GitHubStarsData } from "../../../lib/github-stars"
import { FALLBACK_GITHUB_STARS, formatStarsCount } from "../../../lib/github-stars-format"

export const dynamic = "force-dynamic"
export const revalidate = 60

const LIVE_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600"
const FALLBACK_CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400"

type GitHubStarsFallbackPayload = {
  readonly stars: number
  readonly formatted: string
  readonly source: "fallback"
}

type GitHubStarsApiPayload = GitHubStarsData | GitHubStarsFallbackPayload

function createStarsResponse(
  payload: GitHubStarsApiPayload,
  cacheControl: string,
): NextResponse<GitHubStarsApiPayload> {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": cacheControl,
    },
  })
}

export async function GET(): Promise<NextResponse<GitHubStarsApiPayload>> {
  try {
    const data = await fetchGitHubStars()
    return createStarsResponse(data, LIVE_CACHE_CONTROL)
  } catch {
    return createStarsResponse(
      {
        stars: FALLBACK_GITHUB_STARS,
        formatted: formatStarsCount(FALLBACK_GITHUB_STARS),
        source: "fallback",
      },
      FALLBACK_CACHE_CONTROL,
    )
  }
}

"use client"

import type { JSX } from "react"
import { useEffect, useState } from "react"
import { FALLBACK_GITHUB_STARS, formatStarsCount } from "../../lib/github-stars-format"
import { SITE_CONFIG } from "../../lib/site-config"

function readFormattedStars(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null || !("formatted" in payload)) {
    return undefined
  }

  if ("stars" in payload) {
    const stars = payload.stars
    if (typeof stars !== "number" || !Number.isFinite(stars) || stars <= 0) {
      return undefined
    }
  }

  const formatted = payload.formatted
  if (typeof formatted !== "string" || formatted.trim().length === 0) {
    return undefined
  }

  return formatted === "0" ? undefined : formatted
}

export function GithubStarsPill(): JSX.Element {
  const [starsLabel, setStarsLabel] = useState(formatStarsCount(FALLBACK_GITHUB_STARS))

  useEffect(() => {
    let cancelled = false

    async function refreshStars(): Promise<void> {
      try {
        const response = await fetch("/api/github-stars")
        if (!response.ok || cancelled) return

        const payload: unknown = await response.json()
        const formatted = readFormattedStars(payload)
        if (formatted === undefined || cancelled) return

        setStarsLabel(formatted)
      } catch {
        return
      }
    }

    void refreshStars()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <a
      href={SITE_CONFIG.githubStarsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-8 items-center gap-1.5 rounded-full border border-[color:var(--accent-primary-border)] bg-[color:var(--accent-primary-soft)] px-3 text-sm font-medium text-[color:var(--accent-primary)] transition-colors hover:border-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
      aria-label={`${starsLabel} stars on GitHub`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform group-hover:scale-110"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>{starsLabel} stars</span>
    </a>
  )
}

import type { JSX } from "react"
import Link from "next/link"
import { BrandMark } from "../design-system/brand-mark"
import { MarketingContainer } from "../design-system/layout"
import { SITE_CONFIG } from "../../lib/site-config"
import { GithubStarsPill } from "./github-stars-pill"

export function SiteHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/85 backdrop-blur-md">
      <MarketingContainer className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
            aria-label="LazyCodex home"
          >
            {/* Inline SVG mark: zero network bytes (a real <img> of the 512px
                icon would download ~200KB above the fold and starve the LCP
                text paint on throttled mobile). */}
            <BrandMark className="h-6 w-6" />
            <span className="font-medium tracking-tight text-[color:var(--text-primary)]">
              {SITE_CONFIG.wordmark}
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 md:gap-6">
          <Link
            href={SITE_CONFIG.docsPath}
            prefetch={false}
            className="text-sm font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"
          >
            Docs
          </Link>
          <GithubStarsPill />
        </nav>
      </MarketingContainer>
    </header>
  )
}

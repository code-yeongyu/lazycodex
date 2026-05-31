import type { JSX } from "react"
import Link from "next/link"
import { SITE_CONFIG } from "../../lib/site-config"
import { GithubStarsPill } from "./github-stars-pill"

export function SiteHeader(): JSX.Element {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[color:var(--surface-base)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-cyan)]"
            aria-label="LazyCodex AI home"
          >
            {/* Inline SVG boulder mark: zero network bytes (a real <img> of
                the 512px icon would download ~200KB above the fold and starve
                the LCP text paint on throttled mobile). */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path
                d="M5.2 14.6C4.1 10.3 8 4.8 12.6 5 17 5.2 20 8.8 19.4 13.2 18.8 17.6 14.8 20 10.8 19.4 7.6 18.9 6.1 17.4 5.2 14.6Z"
                fill="var(--card-base)"
                stroke="var(--accent-cyan)"
                strokeWidth="1.3"
              />
              <path
                d="M9.2 11.4 11.6 13.2 9.4 15M13 15.4H15.4"
                stroke="var(--accent-cyan)"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium tracking-tight text-[color:var(--text-primary)]">
              {SITE_CONFIG.wordmark}
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 md:gap-6">
          <a
            href={SITE_CONFIG.sisyphusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)] md:block"
          >
            by Sisyphus Labs
          </a>
          <Link
            href={SITE_CONFIG.docsPath}
            prefetch={false}
            className="text-sm font-medium text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-cyan)]"
          >
            Docs
          </Link>
          <GithubStarsPill />
        </nav>
      </div>
    </header>
  )
}

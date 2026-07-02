import type { JSX } from "react"
import Link from "next/link"
import { MarketingContainer } from "../design-system/layout"
import { SITE_CONFIG } from "../../lib/site-config"

const footerLinkClassName =
  "transition-colors hover:text-[color:var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)]"

export function SiteFooter(): JSX.Element {
  return (
    <footer className="w-full border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-night)] py-12">
      {/* Modest column footer (ampcode-style rule): EXISTING destinations
          only — brand line, Docs, GitHub, OmO. No invented links. */}
      <MarketingContainer className="grid gap-8 text-sm text-[color:var(--text-tertiary)] sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <span className="font-mono font-medium text-[color:var(--text-secondary)]">
            lazycodex.ai
          </span>
          <span aria-hidden="true">·</span>
          <span>MIT License</span>
        </div>

        <div className="flex flex-col items-start gap-2.5">
          <Link
            href={SITE_CONFIG.docsPath}
            prefetch={false}
            className={footerLinkClassName}
          >
            Docs
          </Link>
          <a
            href={SITE_CONFIG.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClassName}
          >
            GitHub
          </a>
        </div>

        <div className="flex flex-col items-start gap-2.5">
          <a
            href={SITE_CONFIG.omoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={footerLinkClassName}
          >
            OmO
          </a>
        </div>
      </MarketingContainer>
    </footer>
  )
}

import type { JSX } from "react"
import { MarketingSection } from "../../design-system/layout"
import { InlineCode, Kicker } from "../../design-system/typography"
import { SITE_CONFIG } from "../../../lib/site-config"
import { CodexWindow } from "./codex-window"

/**
 * Interactive Ultrawork demo — the landing's product anchor. Intro copy is
 * grounded in content/docs/ultrawork.md (see .omo/evidence/copy-ledger.md);
 * the window itself replays a real ulw run as a live-DOM scene machine.
 */
export function UlwDemoSection(): JSX.Element {
  return (
    <MarketingSection
      id="ulw-demo"
      className="mt-24 flex flex-col items-center text-center md:mt-32"
    >
      <Kicker>{SITE_CONFIG.ulwDemo.kicker}</Kicker>
      <h2 className="text-balance text-[clamp(32px,5vw,48px)] font-medium tracking-tight text-[color:var(--text-primary)]">
        {SITE_CONFIG.ulwDemo.title}
      </h2>
      <p className="mt-4 max-w-[70ch] text-balance text-base leading-relaxed text-[color:var(--text-muted)] md:text-lg">
        {SITE_CONFIG.ulwDemo.intro}
      </p>

      <div className="mt-6 rounded-lg border border-[color:var(--accent-primary)]/20 bg-[color:var(--accent-primary)]/5 px-6 py-3 shadow-[0_0_30px_rgba(74,222,128,0.1)]">
        <InlineCode className="text-lg text-[color:var(--accent-mint)]">
          {SITE_CONFIG.ultraworkExample}
        </InlineCode>
      </div>

      <blockquote className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
        “{SITE_CONFIG.ulwDemo.quote}”
      </blockquote>

      <div className="mt-12 w-full">
        <CodexWindow />
      </div>
    </MarketingSection>
  )
}

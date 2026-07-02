import type { JSX } from "react"
import { HeroBrandMark } from "../design-system/brand-mark"
import { SITE_CONFIG } from "../../lib/site-config"

export function Hero(): JSX.Element {
  return (
    <section className="relative flex w-full flex-col justify-end pb-[36px] pt-[36px] md:pb-[44px] md:pt-[52px]">
      {/* Open light canvas — no card, no gradient washes. The declarative
          hero text sits directly on the sage ground so it stays the LCP
          element and paints at FCP; the demo window below carries the
          visual weight. Compact by design: the block stays under ~60vh at
          1440x900 so the demo window's top edge is visible in the first
          viewport. */}
      <div className="flex items-end justify-between gap-8">
        <div className="flex max-w-[820px] flex-col gap-[18px] text-left">
          <p className="font-mono text-[13px] font-medium uppercase tracking-[0.28em] text-[color:var(--text-soft)]">
            {SITE_CONFIG.eyebrow}
          </p>

          <h1 className="wordmark m-0 text-balance text-[clamp(44px,6vw,88px)] font-semibold leading-[0.95] tracking-[-0.03em] text-[color:var(--text-primary)]">
            {SITE_CONFIG.wordmark}
          </h1>

          <p className="m-0 max-w-[640px] text-balance text-[clamp(18px,2vw,24px)] font-normal leading-[1.4] tracking-[-0.005em] text-[color:var(--text-secondary)]">
            {SITE_CONFIG.heroLineA}
          </p>

          <p className="m-0 max-w-[620px] text-balance text-[clamp(15px,1.5vw,18px)] font-normal leading-[1.5] text-[color:var(--text-muted)]">
            {SITE_CONFIG.heroLineB.prefix}
            <span className="font-mono font-medium text-[color:var(--accent-primary)]">
              {SITE_CONFIG.heroLineB.slot}
            </span>
            {SITE_CONFIG.heroLineB.suffix}
            <span className="font-medium text-[color:var(--accent-primary)]">
              {SITE_CONFIG.heroLineB.keyword}
            </span>
            {SITE_CONFIG.heroLineB.period}
          </p>

          {/* Declarative pillar row — sisyphus-style stacked statements
              rendered as a compact inline list (plain text, no links). */}
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-[18px] gap-y-[8px] p-0 pt-[4px]">
            {SITE_CONFIG.harnessPillars.map((pillar) => (
              <li
                key={pillar}
                className="flex items-center gap-[8px] font-mono text-[12px] uppercase tracking-[0.14em] text-[color:var(--text-tertiary)]"
              >
                <span
                  aria-hidden="true"
                  className="h-[5px] w-[5px] rounded-full bg-[color:var(--accent-primary)]"
                />
                {pillar}
              </li>
            ))}
          </ul>
        </div>

        {/* Right-anchored brand mark — a composed visual anchor. */}
        <div className="hidden shrink-0 items-center justify-end md:flex">
          <HeroBrandMark />
        </div>
      </div>
    </section>
  )
}

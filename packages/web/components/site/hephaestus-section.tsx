import type { JSX } from "react"
import {
  MarketingRuleGrid,
  MarketingSection,
} from "../design-system/layout"
import {
  AccentSurface,
  CompactDotList,
  ShowcaseSurface,
  SurfaceCard,
} from "../design-system/surfaces"
import {
  AccentBadge,
  BodyText,
  GradientTitle,
  Kicker,
  SectionHeading,
} from "../design-system/typography"
import { SITE_CONFIG } from "../../lib/site-config"

export function HephaestusSection(): JSX.Element {
  const { omoIntro, hephaestus } = SITE_CONFIG

  return (
    <MarketingSection className="mt-24 md:mt-32">
      {/* OmO intro — where LazyCodex comes from */}
      <MarketingRuleGrid>
        <div>
          <Kicker>{omoIntro.kicker}</Kicker>
          <SectionHeading className="text-[clamp(28px,4vw,44px)]">
            {omoIntro.title}
          </SectionHeading>
          <BodyText>{omoIntro.body}</BodyText>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SurfaceCard>
            <h3 className="font-mono text-xs uppercase text-[color:var(--text-tertiary)]">
              {omoIntro.omoLabel}
            </h3>
            <CompactDotList items={omoIntro.omoPoints} />
          </SurfaceCard>
          <AccentSurface>
            <h3 className="font-mono text-xs uppercase text-[color:var(--accent-primary)]">
              {omoIntro.lazyLabel}
            </h3>
            <CompactDotList
              items={omoIntro.lazyPoints}
              dotClassName="bg-[color:var(--accent-primary)]"
            />
          </AccentSurface>
        </div>
      </MarketingRuleGrid>

      {/* Hephaestus — the ported agent. This ShowcaseSurface is the ONE
          intentional dark marketing band on the light canvas (DESIGN.md
          contrast anchor). The light-canvas ink tokens are re-scoped here to
          the dark-window text family (design-system.css dark window block) so
          every inner primitive reads light-on-dark at AA: #e8f0ea/#b8c2bc are
          ~15.7:1/~10:1 and #4ade80 ~10.4:1 against the #101613 band. */}
      <ShowcaseSurface className="mt-16 overflow-hidden text-center md:px-8 [--accent-primary:#4ade80] [--text-muted:#b8c2bc] [--text-primary:#e8f0ea] [--text-tertiary:#b8c2bc]">
        <div className="flex items-center gap-3">
          <AccentBadge>{hephaestus.badge}</AccentBadge>
        </div>

        <GradientTitle className="mt-6 text-[clamp(32px,5vw,56px)] font-semibold tracking-tight">
          {hephaestus.title}
        </GradientTitle>
        <p className="mt-3 text-balance text-xl font-medium text-[color:var(--text-primary)] md:text-2xl">
          {hephaestus.headline}
        </p>
        <p className="mt-5 max-w-[68ch] text-balance text-base leading-relaxed text-[color:var(--text-muted)] md:text-lg">
          {hephaestus.description}
        </p>

        <ol className="mt-12 grid w-full max-w-[960px] grid-cols-2 gap-3 md:grid-cols-5">
          {hephaestus.loop.map((phase, i) => (
            <li
              key={phase.step}
              className="rounded-lg border border-[color:var(--accent-primary)]/20 bg-[color:var(--accent-primary)]/5 p-4 text-center"
            >
              <div className="mb-2 font-mono text-xs text-[color:var(--accent-primary)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="text-sm font-medium text-[color:var(--text-primary)]">{phase.step}</p>
              <p className="mt-1 text-xs leading-snug text-[color:var(--text-muted)]">{phase.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-lg italic text-[color:var(--text-tertiary)]">
          {hephaestus.tagline}
        </p>
      </ShowcaseSurface>
    </MarketingSection>
  )
}

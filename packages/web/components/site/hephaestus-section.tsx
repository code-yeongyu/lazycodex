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
  CardLabel,
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
            <CardLabel>{omoIntro.omoLabel}</CardLabel>
            <CompactDotList items={omoIntro.omoPoints} />
          </SurfaceCard>
          <AccentSurface>
            <CardLabel tone="accent">{omoIntro.lazyLabel}</CardLabel>
            <CompactDotList
              items={omoIntro.lazyPoints}
              dotClassName="bg-[color:var(--accent-primary)]"
            />
          </AccentSurface>
        </div>
      </MarketingRuleGrid>

      {/* Hephaestus — the ported agent. This ShowcaseSurface is an elevated
          showcase band (#16191e + hairline ring) on the dark canvas. The
          global dark ink tokens already read AA here: #f7f8f8/#b4bcc8 are
          ~16:1/~8.8:1 and #4ade80 ~9.5:1 against the #16191e band, so no
          per-band token re-scope is needed. */}
      <ShowcaseSurface className="mt-16 overflow-hidden text-center md:px-8">
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
            <AccentSurface as="li" key={phase.step} padding="p-4" className="text-center">
              <div className="mb-2 font-mono text-xs text-[color:var(--accent-primary)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="text-sm font-medium text-[color:var(--text-primary)]">{phase.step}</p>
              <p className="mt-1 text-xs leading-snug text-[color:var(--text-muted)]">{phase.text}</p>
            </AccentSurface>
          ))}
        </ol>

        <p className="mt-10 text-lg italic text-[color:var(--text-tertiary)]">
          {hephaestus.tagline}
        </p>
      </ShowcaseSurface>
    </MarketingSection>
  )
}

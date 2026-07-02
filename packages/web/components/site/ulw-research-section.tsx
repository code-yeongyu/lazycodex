import type { JSX } from "react"
import { MarketingSection } from "../design-system/layout"
import { AccentSurface } from "../design-system/surfaces"
import { BodyText, Kicker, SectionHeading } from "../design-system/typography"
import { SITE_CONFIG } from "../../lib/site-config"

/**
 * ulw-research — copy grounded in plugins/omo/skills/ulw-research/SKILL.md
 * (see .omo/evidence/copy-ledger.md). Lane chips are informational, not
 * interactive, so they carry no hover states.
 */
export function UlwResearchSection(): JSX.Element {
  const { ulwResearch } = SITE_CONFIG

  return (
    <MarketingSection className="mt-24 md:mt-32">
      <AccentSurface className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
        <div>
          <Kicker>{ulwResearch.kicker}</Kicker>
          <SectionHeading className="text-[clamp(26px,3.5vw,40px)]">
            {ulwResearch.title}
          </SectionHeading>
          <BodyText>{ulwResearch.body}</BodyText>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <ul className="grid grid-cols-2 gap-2">
            {ulwResearch.lanes.map((lane) => (
              <li
                key={lane}
                className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-center font-mono text-xs text-[color:var(--text-secondary)]"
              >
                {lane}
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">
            {ulwResearch.activation}
          </p>
        </div>
      </AccentSurface>
    </MarketingSection>
  )
}

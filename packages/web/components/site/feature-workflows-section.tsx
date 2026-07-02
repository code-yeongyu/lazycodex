import type { JSX } from "react"
import {
  MarketingRuleGrid,
  MarketingSection,
} from "../design-system/layout"
import { AccentSurface, NumberedPoint } from "../design-system/surfaces"
import { BodyText, Kicker, SectionHeading } from "../design-system/typography"
import { SITE_CONFIG } from "../../lib/site-config"

export function FeatureWorkflowsSection(): JSX.Element {
  return (
    <MarketingSection className="mt-24 md:mt-32">
      <MarketingRuleGrid ruleStyle="dotted">
        <div>
          <Kicker>{SITE_CONFIG.featureWorkflows.kicker}</Kicker>
          <SectionHeading serif className="text-[clamp(32px,5vw,56px)]">
            {SITE_CONFIG.featureWorkflows.title}
          </SectionHeading>
          <BodyText>{SITE_CONFIG.featureWorkflows.intro}</BodyText>
        </div>

        <div className="grid gap-3">
          {SITE_CONFIG.featureWorkflows.points.map((point, index) => (
            <NumberedPoint
              key={point.label}
              index={index}
              label={point.label}
              text={point.text}
            />
          ))}
        </div>
      </MarketingRuleGrid>

      <AccentSurface className="mt-6 grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:p-6">
        <div>
          <h2 className="text-2xl font-medium text-[color:var(--text-primary)]">
            {SITE_CONFIG.builtInSkills.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-muted)]">
            {SITE_CONFIG.builtInSkills.summary}
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SITE_CONFIG.builtInSkills.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-3 py-2 font-mono text-xs text-[color:var(--text-secondary)]"
            >
              {skill}
            </li>
          ))}
        </ul>
      </AccentSurface>
    </MarketingSection>
  )
}

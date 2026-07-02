import type { JSX } from "react"
import {
  MarketingContainer,
  MarketingMain,
  PageShell,
  SkipLink,
} from "../components/design-system/layout"
import { CommandCards } from "../components/site/command-cards"
import { DocsCta } from "../components/site/docs-cta"
import { FeatureWorkflowsSection } from "../components/site/feature-workflows-section"
import { HephaestusSection } from "../components/site/hephaestus-section"
import { Hero } from "../components/site/hero"
import { InstallBlock } from "../components/site/install-block"
import { SiteFooter } from "../components/site/site-footer"
import { SiteHeader } from "../components/site/site-header"
import { TeamModeSection } from "../components/site/team-mode-section"
import { UlwDemoSection } from "../components/site/ulw-demo/ulw-demo-section"
import { UlwResearchSection } from "../components/site/ulw-research-section"

export default function LandingPage(): JSX.Element {
  return (
    <PageShell>
      <SkipLink className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[color:var(--card-base)] focus:px-3 focus:py-2 focus:text-sm focus:text-[color:var(--text-primary)]" />

      <SiteHeader />

      <MarketingMain>
        <MarketingContainer>
          <Hero />
        </MarketingContainer>
        <UlwDemoSection />
        <InstallBlock />
        <CommandCards />
        <FeatureWorkflowsSection />
        <TeamModeSection />
        <UlwResearchSection />
        <HephaestusSection />
        <DocsCta />
      </MarketingMain>

      <SiteFooter />
    </PageShell>
  )
}

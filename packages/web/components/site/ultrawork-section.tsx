import type { JSX } from "react"
import { MarketingSection } from "../design-system/layout"
import { ShowcaseSurface } from "../design-system/surfaces"
import { GradientTitle } from "../design-system/typography"
import { BrandImage } from "./brand-image"

/**
 * The glassy Ultrawork badge showcase — the original identity moment,
 * restored per user direction. The live demo owns the tagline/example
 * copy now, so this section is purely the brand artifact.
 */
export function UltraworkSection(): JSX.Element {
  return (
    <MarketingSection className="mt-32 flex flex-col items-center text-center md:mt-40">
      <ShowcaseSurface className="max-w-[960px]">
        <GradientTitle
          className="mb-12 text-center text-[clamp(28px,4vw,48px)] font-semibold tracking-tight opacity-90"
        >
          Ultrawork
        </GradientTitle>

        <BrandImage
          src="/img/badge-ultrawork.png"
          alt="Ultrawork"
          width={897}
          height={512}
          className="h-auto w-full max-w-[560px]"
        />
      </ShowcaseSurface>
    </MarketingSection>
  )
}

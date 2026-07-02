import type { JSX } from "react"
import { CommandCodeSurface } from "../design-system/surfaces"
import { InlineCode } from "../design-system/typography"
import { SITE_CONFIG } from "../../lib/site-config"
import { CopyButton } from "./copy-button"

export function InstallBlock(): JSX.Element {
  return (
    <section className="mx-auto mt-8 flex w-full max-w-2xl flex-col items-center gap-4 px-4 md:mt-10">
      <div className="w-full rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--card-base)] p-2 shadow-sm">
        <CommandCodeSurface>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto pl-1">
              <span
                className="select-none font-mono text-[color:var(--accent-mint)]"
                aria-hidden="true"
              >
                $
              </span>
              <InlineCode className="whitespace-nowrap text-sm md:text-base">
                {SITE_CONFIG.installCommand}
              </InlineCode>
            </div>
            <CopyButton value={SITE_CONFIG.installCommand} className="ml-4 shrink-0" />
          </div>
        </CommandCodeSurface>
      </div>

      <div className="flex flex-col items-center gap-1 text-center text-sm">
        <p className="font-mono text-xs text-[color:var(--text-tertiary)]">
          = {SITE_CONFIG.installEquivalent}
        </p>
      </div>
    </section>
  )
}

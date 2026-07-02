import type { JSX } from "react"
import { MarketingRuleGrid, MarketingSection } from "../design-system/layout"
import { SurfaceCard } from "../design-system/surfaces"
import { BodyText, Kicker, SectionHeading } from "../design-system/typography"
import { SITE_CONFIG } from "../../lib/site-config"

/**
 * Team Mode — copy grounded in plugins/omo/skills/teammode/SKILL.md and the
 * recorded Codex Desktop team session (see .omo/evidence/copy-ledger.md).
 * The thread mock reuses the Codex window adapter tokens; rows are not
 * interactive, so they carry no hover states.
 */
export function TeamModeSection(): JSX.Element {
  const { teamMode } = SITE_CONFIG

  return (
    <MarketingSection className="mt-24 md:mt-32">
      <MarketingRuleGrid>
        <div>
          <Kicker>{teamMode.kicker}</Kicker>
          <SectionHeading className="text-[clamp(28px,4vw,44px)]">
            {teamMode.title}
          </SectionHeading>
          <BodyText>{teamMode.body}</BodyText>
          <p className="mt-4 text-sm leading-relaxed text-[color:var(--text-tertiary)]">
            {teamMode.compositionRule}
          </p>
          <p className="mt-2 font-mono text-xs text-[color:var(--text-tertiary)]">
            {teamMode.stateNote}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="ulw-window" aria-label="Team mode member threads">
            <div className="ulw-titlebar">
              <span className="ulw-traffic" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <div className="ulw-window-tabs" aria-hidden="true">
                <span className="ulw-window-tab" data-current="true">
                  Leader — main session
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {teamMode.memberThreads.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--codex-window-border)] px-3 py-2"
                >
                  <span className="min-w-0 truncate text-[12.5px] font-medium text-[color:var(--codex-window-text)]">
                    {member.name}
                  </span>
                  <span className="whitespace-nowrap font-mono text-[10px] text-[color:var(--codex-window-text-soft)]">
                    {member.status}
                  </span>
                </div>
              ))}
              <div className="mt-1 rounded-lg bg-[color:var(--codex-window-chip)] px-3 py-2">
                <p className="text-right font-mono text-[10px] text-[color:var(--codex-window-text-soft)]">
                  {teamMode.threadNote}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-[color:var(--codex-window-text)]">
                  Member A COMPLETE verification note: report exists, pinned-link
                  check passed, and no GitHub mutations/repo edits.
                </p>
              </div>
            </div>
          </div>

          <SurfaceCard>
            <h3 className="font-mono text-xs uppercase text-[color:var(--text-tertiary)]">
              {teamMode.whenTitle}
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {teamMode.whenPoints.map((point) => (
                <li
                  key={point}
                  className="flex gap-2 text-sm leading-relaxed text-[color:var(--text-muted)]"
                >
                  <span
                    className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent-primary)]"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      </MarketingRuleGrid>
    </MarketingSection>
  )
}

import type { JSX } from "react"
import { GlowActionFrame, LinkAction } from "../design-system/actions"
import { SITE_CONFIG } from "../../lib/site-config"

export function DocsCta(): JSX.Element {
  return (
    <section className="mx-auto mt-32 mb-24 flex w-full max-w-[800px] flex-col items-center rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-panel)] px-6 py-16 text-center md:mt-40 md:px-12 relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border-[1.5px] border-[color:var(--accent-primary-border)]" />

      <h2 className="relative z-10 text-3xl font-medium tracking-tight text-[color:var(--text-primary)]">
        Ready to wire the harness?
      </h2>
      <p className="relative z-10 mt-4 text-lg text-[color:var(--text-muted)]">
        Install the Codex setup, then run the workflows that keep large changes under control.
      </p>
      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-4">
        <GlowActionFrame>
          <LinkAction href={SITE_CONFIG.docsPath} variant="primary">
            Read the Docs
          </LinkAction>
        </GlowActionFrame>
        <LinkAction href={`${SITE_CONFIG.docsPath}#ulw-loop`}>
          How Ultrawork works
        </LinkAction>
      </div>
    </section>
  )
}

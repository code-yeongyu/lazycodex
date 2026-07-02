import type { JSX } from "react"
import {
  CommandCodeSurface,
  FactList,
  IconWell,
} from "../design-system/surfaces"
import type { LazyCommand } from "../../lib/commands"

interface CommandCardProps {
  readonly command: LazyCommand
}

function GlyphIcon({ type }: { readonly type: LazyCommand["glyph"] }): JSX.Element {
  switch (type) {
    case "loop":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
        </svg>
      )
    case "plan":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    case "work":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    default:
      return <></>
  }
}

export function CommandCard({ command }: CommandCardProps): JSX.Element {
  // No hover state: the card itself carries no action (DESIGN.md §6).
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[color:var(--surface-panel)] p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <IconWell>
          <GlyphIcon type={command.glyph} />
        </IconWell>
        <h2 className="font-mono text-lg font-semibold text-[color:var(--text-primary)]">
          {command.name}
        </h2>
      </header>

      <CommandCodeSurface>
        <code className="block overflow-x-auto whitespace-nowrap font-mono text-sm text-[color:var(--text-secondary)] [mask-image:linear-gradient(90deg,#000_calc(100%-20px),transparent)]">
          {command.syntax}
        </code>
      </CommandCodeSurface>

      <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">
        {command.summary}
      </p>

      <FactList items={command.facts} />
    </article>
  )
}

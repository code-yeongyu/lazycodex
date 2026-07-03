import type { JSX, ReactNode } from "react"
import { cx } from "./utils"

interface ChildrenProps {
  readonly children: ReactNode
  readonly className?: string
}

interface ChildrenOnlyProps {
  readonly children: ReactNode
}

interface AccentSurfaceProps extends ChildrenProps {
  readonly as?: "div" | "li"
  readonly padding?: string
}

interface FactListProps {
  readonly items: readonly string[]
  readonly dotClassName?: string
}

interface NumberedPointProps {
  readonly index: number
  readonly label: string
  readonly text: string
}

export function SurfaceCard({ children, className }: ChildrenProps): JSX.Element {
  return (
    <div
      className={cx(
        "rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--card-base)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AccentSurface({
  children,
  className,
  as: Tag = "div",
  padding = "p-5",
}: AccentSurfaceProps): JSX.Element {
  return (
    <Tag
      className={cx(
        "rounded-lg border border-[color:var(--accent-primary)]/20 bg-[color:var(--accent-primary)]/5",
        padding,
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function ShowcaseSurface({ children, className }: ChildrenProps): JSX.Element {
  return (
    <div
      className={cx(
        "relative flex w-full flex-col items-center rounded-3xl bg-[#16191e] px-4 py-16 shadow-2xl ring-1 ring-white/10",
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.08)_0%,transparent_70%)] blur-3xl" />
      {children}
    </div>
  )
}

export function CommandCodeSurface({ children }: ChildrenOnlyProps): JSX.Element {
  return <div className="rounded-md bg-[#1b1f24] p-3 text-[#dcfce7] ring-1 ring-white/10">{children}</div>
}

export function IconWell({ children }: ChildrenOnlyProps): JSX.Element {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]">
      {children}
    </div>
  )
}

export function FactList({
  items,
  dotClassName = "bg-[color:var(--accent-primary)]",
}: FactListProps): JSX.Element {
  return (
    <ul className="mt-auto flex flex-col gap-2 pt-4">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-sm text-[color:var(--text-tertiary)]"
        >
          <span
            className={cx("mt-1 block h-1.5 w-1.5 shrink-0 rounded-full", dotClassName)}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function CompactDotList({
  items,
  dotClassName = "bg-[color:var(--border-default)]",
}: FactListProps): JSX.Element {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-[color:var(--text-muted)]">
          <span
            className={cx("mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full", dotClassName)}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function MonoTag({ children, className }: ChildrenProps): JSX.Element {
  return (
    <li
      className={cx(
        "rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-3 py-2 font-mono text-xs text-[color:var(--text-secondary)]",
        className,
      )}
    >
      {children}
    </li>
  )
}

export function NumberedPoint({ index, label, text }: NumberedPointProps): JSX.Element {
  return (
    <div className="grid gap-4 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--card-base)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.4)] md:grid-cols-[72px_1fr]">
      <span className="font-mono text-xs uppercase text-[color:var(--text-tertiary)]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div>
        <h3 className="text-lg font-medium text-[color:var(--text-primary)]">{label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--text-muted)]">{text}</p>
      </div>
    </div>
  )
}

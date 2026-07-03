import type { JSX, ReactNode } from "react"
import { cx } from "./utils"

interface ChildrenProps {
  readonly children: ReactNode
}

interface ClassNameProps extends ChildrenProps {
  readonly className?: string
}

interface SkipLinkProps {
  readonly className?: string
}

export function PageShell({ children }: ChildrenProps): JSX.Element {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      {/* Atmosphere backdrop: static low-alpha green glows behind everything.
          Absolute + pointer-events-none — zero layout cost, no CLS. */}
      <div aria-hidden className="glow-backdrop pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-[100dvh] flex-col">{children}</div>
    </div>
  )
}

export function SkipLink({ className = "skip-link" }: SkipLinkProps): JSX.Element {
  return (
    <a href="#content" className={className}>
      Skip to main content
    </a>
  )
}

export function MarketingMain({ children }: ChildrenProps): JSX.Element {
  return (
    <main id="content" className="flex-1 pb-16 pt-6 md:pt-8">
      {children}
    </main>
  )
}

export function MarketingContainer({
  children,
  className,
}: ClassNameProps): JSX.Element {
  return (
    <div className={cx("mx-auto max-w-[1200px] px-4 md:px-8", className)}>
      {children}
    </div>
  )
}

export function MarketingSection({
  children,
  className,
}: ClassNameProps): JSX.Element {
  return (
    <section className={cx("mx-auto w-full max-w-[1200px] px-4 md:px-8", className)}>
      {children}
    </section>
  )
}

interface MarketingRuleGridProps extends ChildrenProps {
  readonly ruleStyle?: "solid" | "dotted"
}

export function MarketingRuleGrid({
  children,
  ruleStyle = "solid",
}: MarketingRuleGridProps): JSX.Element {
  return (
    <div
      className={cx(
        "grid gap-8 border-y border-[color:var(--border-subtle)] py-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:py-16",
        ruleStyle === "dotted" && "rule-grid-dotted",
      )}
    >
      {children}
    </div>
  )
}

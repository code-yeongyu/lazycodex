import type { JSX, ReactNode } from "react"
import { cx } from "./utils"

interface ChildrenProps {
  readonly children: ReactNode
}

interface ClassNameProps extends ChildrenProps {
  readonly className?: string
}

interface SectionProps extends ClassNameProps {
  readonly id?: string
}

interface SkipLinkProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly href?: string
}

export function PageShell({ children }: ChildrenProps): JSX.Element {
  return <div className="flex min-h-[100dvh] flex-col">{children}</div>
}

export function SkipLink({
  children = "Skip to main content",
  className = "skip-link",
  href = "#content",
}: SkipLinkProps): JSX.Element {
  return (
    <a href={href} className={className}>
      {children}
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
  id,
}: SectionProps): JSX.Element {
  return (
    <section id={id} className={cx("mx-auto w-full max-w-[1200px] px-4 md:px-8", className)}>
      {children}
    </section>
  )
}

export function MarketingRuleGrid({ children }: ChildrenProps): JSX.Element {
  return (
    <div className="grid gap-8 border-y border-white/10 py-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:py-16">
      {children}
    </div>
  )
}

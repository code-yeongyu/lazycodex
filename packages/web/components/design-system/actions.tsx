import type { JSX, ReactNode } from "react"
import Link from "next/link"
import { cx } from "./utils"

interface LinkActionProps {
  readonly children: ReactNode
  readonly className?: string
  readonly href: string
  readonly prefetch?: false
  readonly variant?: "primary" | "secondary"
}

const actionClassName = {
  primary:
    "relative block rounded-md bg-[color:var(--text-primary)] px-6 py-3 font-medium text-[color:var(--surface-base)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-panel)]",
  secondary:
    "rounded-md border border-[color:var(--border-default)] bg-transparent px-6 py-3 font-medium text-[color:var(--text-primary)] transition-colors hover:bg-[color:var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-panel)]",
} as const

export function LinkAction({
  children,
  className,
  href,
  prefetch = false,
  variant = "secondary",
}: LinkActionProps): JSX.Element {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cx(actionClassName[variant], className)}
    >
      {children}
    </Link>
  )
}

export function GlowActionFrame({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 rounded-lg bg-[color:var(--accent-mint)] opacity-40 blur-xl transition-opacity group-hover:opacity-50" />
      {children}
    </div>
  )
}

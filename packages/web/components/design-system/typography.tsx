import type { CSSProperties, JSX, ReactNode } from "react"
import { cx } from "./utils"

const gradientTextStyle = {
  background: "linear-gradient(180deg, #86efac 0%, #4ade80 50%, #22c55e 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} satisfies CSSProperties

interface TextProps {
  readonly children: ReactNode
  readonly className?: string
}

export function Kicker({ children, className }: TextProps): JSX.Element {
  return (
    <p
      className={cx(
        "font-mono text-xs uppercase text-[color:var(--accent-primary)]",
        className,
      )}
    >
      {children}
    </p>
  )
}

interface SectionHeadingProps extends TextProps {
  readonly serif?: boolean
}

export function SectionHeading({
  children,
  className,
  serif = false,
}: SectionHeadingProps): JSX.Element {
  return (
    <h2
      className={cx(
        "mt-4 text-balance font-medium leading-tight text-[color:var(--text-primary)]",
        serif && "font-[family-name:var(--font-serif)]",
        className,
      )}
    >
      {children}
    </h2>
  )
}

export function BodyText({ children, className }: TextProps): JSX.Element {
  return (
    <p
      className={cx(
        "mt-6 max-w-[58ch] text-base leading-relaxed text-[color:var(--text-muted)] md:text-lg",
        className,
      )}
    >
      {children}
    </p>
  )
}

export function GradientTitle({ children, className }: TextProps): JSX.Element {
  return (
    <h3 className={className} style={gradientTextStyle}>
      {children}
    </h3>
  )
}

export function AccentBadge({ children, className }: TextProps): JSX.Element {
  return (
    <span
      className={cx(
        "rounded-full border border-[color:var(--accent-primary)]/30 bg-[color:var(--accent-primary)]/10 px-3 py-1 font-mono text-xs text-[color:var(--accent-primary)]",
        className,
      )}
    >
      {children}
    </span>
  )
}

const cardLabelTone = {
  default: "text-[color:var(--text-tertiary)]",
  accent: "text-[color:var(--accent-primary)]",
} as const

interface CardLabelProps {
  readonly children: ReactNode
  readonly tone?: keyof typeof cardLabelTone
}

export function CardLabel({ children, tone = "default" }: CardLabelProps): JSX.Element {
  return <h3 className={cx("font-mono text-xs uppercase", cardLabelTone[tone])}>{children}</h3>
}

export function InlineCode({ children, className }: TextProps): JSX.Element {
  return (
    <code className={cx("font-mono font-medium", className)}>
      {children}
    </code>
  )
}

import type { JSX } from "react"
import { cx } from "./utils"

interface BrandMarkProps {
  readonly className?: string
  readonly dotFill?: string
  readonly size?: "nav" | "hero"
}

const markGeometry = {
  nav: {
    circle: { cx: "15.6", cy: "9", r: "1.6" },
    path: "M8 9 V15.2 H14.6",
    rect: { size: "17.6", x: "3.2", y: "3.2", rx: "4.4" },
    strokeWidth: "1.3",
    width: "24",
  },
  hero: {
    circle: { cx: "15.8", cy: "8", r: "1.4" },
    path: "M7 8 V16 H14.5",
    rect: { size: "19.2", x: "2.4", y: "2.4", rx: "4.8" },
    strokeWidth: "1",
    width: "160",
  },
} as const

export function BrandMark({
  className,
  dotFill = "var(--accent-mint)",
  size = "nav",
}: BrandMarkProps): JSX.Element {
  const geometry = markGeometry[size]

  return (
    <svg
      width={geometry.width}
      height={geometry.width}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x={geometry.rect.x}
        y={geometry.rect.y}
        width={geometry.rect.size}
        height={geometry.rect.size}
        rx={geometry.rect.rx}
        fill="var(--card-base)"
        stroke="var(--accent-primary)"
        strokeWidth={geometry.strokeWidth}
      />
      <path
        d={geometry.path}
        fill="none"
        stroke={size === "hero" ? "var(--accent-mint)" : "var(--accent-primary)"}
        strokeWidth={size === "hero" ? "1.4" : "1.7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={geometry.circle.cx}
        cy={geometry.circle.cy}
        r={geometry.circle.r}
        fill={dotFill}
      />
    </svg>
  )
}

export function HeroBrandMark(): JSX.Element {
  return (
    <div className="relative flex h-[180px] w-[180px] items-center justify-center md:h-[220px] md:w-[220px]">
      <div
        className="absolute inset-0 rounded-[28px] opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(21,128,61,0.25) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <BrandMark
        size="hero"
        dotFill="var(--accent-primary)"
        className={cx("relative h-[140px] w-[140px] md:h-[160px] md:w-[160px]")}
      />
    </div>
  )
}

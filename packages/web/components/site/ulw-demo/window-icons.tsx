import type { JSX } from "react"

/**
 * Minimal stroke-only SVG glyphs for the Codex-window demo. Decorative
 * (aria-hidden), currentColor, sized by the surrounding chrome — anatomy
 * mirrors the small nav/tool glyphs in .omo/reference/app-frames/creation-03.png.
 */

const ICON_PATHS = {
  compose:
    "M9 3H4a1.5 1.5 0 0 0-1.5 1.5V12A1.5 1.5 0 0 0 4 13.5h7.5A1.5 1.5 0 0 0 13 12V7M13.2 2.8a1.4 1.4 0 0 0-2 0L6.5 7.5 6 10l2.5-.5 4.7-4.7a1.4 1.4 0 0 0 0-2Z",
  search: "M12.5 12.5 10 10M11 6.75a4.25 4.25 0 1 1-8.5 0 4.25 4.25 0 0 1 8.5 0Z",
  plugins: "M3 3h4v4H3ZM9 3h4v4H9ZM3 9h4v4H3ZM9 9h4v4H9Z",
  clock: "M8 4.5V8l2.3 1.4M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z",
  folder:
    "M2.5 4A1.5 1.5 0 0 1 4 2.5h2.6l1.5 1.7H12A1.5 1.5 0 0 1 13.5 5.7V11A1.5 1.5 0 0 1 12 12.5H4A1.5 1.5 0 0 1 2.5 11Z",
  terminal:
    "M3 2.5h10A1.5 1.5 0 0 1 14.5 4v8a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 12V4A1.5 1.5 0 0 1 3 2.5ZM4.5 6l2 2-2 2M8.5 10.5h3",
  agent: "M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.8 13.5a5.3 5.3 0 0 1 10.4 0",
  check: "M2.5 8.5 6 12l7.5-8",
  target: "M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z",
  alert:
    "M8 6v3.2M8 11.4v.2M7 2.8 1.8 12a1.2 1.2 0 0 0 1 1.8h10.4a1.2 1.2 0 0 0 1-1.8L9 2.8a1.2 1.2 0 0 0-2 0Z",
  plus: "M8 3.5v9M3.5 8h9",
  mic: "M8 10.5A2.5 2.5 0 0 0 10.5 8V4.5a2.5 2.5 0 0 0-5 0V8A2.5 2.5 0 0 0 8 10.5ZM12.5 8a4.5 4.5 0 0 1-9 0M8 12.5V14",
  "arrow-up": "M8 12.5v-9M4.5 7 8 3.5 11.5 7",
  play: "M5.5 3.5v9l7-4.5Z",
  pause: "M6 4v8M10 4v8",
  replay: "M2.5 8a5.5 5.5 0 1 0 1.7-4M4 2.5v2.8h2.8",
  moon: "M13.2 9.7A5.7 5.7 0 1 1 6.3 2.8a4.6 4.6 0 0 0 6.9 6.9Z",
} as const

export type UlwIconName = keyof typeof ICON_PATHS

export function UlwIcon({ name }: { readonly name: UlwIconName }): JSX.Element {
  return (
    <svg
      className="ulw-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

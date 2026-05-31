/**
 * Twitter card image. Shares the same renderer + font as the OG image, but
 * the per-route config fields must be exported INLINE — Next.js does not
 * follow re-exported `runtime` / `size` / `contentType` symbols and would
 * emit "can't recognize the exported X field" warnings during build.
 */
export { default } from "./opengraph-image"

export const runtime = "nodejs"
export const alt = "LazyCodex AI splash — Codex for no-brainers. Coming June 2026."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

# LazyCodex Design System

## 1. Core Philosophy
- **Complex-Codebase Harness Tone**: A near-black canvas with a faint cool-green undertone, centered on a glowing emerald card that presents LazyCodex as the Codex agent harness for serious repositories. The brand color is green — emerald/mint — not the earlier teal.
- **Card-in-Canvas Architecture**: The hero content lives inside a 1200x630px card with a complex radial gradient; the OpenGraph image mirrors that HTML card instead of using a separate visual language.
- **Typography**: A native system grotesk (`ui-sans-serif, system-ui, …`) for the wordmark and body so the LCP paint has zero webfont dependency and lands at FCP; monospace (`ui-monospace, …`) for eyebrows, code, labels, and kbd hints.

## 2. Color Palette
Surfaces (near-black, cool-green undertone):
- `--surface-base` / `--surface-night` / `--surface-0`: `#0a0c0b`
- `--surface-1`: `rgba(255,255,255,0.018)` · `--surface-2`: `rgba(255,255,255,0.035)` · `--surface-3`: `rgba(255,255,255,0.055)`
- `--card-base` / `--surface-panel`: `#0E1411` · `--surface-panel-alt`: `#0C1310` · `--surface-panel-deep`: `#0D1310`

Brand (emerald core):
- `--brand-core`: `#10b981` · `--brand-mid`: `#059669` · `--brand-outer`: `#065f46`

Accent (the live-wire green):
- `--accent-primary`: `#34d399` · `--accent-primary-soft`: `rgba(52,211,153,0.1)` · `--accent-primary-border`: `rgba(52,211,153,0.22)`
- `--accent-mint`: `#6ee7b7` · `--accent-glow`: `#6ee7b7`
- Legacy aliases `--accent-cyan` / `--accent-teal` are mapped to the green values for compatibility; new code uses `--accent-primary` / `--accent-mint`.

Text:
- `--text-primary`: `#ffffff` · `--text-secondary`: `#9aa6a0` · `--text-tertiary`: `#7a857f`
- `--text-muted`: `rgba(255,255,255,0.72)` · `--text-soft`: `#d1fae5` (mint-tinted)

Borders / status:
- `--border-subtle`: `rgba(255,255,255,0.06)` · `--border-default`: `rgba(255,255,255,0.1)`
- `--status-success`: `#10b981` · `--status-warning`: `#f59e0b` · `--status-error`: `#ef4444`

## 3. Brand Mark
- A rounded-square emerald mark with an "L" stroke and a mint dot — a clean geometric identity replacing the earlier boulder. Inline SVG in the header (zero network bytes), mirrored in the favicon and OG image.
- `app/icon.svg` is the canonical scalable favicon; `app/apple-icon.png` at 180x180 for Apple touch surfaces.

## 4. Layout & Spacing
- **Landing canvas**: Full viewport (`min-h-[100dvh]`), flex column, centered. Hero card max width 1200px, aspect ratio 1200/630 on large screens, `16px` radius.
- **Docs**: three-column grid on desktop — `260px` sidebar | fluid content | `220px` right ToC. Collapses to two columns (hide ToC) under 1100px and to a single column with a mobile menu toggle under 768px. Every container uses `min-h-[100dvh]` (never `h-screen`) and `dvh` for iOS Safari stability. No flexbox percentage math; CSS Grid for multi-column.

## 5. Gradients & Effects
- **Base Gradient**: radial from `#10b981` through `#059669` and `#065f46` into `#0a0c0b`.
- **Beam**: screen blend mode, soft mint light pouring from top-left.
- **Sheen**: screen blend mode, diagonal linear gradients with blur.
- **Pools**: screen blend mode, subtle emerald/mint pools at bottom-left and top-right.

## 6. Docs Information Architecture (vibetip-inspired)
The docs are a single richly-sectioned page with a grouped sidebar, ⌘K search, a per-section right-side table of contents, and prev/next navigation cards — inspired by the lzx.vibetip.help docs layout.

- **Sidebar groups** (ordered): Install · Getting started · Commands · Skills · Concepts · Reference.
- **⌘K / Ctrl-K** focuses the search field from anywhere; typing filters sidebar entries by title.
- **Right ToC ("On this section")** lists the active section's `h2`/`h3` headings with scroll-spy highlighting.
- **Prev/next cards** at the end of every section link to the neighboring section.
- **Docs hero** carries a version badge (`SITE_CONFIG.version`), title, and tagline.
- Content is authored as `content/docs/*.md`, compiled to HTML at build time by `scripts/generate-docs-content.mjs`, which also injects heading ids and emits a per-section TOC (`DOC_TOC`) alongside `DOC_SOURCES`.

## 7. Motion
- Hero uses a `splash-reveal` keyframe (opacity + translate) gated by `prefers-reduced-motion`.
- All interactive transitions (nav links, ToC links, prev/next cards, buttons) are short color/transform tweens, disabled under `prefers-reduced-motion`. No layout-property animation; no full `framer-motion` import.

## 8. Performance & SEO Posture
- System font stack for the LCP wordmark so the largest paint has no webfont download and lands at FCP under any throttle.
- Image-free hero (pure CSS gradients) keeps the hero text as the LCP element.
- Explicit `width`/`height` on every `<img>` to prevent CLS; `loading`/`fetchPriority`/`decoding` driven by `priority`.
- Per-route `metadata`, JSON-LD `SoftwareApplication`, `sitemap.ts`, `robots.ts`, and OG/Twitter image routes.

## 9. Anti-Patterns
- Generic AI-SaaS slop copy. Use concrete product language.
- Teal/cyan brand colors (replaced by emerald/mint). The earlier teal identity is gone; green is the brand.
- `export const runtime = "edge"` (incompatible with `@opennextjs/cloudflare`).
- Animating `width / height / top / left / margin / padding`.
- Importing the full `framer-motion` package.

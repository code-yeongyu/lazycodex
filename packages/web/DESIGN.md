# LazyCodex AI Design System

## 1. Core Philosophy
- **Codex-tone Luminous Backdrop**: The page uses a dark navy canvas (`#14154d`) with a centered, glowing card.
- **Card-in-Canvas Architecture**: The main content lives inside a 1200x630px card with a complex radial gradient, mimicking the OpenGraph image.
- **Typography**: Clean, geometric sans-serif (Geist Sans) for the wordmark and tagline, with monospace (Geist Mono) for eyebrows and footers.

## 2. Color Palette
- `--surface-base`: `#14154d` (Dark navy canvas)
- `--card-base`: `#2a2dbf` (Card base color)
- `--brand-core`: `#5a5fef` (Gradient core)
- `--brand-mid`: `#3236c4` (Gradient mid)
- `--brand-outer`: `#232897` (Gradient outer)
- `--text-primary`: `#ffffff` (White)
- `--text-secondary`: `#dcdcf8` (Light lavender)
- `--text-tertiary`: `#b9bce6` (Muted lavender)
- `--text-muted`: `rgba(255, 255, 255, 0.72)` (Translucent white)
- `--text-soft`: `#e8e8ff` (Soft white)

## 3. Typography Scale
- **Wordmark**: `clamp(64px, 12vw, 168px)`, medium weight, tight tracking (`-0.03em`).
- **Tagline**: `clamp(20px, 3vw, 34px)`, normal weight, tight tracking (`-0.005em`).
- **Eyebrow**: `15px`, medium weight, wide tracking (`0.32em`), uppercase, monospace.
- **Footer URL**: `22px`, medium weight, tracking (`0.02em`), monospace.

## 4. Layout & Spacing
- **Canvas**: Full viewport (`min-h-[100dvh]`), flex column, centered.
- **Card**: Max width 1200px, aspect ratio 1200/630 on large screens. Rounded corners (`16px`).
- **Outer Elements**: "OmO in Codex" (top-left) and "Coming June 2026" (bottom-right) are positioned absolutely on the canvas, outside the card, to preserve the card's exact visual match with the reference.

## 5. Gradients & Effects
- **Base Gradient**: Radial gradient from `#5a5fef` to `#232897`.
- **Beam**: Screen blend mode, soft white light pouring from top-left.
- **Sheen**: Screen blend mode, diagonal linear gradients with blur.
- **Pools**: Screen blend mode, subtle violet pools at bottom-left and top-right.
- **Grain**: Overlay blend mode, SVG fractal noise.

## 6. Co-brand layer (Sisyphus Labs)

Sisyphus Labs colors are used as accents across the landing page while the navy Codex card stays the hero centerpiece.

- **Cyan**: `#87F0F2`
- **Teal**: `#008385`
- **Mint**: `#B3FEFF`
- **Glow**: `#ABF5F7`
- **Night**: `#0A0A0A`
- **Panel**: `#0E1115`

Where they appear:
- GitHub stars pill in the sticky header
- Command-card accents (borders, icons, hover states)
- The `ultrawork` keyword glow inside the hero tagline
- CTA and link accents (hover underlines, button fills)
- Footer co-brand strip

## 7. Landing IA

The landing page is a single scrollable document with the following sections, top to bottom:

1. **Sticky header**
   - Boulder mark (small, 32px) + wordmark
   - GitHub stars pill (Sisyphus Labs cyan accent)
   - "Docs" link
   - "by Sisyphus Labs" co-brand

2. **Hero navy card**
   - Eyebrow: "LAZYCODEX AI"
   - H1 wordmark
   - Tagline: "You don't need to ultrathink. / Just prompt {your prompt} ultrawork."
   - The `{your prompt}` placeholder uses Geist Mono and pulses subtly

3. **Install block**
   - Copyable bash snippet: `bunx lazycodex-ai install`
   - One-line note: "No global install. Always `bunx`."
   - Secondary line for the autonomous variant: `bunx lazycodex-ai install --no-tui --codex-autonomous`

4. **Three command cards**
   - `$ulw-loop` — self-referential loop
   - `$ulw-plan` — Prometheus planner
   - `$start-work` — plan executor
   - Each card has a monospace command header, a one-line description, and a syntax example

5. **Ultrawork explainer**
   - Short paragraph on what `ultrawork` means (OmO discipline mode, parallel agents, auto-verification)
   - Link to the docs deep-dive

6. **Docs CTA**
   - Large button: "Read the docs"
   - Secondary link: "View on GitHub"

7. **Footer**
   - Sisyphus Labs co-brand strip (night + panel colors)
   - Links: GitHub, OmO, sisyphuslabs.ai
   - MIT license note

## 8. Docs system

- **Markdown source**: `content/docs/*.md`
- **Build-time compilation**: `marked` parses each `.md` file into HTML strings and TypeScript exports at `lib/docs-content.generated.ts`
- **Static navigation**: `lib/docs-sections.ts` defines the section order, slugs, and titles; no runtime file-system access
- **Server rendering**: Each docs page is server-rendered (SSR) so the content is readable with JavaScript disabled
- **Client docs-shell**: A lean React layer adds:
  - Search (filters sections by title and heading text)
  - Scroll-spy (highlights the current heading in the nav)
  - Mobile menu (collapsible section list)

## 9. Image pipeline

- **Boulder art**: Generated via `imagegen` on a chroma background, keyed to alpha so it composites cleanly on the navy canvas without a visible bounding box
- **Delivery format**: Served as AVIF / WebP / PNG via a `<picture>` element using the `BrandImage` component
- **Dimensions**: Explicit `width` and `height` attributes on every image to prevent CLS
- **Favicon / app-icon**: The rock boulder is reused as the site favicon and Apple touch icon:
  - `app/icon.png`
  - `app/apple-icon.png`

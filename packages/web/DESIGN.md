# LazyCodex Web — Design System

> **Coming-soon splash, build 2026-05.** Single route: `/`. The page mirrors the LazyCodex brand PNG: top-left OmO provenance, centered eyebrow, huge wordmark, two-line tagline, and bottom domain.

## 1. Atmosphere & Identity

LazyCodex is a quiet 4K brand splash, not a marketing landing page. The mood is a deep indigo Codex screen with a low-centered electric violet bloom. The wordmark owns the page; everything else is supporting metadata.

Required visible copy:

- `OmO in Codex`
- `CODEX FOR NO-BRAINERS`
- `LazyCodex`
- `You don't need to think.` / `Just prompt with ultrawork.`
- `Coming June 2026 · Currently on OpenCode`
- `lazycodex.ai`

No feature grid, no install command, no CTA, no footer link cluster.

## 2. Color

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Surface / base | `--surface-base` | `#2a2dbf` | Body fallback and icon base |
| Gradient / core | `--brand-core` | `#5a5fef` | Radial center stop |
| Gradient / mid | `--brand-mid` | `#3236c4` | 60% radial stop |
| Gradient / outer | `--brand-outer` | `#232897` | 100% radial stop |
| Text / primary | `--text-primary` | `#ffffff` | Wordmark, eyebrow, footer, emphasis |
| Text / secondary | `--text-secondary` | `#dcdcf8` | Large tagline and launch metadata |
| Text / tertiary | `--text-tertiary` | `#b9bce6` | Top-left secondary text |

Background CSS must mirror the reference SVG:

```css
radial-gradient(ellipse 80% 60% at 50% 65%, #5a5fef 0%, #3236c4 60%, #232897 100%)
```

Contrast checks:

- `#ffffff` on `#5a5fef` = 4.9:1, AA for normal text.
- `#dcdcf8` on `#3236c4` = 6.5:1; on `#232897` = 8.5:1; near the core it remains AA for the large tagline.
- `#b9bce6` is used only in the top-left over the darker outer gradient, where it is ≥ 6:1.

## 3. Typography

Primary sans: `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif`.
Mono: `var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace`.

Font choice: the reference uses Pretendard, but the site keeps Geist because it is already installed, self-hosted through the existing `geist` package, and preserves zero new font bytes. The splash match comes from weight, scale, and tracking: medium display weight, strong negative wordmark tracking, and wide uppercase eyebrow tracking.

| Level | Size | Weight | Tracking | Usage |
| --- | --- | --- | --- | --- |
| Corner | `clamp(12px, 1.2vw, 14px)` | 400/600 | `-0.01em` | `OmO in Codex` |
| Metadata | `clamp(10px, 0.95vw, 12px)` | 500 | `0.18em` | Launch/OpenCode line |
| Eyebrow | `clamp(11px, 1.1vw, 14px)` | 500 | `0.22em` | `CODEX FOR NO-BRAINERS` |
| Wordmark | `clamp(64px, 12vw, 180px)` | 500 | `-0.04em` | `LazyCodex` |
| Tagline | `clamp(18px, 2.2vw, 36px)` | 400/700 | `-0.015em` | Two-line promise |
| Footer | `clamp(14px, 1.4vw, 18px)` | 600 | `0.08em` | `lazycodex.ai` |

## 4. Layout & Spacing

Mobile-first one-screen composition:

- Canvas: `min-height: 100dvh`, centered flex stack, `overflow-hidden` to prevent tiny horizontal scroll from the display type.
- Top-left mark: `top/left: clamp(16px, 3vw, 32px)`.
- Center stack: vertical center, no max-width card, no glass panel.
- Eyebrow to wordmark: `clamp(34px, 4vw, 52px)`.
- Wordmark to tagline: `clamp(24px, 3vw, 40px)`.
- Bottom domain: `bottom: clamp(20px, 4vw, 60px)`, centered absolute.

The splash intentionally leaves large negative space between tagline and footer.

## 5. Components

### Splash mark

Plain text only. `OmO` is semibold white; `in Codex` is regular tertiary. No logo asset.

### Eyebrow + metadata

Two small uppercase lines above the wordmark. The launch/OpenCode line is present for product messaging but visually subordinate to the eyebrow.

### Wordmark

Single semantic `<h1>`. Medium weight, very large, tight tracking, pure white.

### Tagline

Two separate visual lines. `ultrawork` is wrapped in `<strong>` and promoted to primary white with weight 700.

### Footer

Exactly one `<footer>` containing only `lazycodex.ai`, centered at the bottom in mono.

## 6. Motion & Interaction

- One CSS-only soft reveal: opacity + `translate3d(0, 8px, 0)` over 720 ms.
- `prefers-reduced-motion: reduce` disables the reveal.
- No pulse, cursor blink, hover choreography, parallax, or scroll effects.
- The only interactive element is the skip link; it receives a visible white focus ring.

## 7. Accessibility & SEO

- One `<main>`, one `<h1>`, one `<footer>`.
- `lang="en"`, canonical `https://lazycodex.ai/`, OpenGraph/Twitter image routes, JSON-LD, manifest, robots, and sitemap remain in place.
- Metadata title remains `LazyCodex — Codex for lazy people. Coming June 2026.` to preserve the SEO contract.
- The page ships as a Server Component with zero hydration JavaScript.
- No emojis, no raw hex in JSX page markup, no commented-out UI code.

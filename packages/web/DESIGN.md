# LazyCodex Design System

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

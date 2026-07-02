# LazyCodex Design System

Implementation sources:
- Browser CSS tokens and shared utility layers live in `app/styles/design-system.css`, imported before page-specific styles by `app/globals.css`.
- Reusable React primitives live in `components/design-system/`; landing and docs components compose from those primitives.
- Social preview tokens live in `app/og-image-theme.ts` and intentionally mirror the browser palette.
- Page-specific composition styles live in `app/styles/landing.css` and `app/styles/docs.css`.

## 1. Atmosphere & Identity

LazyCodex feels like a serious command surface for complex codebases: near-black, quiet, technical, and lit by an emerald signal. The signature is a glowing green card-in-canvas composition with a geometric rounded-square `L` mark. The brand color is green, not teal, cyan, purple, or blue.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Surface/base | `--surface-base`, `--surface-night`, `--surface-0` | `#0a0c0b` | Page canvas and footer |
| Surface/subtle | `--surface-1` | `rgba(255,255,255,0.018)` | Hover and quiet fills |
| Surface/raised | `--surface-2` | `rgba(255,255,255,0.035)` | Secondary tonal layer |
| Surface/strong | `--surface-3` | `rgba(255,255,255,0.055)` | Stronger tonal layer |
| Surface/card | `--card-base`, `--surface-panel` | `#0E1411` | Hero card, command surfaces |
| Surface/alt | `--surface-panel-alt` | `#0C1310` | Alternate panel |
| Surface/deep | `--surface-panel-deep` | `#0D1310` | Deep panel |
| Brand/core | `--brand-core` | `#22c55e` | Green brand center |
| Brand/mid | `--brand-mid` | `#16a34a` | Green gradient middle |
| Brand/outer | `--brand-outer` | `#15803d` | Selection and gradient edge |
| Accent/primary | `--accent-primary` | `#4ade80` | CTAs, focus, active docs links |
| Accent/on-primary | `--accent-on-primary` | `#052e16` | Text on accent-primary fills |
| Accent/soft | `--accent-primary-soft` | `rgba(74,222,128,0.1)` | Soft green fills |
| Accent/border | `--accent-primary-border` | `rgba(74,222,128,0.24)` | Soft green outlines |
| Accent/mint | `--accent-mint`, `--accent-glow` | `#86efac` | Highlights, glow text |
| Text/primary | `--text-primary` | `#ffffff` | Main text and headings |
| Text/secondary | `--text-secondary` | `#b8c2bc` | Supporting text |
| Text/tertiary | `--text-tertiary` | `#8b9690` | Labels, metadata |
| Text/muted | `--text-muted` | `rgba(255,255,255,0.74)` | Body copy on dark surfaces |
| Text/soft | `--text-soft` | `#dcfce7` | Mint-tinted text |
| Border/subtle | `--border-subtle` | `rgba(255,255,255,0.06)` | Dividers and quiet controls |
| Border/default | `--border-default` | `rgba(255,255,255,0.1)` | Panels and cards |
| Status/success | `--status-success` | `#22c55e` | Positive status |
| Status/warning | `--status-warning` | `#f59e0b` | Warnings |
| Status/error | `--status-error` | `#ef4444` | Errors |

### Codex window adapter tokens (ulw-demo / team-mode mocks only)

The interactive Ultrawork demo and the Team Mode thread mock reproduce the light Codex Desktop
surface inside the dark canvas. That light surface is an isolated adapter palette — it never leaks
into ordinary landing/docs UI, and ordinary tokens never restyle the window interior.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Window/canvas | `--codex-window-bg` | `#ffffff` | Codex window body |
| Window/chrome | `--codex-window-chrome` | `#f6f7f6` | Title bar, sidebar, composer field |
| Window/border | `--codex-window-border` | `rgba(10,12,11,0.12)` | Window ring, pane dividers |
| Window/text | `--codex-window-text` | `#17211b` | Primary transcript text |
| Window/text-soft | `--codex-window-text-soft` | `#5b675f` | Tool rows, metadata, timestamps |
| Window/chip | `--codex-window-chip` | `rgba(10,12,11,0.06)` | Inline code chips, path chips |
| Window/active | `--codex-window-active` | `rgba(34,197,94,0.12)` | Active step, active roster row |
| Window/active-border | `--codex-window-active-border` | `rgba(22,101,52,0.28)` | Active step/proof outlines |
| Window/accent | `--codex-window-accent` | `#166534` | Active-state text on light surface (AA on white) |
| Window/glyph-text | `--codex-window-glyph-text` | `#ffffff` | Letters inside roster glyph squares |
| Window/traffic | `--codex-window-traffic-red/-amber/-green` | `#f87171` / `#fbbf24` / `#34d399` | macOS traffic-light ornaments |

### Rules

- New UI uses `--accent-primary` and `--accent-mint`; `--accent-cyan` and `--accent-teal` remain green aliases only for compatibility.
- Accent is reserved for interactivity, code emphasis, focus, and brand signal.
- Raw colors belong in this file, `design-system.css`, or OG theme tokens. Component code should reference tokens or shared primitives.

## 3. Typography

### Scale

| Level | Size | Weight | Line height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `clamp(44px,7vw,104px)` | 600 | 0.95 | -0.03em | Landing wordmark |
| Hero lead | `clamp(18px,2.2vw,26px)` | 400 | 1.4 | -0.005em | Landing lead |
| Section XL | `clamp(32px,5vw,56px)` | 500-600 | tight | 0 to tight | Large marketing sections |
| Section L | `clamp(28px,4vw,48px)` | 500-600 | tight | tight | Showcase titles |
| Docs H1 | `clamp(2rem,3.5vw,2.6rem)` | 700 | tight | -0.02em | Docs page title |
| Docs H2 | `1.75rem` | 700 | normal | -0.02em | Docs section title |
| Body | `1rem` | 400 | 1.55-1.7 | 0 | Default prose |
| Body small | `0.875rem` | 400-500 | 1.4-1.5 | 0 | Cards, docs nav |
| Caption | `0.75rem` | 500-600 | 1.3-1.4 | uppercase | Badges, labels |

### Font Stack

- Primary: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`
- The landing wordmark intentionally uses the native primary stack so the LCP text has no webfont dependency.

## 4. Spacing & Layout

### Base Unit

All spacing resolves to a 4px rhythm. Existing Tailwind values map to the same rhythm: `gap-2` 8px, `gap-3` 12px, `gap-4` 16px, `gap-6` 24px, `mt-24` 96px, `mt-32` 128px, `mt-40` 160px.

### Grid

- Max marketing content width: `1200px`.
- Docs max width: `1280px`.
- Docs desktop grid: `260px | minmax(0, 1fr) | 220px`.
- Docs collapse: hide the ToC below `1100px`; single column and mobile menu below `768px`.
- Full-height surfaces use `min-h-[100dvh]`, never `h-screen`.

### Rules

- `MarketingContainer`, `MarketingSection`, and `MarketingRuleGrid` in `components/design-system/layout.tsx` own the repeated page width and split-section geometry.
- Use CSS Grid for multi-column layouts. Avoid percentage flex math.
- Preserve the existing information architecture: landing first, docs as a single richly-sectioned page.

## 5. Components

### BrandMark

- **Source**: `components/design-system/brand-mark.tsx`.
- **Structure**: inline SVG rounded square, `L` stroke, mint/green dot.
- **Variants**: `nav` 24px geometry, `hero` 160px geometry with `HeroBrandMark` glow wrapper.
- **States**: inherited from the containing link or surface.
- **Accessibility**: decorative mark uses `aria-hidden`; header link owns the accessible label.

### Layout Primitives

- **Source**: `components/design-system/layout.tsx`.
- **Components**: `PageShell`, `SkipLink`, `MarketingMain`, `MarketingContainer`, `MarketingSection`, `MarketingRuleGrid`.
- **Usage**: pages and repeated landing bands. They preserve the current DOM semantics while centralizing width, `dvh`, and split-grid rules.

### Typography Primitives

- **Source**: `components/design-system/typography.tsx`.
- **Components**: `Kicker`, `SectionHeading`, `BodyText`, `GradientTitle`, `AccentBadge`, `InlineCode`.
- **Usage**: marketing sections, showcase titles, badges, and command/code snippets.
- **Motion**: typography itself does not animate; reveal behavior remains in CSS utilities.

### Surface Primitives

- **Source**: `components/design-system/surfaces.tsx`.
- **Components**: `SurfaceCard`, `AccentSurface`, `ShowcaseSurface`, `CommandCodeSurface`, `IconWell`, `FactList`, `CompactDotList`, `NumberedPoint`.
- **Usage**: command cards, OmO/Lazy comparison cards, Hephaestus and Ultrawork black showcases, numbered workflow rows.
- **Depth**: border plus tonal shift, with showcase shadows only where already present.

### Action Primitives

- **Source**: `components/design-system/actions.tsx`.
- **Components**: `LinkAction`, `GlowActionFrame`.
- **Variants**: primary filled text button, secondary outlined button.
- **States**: hover scale or tonal shift, visible focus ring, no layout-property animation.

### CodexWindow (ulw-demo)

- **Source**: `components/site/ulw-demo/codex-window.tsx` (client leaf), scene data in `lib/ulw-demo-scenes.ts`.
- **Structure**: light Codex Desktop window (adapter tokens above): title bar with traffic lights and
  `ULTRAWORK MODE ENABLED!` badge, transcript pane (command chip → status line → scene headline →
  scene body → 8 numbered workflow steps), right rail (Environment card, Subagents roster,
  narrative card, `goals.json / ledger.jsonl` card), composer bar, scene tab strip with play/pause.
- **Variants**: 8 scenes (`research → plan → todo → assign → red → green → qa-retry → checkpoint`),
  each atomically updating command, status, headline, body, active step, roster lanes, proof chips,
  ledger, and JSON card.
- **States**: `data-scene` index; `data-playing` for autoplay; per-step `data-active`; per-lane
  `data-live`. Scene tabs expose `role=tab` + `aria-selected`; play/pause exposes `aria-pressed`;
  scene status announces via `aria-live="polite"`.
- **Accessibility**: fully keyboard operable; content remains readable with JS disabled (scene 0
  server-rendered); every scene reachable without autoplay.
- **Integrity**: live DOM only — no raster screenshot, `<img>`, or `background-image` may stand in
  for window content.
- **Roster glyph colors**: the subagent glyph squares use per-agent identity hues (blue explorer,
  amber librarian, violet planner, …) faithful to the Codex Desktop reference. They are scoped to
  the window adapter and are identity badges, not brand accents — the green-only brand rule applies
  outside the window.

### TeamModeSection / UlwResearchSection

- **Source**: `components/site/team-mode-section.tsx`, `components/site/ulw-research-section.tsx`;
  copy constants in `lib/site-config.ts`.
- **Structure**: TeamMode shows a leader thread plus member thread cards (light chrome via the same
  adapter tokens) with a `Sent by Codex from another thread` note bubble; UlwResearch is a compact
  feature band composed from existing surface primitives.
- **Copy rule**: every visible string traces to `plugins/omo/skills/teammode/SKILL.md`,
  `plugins/omo/skills/ulw-research/SKILL.md`, or `content/docs/*.md` via the copy ledger — no
  invented claims, metrics, customers, or dates.

### DocsHero

- **Source**: `components/design-system/docs-hero.tsx`.
- **Structure**: version badge, title, tagline using the existing docs CSS hooks.
- **Usage**: docs page header; intentionally keeps the current `docs-*` class contract for pixel-stable docs layout.

## 6. Motion & Interaction

### Timing

| Type | Duration | Usage |
| --- | --- | --- |
| Micro | 150ms | Nav links, docs links, inputs |
| Standard | 200-300ms | Buttons, card hover, focus feedback |
| Splash | 720ms | Landing reveal only |

### Rules

- Animate `transform`, `opacity`, `filter`, and color only. Never animate width, height, top, left, margin, or padding.
- Respect `prefers-reduced-motion`; `splash-reveal` disables itself.
- Focus states are visible through global `:focus-visible` and component-level rings.
- Docs interactions must keep working: mobile menu, sidebar search, Cmd/Ctrl-K focus, hash navigation, scroll-spy, and prev/next cards.
- **Hover is an affordance, not decoration.** Hover feedback may exist only on elements with a real
  action (links, buttons, tabs, inputs). A hover effect on a non-actionable element — cards, list
  rows, headings, chips, roster rows — is a defect and must be removed.

### ulw-demo timeline

- Scene transitions animate `opacity`/`transform` only (150-300ms); step and lane activation use the
  same budget. No layout-property animation anywhere in the window.
- Autoplay starts when the demo scrolls into view (IntersectionObserver), advances scenes every
  ~7s, pauses on any user interaction with the tabs or the play/pause control, and never traps focus.
- `prefers-reduced-motion: reduce` disables autoplay entirely and makes scene switches instant;
  tabs remain fully operable.
- The typing-caret effect on the command chip is CSS-only (`opacity` blink) and disabled under
  reduced motion.

## 7. Depth & Surface

### Strategy

LazyCodex uses a mixed but constrained depth strategy: tonal-shift panels and borders for everyday surfaces, plus existing deep showcase shadows for the landing hero and black showcase panels.

| Level | Treatment | Usage |
| --- | --- | --- |
| Canvas | `--surface-base` | Whole site background |
| Panel | `--surface-panel` or `bg-white/[0.03]` with subtle border | Cards, install bar, docs input |
| Accent panel | `--accent-primary` soft fill and border | Built-in skills, Lazy comparison, workflow code |
| Showcase | black surface, ring, green radial glow, shadow | Hephaestus and Ultrawork feature blocks |
| Hero | `--card-base`, layered `.card-gradient-*`, large shadow | Landing hero card |

### Rules

- Do not add generic white cards or purple-blue gradients.
- Do not replace the hero or brand mark with raster screenshots.
- If a component pattern appears twice, it belongs in `components/design-system/` and this section.

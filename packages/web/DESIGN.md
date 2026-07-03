# LazyCodex Design System

Implementation sources:
- Browser CSS tokens and shared utility layers live in `app/styles/design-system.css`, imported before page-specific styles by `app/globals.css`.
- Reusable React primitives live in `components/design-system/`; landing and docs components compose from those primitives.
- Social preview tokens live in `app/og-image-theme.ts` and intentionally mirror the browser palette.
- Page-specific composition styles live in `app/styles/landing.css`, `app/styles/ulw-demo.css`, and `app/styles/docs.css`.

## 1. Atmosphere & Identity

LazyCodex feels like a calm, precise productivity tool for complex codebases: a deep graphite
canvas, editorial structure with dotted column rules, hairline white borders, restrained accents,
and green as the single brand signal — crisp and quiet, in the spirit of a modern dark
productivity tool. The signature composition is the faithful LIGHT Codex window sitting on the
dark ground with the geometric rounded-square `L` mark: the light window is the page's hero
contrast, mirroring the real app frames. Elevated panels separate from the canvas through small
tonal lifts plus hairline borders, never heavy chrome. Light surfaces exist only as deliberate
accents — chiefly the demo window's light theme — small light windows on dark ground, never the
page itself. The brand color is green, not teal, cyan, purple, or blue.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Surface/base | `--surface-base`, `--surface-0` | `#0e1012` | Page canvas |
| Surface/night | `--surface-night` | `#0a0c0e` | Footer and deeper page bands |
| Surface/subtle | `--surface-1` | `rgba(255,255,255,0.04)` | Hover and quiet fills |
| Surface/raised | `--surface-2` | `rgba(255,255,255,0.06)` | Secondary tonal layer |
| Surface/strong | `--surface-3` | `rgba(255,255,255,0.09)` | Stronger tonal layer |
| Surface/card | `--card-base` | `#16181c` | Elevated dark panels, content cards |
| Surface/panel | `--surface-panel` | `#121417` | Panels, install bar |
| Surface/alt | `--surface-panel-alt` | `#131519` | Alternate panel |
| Surface/deep | `--surface-panel-deep` | `#101215` | Deep panel |
| Brand/core | `--brand-core` | `#22c55e` | Green brand center (fills, gradients) |
| Brand/mid | `--brand-mid` | `#16a34a` | Green gradient middle |
| Brand/outer | `--brand-outer` | `#15803d` | Gradient edge |
| Accent/primary | `--accent-primary` | `#4ade80` | CTAs, focus, active docs links (AA on canvas AND elevated panels) |
| Accent/soft | `--accent-primary-soft` | `rgba(74,222,128,0.10)` | Soft green fills |
| Accent/border | `--accent-primary-border` | `rgba(74,222,128,0.32)` | Soft green outlines |
| Accent/mint | `--accent-mint` | `#86efac` | Fills and decoration first; interactive text stays on `--accent-primary` |
| Accent/glow | `--accent-glow` | `#bbf7d0` | Bright green emphasis |
| Text/primary | `--text-primary` | `#f7f8f8` | Main text and headings |
| Text/secondary | `--text-secondary` | `#b4bcc8` | Supporting text |
| Text/tertiary | `--text-tertiary` | `#98a1ab` | Labels, metadata |
| Text/muted | `--text-muted` | `rgba(247,248,248,0.78)` | Body copy |
| Text/soft | `--text-soft` | `#86efac` | Green-tinted text |
| Border/subtle | `--border-subtle` | `rgba(255,255,255,0.08)` | Hairline dividers, dotted rules, quiet controls |
| Border/default | `--border-default` | `rgba(255,255,255,0.12)` | Panels and cards |
| Status/success | `--status-success` | `#4ade80` | Positive status |
| Status/warning | `--status-warning` | `#fbbf24` | Warnings |
| Status/error | `--status-error` | `#f87171` | Errors |

`::selection` uses a `#14532d` dark-green background with `#dcfce7` text. `:focus-visible`
outlines use `--accent-primary`. The `html` element declares `color-scheme: dark`; the site
identity is a FIXED dark canvas — there is no site-wide `prefers-color-scheme` flip. Light
appears only inside the sanctioned light surface below (the demo window's light theme).

### Codex window adapter tokens (ulw-demo / team-mode mocks only)

The interactive Ultrawork demo and the Team Mode thread mock reproduce the Codex Desktop surface
on the dark canvas. The window carries its own isolated adapter palette with two themes selected
by `data-window-theme="light|dark"` on `.ulw-window` — light is the default and the
server-rendered state: the faithful-app light window on the dark page is the hero contrast,
mirroring the real Codex app frames. A `role="group"` toggle switches it (see § CodexWindow).
Adapter tokens never leak into ordinary landing/docs UI, and ordinary tokens never restyle the
window interior.

Light theme (default block on `.ulw-window`):

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

Dark theme (override block scoped `[data-window-theme="dark"]`, same 13 token names). It is
deliberately a touch LIGHTER than the page canvas (`#0e1012`) with a stronger hairline ring
(`rgba(255,255,255,0.18)`), so the dark window still reads as a distinct elevated layer instead
of dissolving into the page:

| Role | Token | Value |
| --- | --- | --- |
| Window/canvas | `--codex-window-bg` | `#1a1d22` |
| Window/chrome | `--codex-window-chrome` | `#15181c` |
| Window/text | `--codex-window-text` | `#eef1f4` |
| Window/text-soft | `--codex-window-text-soft` | `#a9b2bd` |
| Window/accent | `--codex-window-accent` | `#4ade80` |
| Window/border, chip, active(+border), glyph-text, traffic | same names | tuned dark-elevated values — `app/styles/design-system.css` is authoritative |

Every (text, background) pair in BOTH window themes must pass `.omo/scripts/contrast-check.mjs`
at ≥ 4.5:1 (≥ 3:1 only for display-size text).

### Subagent lane glyph tokens

The roster glyph squares use per-agent identity hues faithful to the Codex Desktop reference.
They are exposed as per-theme custom props (`--lane-<name>`) so the dark window block can re-tune
any glyph that fails contrast against `--codex-window-bg`:

| Lane | Token | Light value |
| --- | --- | --- |
| Root | `--lane-root` | `#115e59` |
| Explore | `--lane-explore` | `#1d4ed8` |
| Library | `--lane-library` | `#92400e` |
| Plan | `--lane-plan` | `#6d28d9` |
| Todo | `--lane-todo` | `#334155` |
| Execute | `--lane-execute` | `#166534` |
| Test | `--lane-test` | `#b91c1c` |
| QA | `--lane-qa` | `#be185d` |
| Review | `--lane-review` | `#4338ca` |
| Continuation | `--lane-continuation` | `#475569` |

These are identity badges scoped to the window adapter, not brand accents — the green-only brand
rule applies everywhere outside the window.

### Rules

- New UI uses `--accent-primary`; `--accent-cyan` and `--accent-teal` remain green aliases only for compatibility.
- `--accent-mint` (`#86efac`) is a fill/decoration color first (glows, dots, code prompt glyphs). Interactive text and links stay on `--accent-primary` so the accent voice remains single and restrained.
- Accent is reserved for interactivity, code emphasis, focus, and brand signal.
- Light surfaces are allowed ONLY inside the demo window's faithful light theme (`.ulw-window` default adapter block, also used by the Team Mode mock). Everything else sits on the dark canvas. Code blocks (`pre`), command surfaces (`CommandCodeSurface`), and the Hephaestus band (`ShowcaseSurface`) are slightly ELEVATED dark layers — a tonal lift plus a hairline ring, so they never vanish into the page.
- Raw colors belong in this file, `design-system.css`, or OG theme tokens. Component code references tokens or shared primitives. The sanctioned raw values in components are: `#16191e` (showcase band), `#1b1f24` (command code chip), `#15181d` (docs `pre`), `#dcfce7` (text on dark code chips), gradient stops `#86efac`/`#4ade80`/`#22c55e`, brand glow `rgba(74,222,128,0.16)`, card shadow `rgba(0,0,0,0.4)`, and the `white/10` hairline rings on elevated dark chips.

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
- Display serif: `--font-serif: ui-serif, Georgia, Cambria, "Times New Roman", serif` — declared in the `@theme` block; a SYSTEM stack, never a webfont (Lighthouse perf 100 depends on zero webfonts).

### Rules

- The serif stack is for section display headings only (via the `serif` option on `SectionHeading`), giving marketing bands the editorial voice. Body copy, UI chrome, cards, and docs prose stay on the sans stack.
- The landing wordmark/`h1` and hero lead intentionally stay on the native sans stack so the LCP text has no font-substitution or reflow risk.

## 4. Spacing & Layout

### Base Unit

All spacing resolves to a 4px rhythm. Existing Tailwind values map to the same rhythm: `gap-2` 8px, `gap-3` 12px, `gap-4` 16px, `gap-6` 24px, `mt-24` 96px, `mt-32` 128px, `mt-40` 160px.

### Grid

- Max marketing content width: `1200px`.
- Docs max width: `1280px`.
- Docs desktop grid: `260px | minmax(0, 1fr) | 220px`.
- Docs collapse: hide the ToC below `1100px`; single column and mobile menu below `768px`.
- Full-height surfaces use `min-h-[100dvh]`, never `h-screen`.

### Dotted rule grid

- The `.rule-grid-dotted` utility applies `border-left: 1px dotted var(--border-subtle)` to child columns — the editorial vertical column rule of the LazyCodex identity (the rule color flips with the token: hairline white on the dark canvas).
- Apply it through `MarketingRuleGrid` with `ruleStyle="dotted"` on multi-column marketing bands that need column separation without card chrome. Solid rules remain the default (`ruleStyle="solid"`).
- Dotted rules never appear inside the demo window or the docs layout.

### Rules

- `MarketingContainer`, `MarketingSection`, and `MarketingRuleGrid` in `components/design-system/layout.tsx` own the repeated page width and split-section geometry.
- Use CSS Grid for multi-column layouts. Avoid percentage flex math.
- Landing IA, top to bottom: header → compact hero → `#ulw-demo` (interactive demo directly under the hero) → install → command cards → feature workflows (+ built-in skills band) → team mode → ulw-research → Hephaestus (+ OmO intro) → docs CTA → footer. Docs remain a single richly-sectioned page.
- Marketing sections must never wrap an `h2` in `<article>` — `e2e/landing.spec.ts` asserts `article h2` equals exactly the command-card names.

## 5. Components

### BrandMark

- **Source**: `components/design-system/brand-mark.tsx`.
- **Structure**: inline SVG rounded square, `L` stroke, mint/green dot; dark tile fill `var(--card-base)`, stroke `var(--accent-primary)`.
- **Variants**: `nav` 24px geometry, `hero` 160px geometry with `HeroBrandMark` glow wrapper (soft `rgba(74,222,128,0.16)` glow tuned for the dark canvas).
- **States**: inherited from the containing link or surface.
- **Accessibility**: decorative mark uses `aria-hidden`; header link owns the accessible label.

### Layout Primitives

- **Source**: `components/design-system/layout.tsx`.
- **Components**: `PageShell`, `SkipLink`, `MarketingMain`, `MarketingContainer`, `MarketingSection`, `MarketingRuleGrid` (with the `ruleStyle: "solid" | "dotted"` variant).
- **Usage**: pages and repeated landing bands. They preserve the current DOM semantics while centralizing width, `dvh`, and split-grid rules.

### Typography Primitives

- **Source**: `components/design-system/typography.tsx`.
- **Components**: `Kicker`, `SectionHeading` (with the serif display option), `BodyText`, `GradientTitle`, `AccentBadge`, `InlineCode`.
- **Usage**: marketing sections, showcase titles, badges, and command/code snippets. `GradientTitle` uses the dark-legible green gradient (`#86efac → #4ade80 → #22c55e`).
- **Motion**: typography itself does not animate; reveal behavior remains in CSS utilities.

### Surface Primitives

- **Source**: `components/design-system/surfaces.tsx`.
- **Components**: `SurfaceCard`, `AccentSurface`, `ShowcaseSurface`, `CommandCodeSurface`, `IconWell`, `FactList`, `CompactDotList`, `NumberedPoint`.
- **Usage**: elevated dark cards (`--card-base` + `--border-subtle` + soft black shadow) for command cards, comparison cards, and numbered workflow rows. `ShowcaseSurface` is a slightly elevated showcase band (`#16191e` + `white/10` ring) for the Hephaestus showcase; `CommandCodeSurface` is an elevated code chip (`#1b1f24` with `#dcfce7` text + `white/10` ring) — code surfaces read as distinct raised layers on the dark canvas, never dissolving into it.
- **Depth**: hairline border plus tonal lift, with showcase shadows only where already present.

### Action Primitives

- **Source**: `components/design-system/actions.tsx`.
- **Components**: `LinkAction`, `GlowActionFrame`.
- **Variants**: primary is the token-inverted ink button (`--text-primary` fill, `--surface-base` text); secondary is outlined (`--border-default`, hover `--surface-1`).
- **States**: hover scale or tonal shift, visible focus ring, no layout-property animation.

### CodexWindow (ulw-demo)

- **Source**: `components/site/ulw-demo/codex-window.tsx` (client leaf), scene data in `lib/ulw-demo-scenes.ts`.
- **Structure**: Codex Desktop window (adapter tokens above) on the dark canvas: title bar with traffic lights and
  `ULTRAWORK MODE ENABLED!` badge, transcript pane (command chip → status line → scene headline →
  scene body → 8 numbered workflow steps), right rail (Environment card, Subagents roster,
  narrative card, `goals.json / ledger.jsonl` card), composer bar, scene tab strip with play/pause.
- **Variants**: 8 scenes (`research → plan → todo → assign → red → green → qa-retry → checkpoint`),
  each atomically updating command, status, headline, body, active step, roster lanes, proof chips,
  ledger, and JSON card.
- **Window themes**: light (default) and dark, driven by `data-window-theme="light|dark"` on
  `.ulw-window`. Light is the server-rendered default (faithful to the real Codex app and the state
  Lighthouse audits); dark re-themes only the window interior through the
  `[data-window-theme="dark"]` token block — the page canvas never changes.
- **Window theme toggle**: a `role="group"` container labeled `aria-label="Demo window theme"`
  holding two `<button>`s, "Light" and "Dark", each exposing `aria-pressed`. It sits in the normal
  tab order (it is NOT a second tablist) and sets `data-window-theme` on `.ulw-window`.
- **States**: `data-scene` index; `data-playing` for autoplay; per-step `data-active`; per-lane
  `data-live`; `data-window-theme` for the theme. Scene tabs expose `role=tab` + `aria-selected`;
  play/pause exposes `aria-pressed`; scene status announces via `aria-live="polite"`.
- **Accessibility**: fully keyboard operable; content remains readable with JS disabled (scene 0
  server-rendered in the light theme); every scene reachable without autoplay.
- **Layout stability**: `.ulw-window` reserves a fixed min-height per breakpoint so scene changes
  and hydration never shift layout; panes stack single-column at ≤ 768px.
- **Integrity**: live DOM only — no raster screenshot, `<img>`, or `background-image` may stand in
  for window content.
- **Roster glyph colors**: the subagent glyph squares use the per-theme `--lane-*` identity hues
  (see § Subagent lane glyph tokens) faithful to the Codex Desktop reference. They are scoped to
  the window adapter and are identity badges, not brand accents — the green-only brand rule applies
  outside the window.

### TeamModeSection / UlwResearchSection

- **Source**: `components/site/team-mode-section.tsx`, `components/site/ulw-research-section.tsx`;
  copy constants in `lib/site-config.ts`.
- **Structure**: TeamMode shows a leader thread plus member thread cards (window chrome via the same
  adapter tokens, on the dark canvas) with a `Sent by Codex from another thread` note bubble;
  UlwResearch is a compact feature band composed from existing surface primitives.
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
- Autoplay starts when the demo scrolls into view (IntersectionObserver, one-shot at 0.2 threshold),
  advances scenes every 7s (`AUTOPLAY_MS = 7000` in `lib/ulw-demo-scenes.ts`), pauses on any user
  interaction with the tabs or the play/pause control, and never traps focus.
- `prefers-reduced-motion: reduce` disables autoplay entirely and makes scene switches instant;
  tabs and the window-theme toggle remain fully operable.
- The typing-caret effect on the command chip is CSS-only (`opacity` blink) and disabled under
  reduced motion.
- Switching the window theme is a token swap (color/background transitions only) — it never
  re-triggers scene animation or autoplay.

## 7. Depth & Surface

### Strategy

LazyCodex uses a mixed but constrained depth strategy: elevated dark panels with hairline borders
and soft black shadows for everyday surfaces on the graphite canvas, plus the deliberate LIGHT
Codex window where real product chrome is shown.

| Level | Treatment | Usage |
| --- | --- | --- |
| Canvas | `--surface-base` (`#0e1012`) | Whole site background |
| Panel | `--card-base` / `--surface-panel` with `--border-subtle` and `rgba(0,0,0,0.4)` shadow | Cards, install bar, docs input |
| Accent panel | `--accent-primary` soft fill and border | Built-in skills, Lazy comparison, workflow code |
| Elevated dark chip | `#16191e` / `#1b1f24` / `#15181d` surface + `white/10` ring, light-on-dark text | Code blocks, command surfaces, Hephaestus showcase, demo window dark theme |
| Light accent | `.ulw-window` light adapter theme (`#ffffff` window on the dark ground) | Demo window default, Team Mode mock |
| Hero | `--card-base`, layered `.card-gradient-*` low-alpha green glows, large soft shadow | Landing hero card |

### Rules

- Hero card gradients are subtle radial green glows on the dark panel (`rgba(74,222,128,0.08 → 0.03)` families on `--card-base`) — low alpha only, no light stops anywhere.
- Light surfaces appear only inside the demo window's light adapter theme; the page canvas is always dark. Every other raised layer is an elevated dark surface: tonal lift + hairline ring.
- Do not add purple-blue gradients; green is the only brand hue.
- Do not replace the hero, the brand mark, or the demo window content with raster screenshots.
- If a component pattern appears twice, it belongs in `components/design-system/` and this section.

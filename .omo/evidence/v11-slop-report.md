# AI SLOP REMOVAL REPORT — v11 full-branch sweep

Scope: branch diff vs merge-base main (37 source files, packages/web), 10 parallel deep agents in 2 batches of 5.
Behavior lock: green baseline at 4f6572d — 57/57 e2e (v10-full-e2e.txt) + Lighthouse 100x4 (v10-lighthouse.txt). No new tests needed (full coverage existed).

## Per-file results (only files with changes)
- lib/ulw-demo-scenes.ts: dead code -24 LOC — ULW_DEMO_STEPS, ULW_DEMO_PROOFS, UlwStep (pre-v10 rendering model; zero consumers repo-wide, timeline derivation byte-identical)
- components/site/ulw-demo/window-icons.tsx: dead code -1 — unused "agent" icon path (v9 roster leftover; union narrowing proven safe)
- app/styles/ulw-demo-transcript.css: stale comment -1 — header still described v9 scene-variable reserves
- app/styles/ulw-demo-panel.css: obvious comment -2 — section divider restating the file header verbatim
- components/design-system/brand-mark.tsx: -1 — cx() wrapping a single static string + orphaned import
- components/site/hero.tsx: -1 — WHAT-restating JSX comment

Net: -30 LOC (32 deleted, 2 added). 31 other files verified clean with per-category SKIP reasoning (agents' full reports in session log).

## Notable justified SKIPs
- window-panes.tsx entry-kind if-chain: repo has no assertNever idiom; switch+default would change impossible-branch behavior — SKIP correct
- codex-window.tsx ?.>/?? guards: REQUIRED by noUncheckedIndexedAccess — not defensive slop
- command-card GlyphIcon default branch: runtime safety at data seam; removal trades no-op for potential render throw
- docs.css duplication (sticky columns, 4.5rem offsets): unmergeable without cascade reorder / new custom property

## Flagged for the consolidation pass (handled in the follow-up commit)
- DEAD: .card-gradient-base/-beam/-sheen/-pools (design-system.css) — hero went open-canvas in e425a68; DESIGN.md §7 hero row stale
- DEAD tokens: --accent-cyan, --accent-teal (compat aliases, zero consumers), --surface-3, --surface-panel-alt, --surface-panel-deep
- Accept-but-ignore props: CommandCodeSurface.className, IconWell.className (accepted, never rendered)
- Zero-consumer props: FactList.dotClassName, SkipLink.children/href, LinkAction.prefetch (?: false single-literal)
- ChildrenProps defined in surfaces.tsx AND layout.tsx with different shapes (same name)

## Quality gates
- Regression: green baseline held (behavior-preserving edits only; full sweep re-run scheduled after consolidation commit)
- Lint (biome app e2e components lib): PASS, 59 files
- Typecheck (tsc --noEmit): PASS
- Static/security scan: N/A (not configured)

## Deferred debt ledger
- docs.css at 441 pure LOC (>250 ceiling): NOT split — DESIGN.md sanctions it as the page-specific composition layer; split risks cascade-order changes
- team-mode-section.tsx L89-92 hardcoded visible string (not ledger-sourced like siblings) — flag only, copy changes forbidden
- CompactDotList vs hand-rolled team-mode bullets: dot geometry differs visibly — distinct patterns, not folded

Final Status: CLEAN

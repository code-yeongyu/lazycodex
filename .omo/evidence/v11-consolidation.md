# v11 design-system consolidation — evidence

Lens: omo-programming (TS iron list, no speculative API) + omo-frontend (DESIGN.md §7: pattern twice => design-system).

## Folds (rendered class sets byte-equal; DOM tags unchanged)
- NEW `MonoTag` (surfaces.tsx): mono chip <li> — folds ulw-research lane chips + feature-workflows skills chips (2 sites)
- NEW `CardLabel` (typography.tsx, tone: default|accent): mono uppercase card <h3> — folds hephaestus omoLabel/lazyLabel + team-mode whenTitle (3 sites)
- `AccentSurface` gains `as: "div"|"li"` + `padding` (default p-5, existing consumers unchanged) — absorbs ulw-demo example chip (px-6 py-3) + 5 Hephaestus loop tiles (as="li" p-4)

## Prop-surface tightening (all zero-consumer, DOM-identical)
- CommandCodeSurface / IconWell: no longer accept a className they silently ignored (ChildrenOnlyProps)
- SkipLink: unused children/href props inlined ("Skip to main content", "#content")
- LinkAction: speculative `prefetch?: false` prop inlined to `prefetch={false}`
- KEPT: FactList.dotClassName (shared FactListProps contract; CompactDotList consumer live), className passthrough on rendered primitives (layer-wide idiom)

## Dead CSS/tokens removed (verified 0 source consumers)
- .card-gradient-base/-beam/-sheen/-pools (hero went open-canvas in e425a68)
- --accent-cyan, --accent-teal (compat aliases), --surface-3, --surface-panel-alt, --surface-panel-deep

## DESIGN.md truth-up
- §2 palette table + alias rule reconciled with removed tokens; adapter-token intro now states the fixed-dark reality (light block defined-but-unmounted)
- §5 CodexWindow rewritten for the v10 appending chat replay (was still describing the v1 slide model with toggle + play/pause)
- §5 component lists gained MonoTag / CardLabel / AccentSurface variants
- §6 ulw-demo timeline rewritten (ENTRY_MS 900 append cadence, 4s rest, loop, reduced-motion static)
- §7 hero row + rules reflect the open-canvas hero (no card gradients)

## Gates (all after the change)
- biome lint app e2e components lib: PASS (59 files)
- tsc --noEmit: PASS
- new-string audit: 32 candidates, NEW-STRINGS-OK (no new visible copy)
- Full sweep: 57/57 PASS (v11-full-e2e.txt)
- Lighthouse: 100x4 (v11-lighthouse.txt)
- Visual eyeball on built server :4341 — v11-heph-loop.png / v11-skills-band.png / v11-demo-chip.png (all identical to pre-change rendering)

Cleanup: screenshot server on :4341 killed; playwright self-managed servers torn down (no LISTEN on 4340/4341).

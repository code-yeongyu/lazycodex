# LazyCodex Light/Greeny Redesign + Interactive Codex-Window Demo

## TL;DR
> Summary:      Flip lazycodex.ai (packages/web) from the dark emerald identity to a fixed light sage/greeny productivity-tool identity (ampcode-structure, sisyphus-tone, factory product-window pattern — layout/tone study only, all copy original+grounded), and mount the ported source-grounded interactive CodexWindow ultrawork demo (8 scenes, 13 subagents, autoplay/tabs/reduced-motion) directly under a compact hero, with a new Light/Dark window-theme toggle (light default). Token-level flip (~40 vars) + 7 enumerated hard-coded pockets + 3 ported sections + new IA, verified by ported RED→GREEN specs, contrast script, Lighthouse 100×4, and browser QA evidence.
> Deliverables: light token system + rewritten DESIGN.md; ported ulw-demo (scenes data, CodexWindow, window-theme toggle) + team-mode + ulw-research sections; new landing IA (demo under hero, raster badge retired); light OG/manifest/favicon surfaces; updated e2e contract (ulw-demo + landing-sections specs); copy ledger + source ledger + contrast script; ~14 atomic commits; branch pushed + English PR (auto-close by repo policy expected); Lighthouse/e2e/visual evidence under .omo/evidence/.
> Effort:       XL
> Risk:         Medium — Lighthouse 100×4 contrast/CLS on a flipped palette with an above-the-fold client demo; mitigated by contrast script, fixed window heights, light-default window, and the fact that e2e asserts no colors.
> Decisions (adopted defaults — veto any single one):
> - Fixed light canvas; NO site-wide prefers-color-scheme dark (dark honored inside the demo window toggle). Reversible via token layer.
> - Demo window default LIGHT (faithful to real Codex app; Lighthouse audits default), dark variant via role=group toggle. Reversible (one const).
> - Demo sits directly under hero (#ulw-demo before install) — cursor.com pattern; landing-sections spec updated to this order.
> - Code/command surfaces + hephaestus band + docs code blocks stay deliberately DARK (contrast anchors, ampcode pattern).
> - ultrawork-section.tsx + brand-image.tsx + badge raster DELETED (demo replaces them; prior-branch precedent; verified orphan).
> - apple-icon.png kept as-is (no rasterizer, OS-surface icon); icon.svg re-themed keeping "LazyCodex mark"; OG re-themed light.
> - Serif display headings via system ui-serif stack + dotted column rules (ampcode editorial feel, zero webfonts).
> - Delivery terminus: branch + PR (repo bot auto-closes ALL PRs — recorded as policy, not failure); NO direct push to main (production deploy) — owner's call.
> - Hero copy and all existing grounded strings unchanged; new sections reuse prior-branch SKILL.md-grounded copy verbatim.

## Context

### Original request
"factory.ai / ampcode.com 디자인들을 (ai-website-cloner-template 방법론으로) 제대로 가져오고, lazycodex.ai 레이아웃을 잘 구상해서 sisyphuslabs.ai/en 톤과 비슷한, 라이트/greeny 계열 생산성 도구 느낌으로 redesign. 없는 기능을 만들지 말고, cursor.com처럼 interactive demo를 웹에 만들어도 좋음 — ~/Desktop의 Codex app 이미지 참고, 다크/라이트 잘 감안해서, ultrawork·검증·todo·subagents 잔뜩 위주로 보여지는 데모. 새 브랜치 + 커밋 잘, aside-browser/omo-visual-qa/cc-ulw-plan/cc-ulw-loop 사용, work-with-pr 라이프사이클."

### Interview summary (autonomous mandate — adopted defaults, veto any in TL;DR Decisions)
- Standing autonomous mandate: /work-with-pr invocation naming cc-ulw-plan/cc-ulw-loop + "그대로 redesign 해주라". No interview; defaults adopted and surfaced.
- Reference sites are LAYOUT/TONE STUDY ONLY (captures at `.omo/reference/redesign-light/`). Every shipped visible string/asset is original LazyCodex content traceable to repo sources. Never copy reference-site text/assets.
- Site identity: FIXED light sage/greeny canvas (no site-wide prefers-color-scheme flip). "다크/라이트" is honored INSIDE the demo window via a Light/Dark window-theme toggle.
- Demo window DEFAULT = LIGHT (faithful to the real Codex app per `~/Desktop/desktop app.png`; the 10 lane-glyph hexes were tuned for white; Lighthouse audits the default state). Dark variant = toggle option, its own token block.
- Delivery terminus (repo reality): `.github/workflows/pr-source-guidance.yml` auto-closes EVERY PR (github-actions[bot] closed the owner's own draft PR #99 on 2026-07-02). Therefore: DONE = branch pushed + PR created in English (auto-close by repo policy is EXPECTED and recorded, not a failure) + all CI-equivalent gates green LOCALLY with evidence + review pass done locally. Direct push to main (= production deploy via web-deploy.yml) is the owner's call and is NOT performed by the executor.

### Research findings
- **Token lever**: `packages/web/app/styles/design-system.css` `:root` L13-53 (~40 vars) drives landing+docs; `html` L56-59 `color-scheme:dark`→`light`; `.card-gradient-*` L86-110 hard-coded dark. Seven hard-coded dark pockets: card-gradients; `components/site/hero.tsx:19` inline gradient; Tailwind literals `bg-black`/`bg-white/[0.0x]`/`border-white/x`/`ring-white/x` in `components/design-system/surfaces.tsx` (L45-56), `components/design-system/layout.tsx` (L66), `components/design-system/actions.tsx`, and site components; `components/design-system/typography.tsx:4-9` green text-gradient; `app/styles/docs.css:313,321,325-327` pre colors; `app/og-image-theme.ts` separate dark OG palette; dark-baked assets `app/icon.svg` + `app/apple-icon.png` + `public/img/badge-ultrawork.*`. Meta: `app/layout.tsx:15-16` themeColor/colorScheme; `app/manifest.ts:11,14`.
- **e2e reality**: NO color assertions anywhere. Break surface = copy literals + DOM structure. Hard DOM contracts: exactly one h1/main/footer (`e2e/home.spec.ts:44-50`); `article h2` === COMMANDS names IN ORDER on `/` (`e2e/landing.spec.ts:62`) — new sections must NOT wrap h2 in article; skip-link sr-only (`home.spec.ts:52-58`); launch-gating negative regex (`home.spec.ts:4-14`); stars pill contract (`landing.spec.ts:89-102`); "Built-in skill coverage" ABOVE "Where it comes from" (`landing.spec.ts:70-82`); responsive 360-1920 no overflow (`e2e/responsive.spec.ts:22-52`); SEO exact strings + og 1200×630 + icon.svg contains "LazyCodex mark" + apple-icon 180×180 (`e2e/seo.spec.ts`); docs nav/SSR/ordering (`e2e/docs.spec.ts`). Lighthouse = ONLY color-sensitive gate: 100×4 mobile+desktop, real Chrome vs `next start` (`e2e/lighthouse.spec.ts:27-32,208-213`); perf-100 depends on zero webfonts (system stacks only).
- **CI**: `.github/workflows/web-ci.yml` (PR→main, paths packages/web/**): `pnpm run lint` → `pnpm run type-check` → `pnpm run build` → playwright non-lighthouse → lighthouse → `pnpm exec opennextjs-cloudflare build`. pnpm 11.7.0, Node 24.
- **Prior demo branch** (worktree `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/`): demo window ALREADY LIGHT via 13 `--codex-window-*` adapter tokens (its `design-system.css:58-70`, bg `#ffffff` text `#17211b`); internals fully token-driven. Port-verbatim: `lib/ulw-demo-scenes.ts` (214 LOC, 8 scenes "01 Research"…"08 Checkpoint", 13 workers, AUTOPLAY_MS=7000), `components/site/ulw-demo/codex-window.tsx` (118 LOC client: IntersectionObserver 0.2 one-shot, reduced-motion first-line guard, tablist/tab/tabpanel, aria-live polite, play/pause aria-pressed), `components/site/ulw-demo/window-panes.tsx` (157 LOC server: menubar + "ULTRAWORK MODE ENABLED!" flag, transcript, right rail = Environment + 13-agent Subagents roster + ledger card, composer), `e2e/ulw-demo.spec.ts` (91 LOC). Port-with-tweaks: `ulw-demo-section.tsx` (41; drop dark-tuned glow), `app/styles/ulw-demo.css` (468; retune `.ulw-window` shadow `rgba(0,0,0,0.55)` for light canvas; lane-glyph colors become per-theme tokens), `team-mode-section.tsx` (96), `ulw-research-section.tsx` (44; chips `border-white/10 bg-black/20` → light), DESIGN.md +4 sections (+68; reword "dark canvas"), `e2e/landing-sections.spec.ts` (85; hard-codes IA order — update to new IA). `source-ledger.md` lives ONLY in main repo `/Users/yeongyu/local-workspaces/lazycodex/.omo/reference/source-ledger.md` — copy into this worktree.
- **Copy map**: `packages/web/lib/site-config.ts` L2-81 is authoritative (install L2-4 ≡ README L36-52; hero L11-20 — "The Hephaestus deep-worker agent, ported light into Codex."; pillars L21; ultrawork L22-23; omoIntro L24-40; hephaestus L41-55; featureWorkflows L56-75; builtInSkills L76-81). `lib/commands.ts` (43 LOC) card facts must cite `plugins/omo/skills/*/SKILL.md` (sharper than docs). `content/docs/` = 20 files; `ultrawork.md:1` definition, `:3-:5` evidence principle. Ledger format (main repo `.omo/evidence/copy-ledger.md`): `## <config key>` sections, 2-col table String | Source(path:line + verbatim quote).
- **Reference structure study** (`.omo/reference/redesign-light/*.png`): ampcode = light sage canvas + dotted vertical column rules + editorial serif display + dark app windows on light ground + column footer; factory = split hero, headline + live product window; sisyphus = short stacked declarative hero sentences, pill header. Synthesis for LazyCodex below (IA).

### Metis review (gaps → resolutions)
1. page.tsx listed "no-change" but IA rewrites it → page.tsx owned by Task 13 (composition). Explorer's "no-change" applied to color only.
2. PR-to-main terminus impossible (auto-close bot; zero merges ever; PR #99 closed by github-actions[bot]) → delivery terminus redefined (Interview summary). Cubic/auto-merge gates recorded SKIPPED (repo policy); review gate runs locally pre-push.
3. "Coming June 2026 contract" stale + e2e FORBIDS launch-gating copy → dropped; the SEO contract is the CURRENT exact strings in `app/layout.tsx` (title "LazyCodex — Codex agent harness for complex codebases", 149-char description, canonical https://lazycodex.ai, JSON-LD SoftwareApplication).
4. Dark-default window risks (Lighthouse audits default; glyph hexes tuned for white; fidelity) → default flipped to LIGHT window; dark = toggle; lane-glyph colors tokenized per theme; dark block AA-validated by contrast script + visual QA.
5. No contrast criterion → Task 1 ships `.omo/scripts/contrast-check.mjs` (pure Node, zero deps) validating the enumerated (fg,bg) pairs ≥4.5:1 (≥3:1 only for ≥24px/19px-bold display text), evidence file required.
6. Demo above-the-fold CLS/TBT → `.ulw-window` fixed min-height per breakpoint; scene transitions opacity/transform only; zero console output; LH perf 100 both form factors is the binding gate.
7. `article h2` tripwire → explicit Must-NOT + acceptance grep in Tasks 7, 11, 13.
8. 360px reflow → demo panes stack single-column ≤768px; overflow-x scoped to code rows; responsive.spec green.
9. apple-icon.png regeneration has no rasterizer → apple-icon.png KEPT AS-IS (OS icon; dark tile acceptable); `app/icon.svg` re-themed as SVG text edit (MUST keep literal `LazyCodex mark` title, `seo.spec.ts:135-149`); OG re-theme via `og-image-theme.ts` palette values (ImageResponse route already dynamic; dims unchanged).
10. Grounding tooling invisible in worktree → Task 2 copies `source-ledger.md` + `copy-grounding-check.mjs` from main repo absolute paths into worktree `.omo/`.
11. docs code blocks stay dark on light theme → LOCKED DECISION: keep code blocks/command surfaces DARK (mini dark-window aesthetic, ampcode pattern, echoes dark window variant); `/docs` gets explicit visual-QA step (docs not Lighthouse-audited).
12. landing-sections.spec/ulw-demo.spec don't exist in worktree → Task 5 PORTS then edits them.
13. Toggle a11y undefined → LOCKED: `role="group"` + `aria-label="Demo window theme"`, two `<button>`s "Light"/"Dark" with `aria-pressed`, standard tab order (NOT a second tablist), sets `data-window-theme="light|dark"` on `.ulw-window`.
14. Worktree base drift → rebase onto origin/main before push (marketplace syncs don't touch packages/web).
15. `.omo/` NOT gitignored at root → commits add EXPLICIT paths only; never `git add -A`; `.omo/**` stays uncommitted.

## Scope

### Must have
- Fixed light sage/greeny canvas identity across landing + docs, token-driven, exact palette in Task 1 (names preserved so all `var(--…)` consumers flip for free).
- Interactive CodexWindow ulw demo (ported, source-grounded, live DOM) as full-width section directly under a compact hero (`#ulw-demo`), autoplay/tabs/play-pause/reduced-motion contract intact, plus NEW Light/Dark window-theme toggle (light default).
- New landing IA: header → hero → #ulw-demo → install → command cards → feature workflows(+skills band) → team mode → ulw-research → hephaestus(+omoIntro below skills band) → docs CTA → footer.
- Team-mode + ulw-research sections ported and restyled; ultrawork raster badge section DELETED (demo replaces it).
- All copy grounded: every NEW visible string in `.omo/evidence/copy-ledger.md` citing `path:line`; scene strings covered by `source-ledger.md`.
- Contracts green locally: biome lint, tsc, next build, full non-lighthouse e2e, Lighthouse 100×4 mobile+desktop (artifacts), opennextjs-cloudflare build.
- DESIGN.md rewritten for the light system (tokens, dotted rules, serif display rule, window adapter tokens light+dark, motion rules, no-raster rule).
- Atomic conventional commits (explicit paths); branch pushed; English PR to main created with QA evidence summary (auto-close expected + recorded).

### Must NOT have (guardrails)
- NO text/assets copied from factory.ai/ampcode.com/sisyphuslabs.ai — structure/tone study only.
- NO invented features, metrics, customers, dates, or claims; NO new copy without a ledger row.
- NO new runtime dependencies; NO webfonts (system stacks only — perf 100).
- NO site-wide prefers-color-scheme flip; NO raster stand-ins inside the demo (live DOM only).
- NO `<article>`-wrapped `<h2>` in any new/ported section (landing.spec:62 equality).
- NO edits to: `lib/github-stars*.ts`, `app/api/github-stars/route.ts`, SEO metadata strings in `app/layout.tsx` (colors/scheme values only), `e2e/seo.spec.ts` assertions, `e2e/responsive.spec.ts`, `e2e/github-stars.spec.ts`, `e2e/home.spec.ts` (except none expected), root installer `bin/`, `plugins/`, `src/` submodule, `apple-icon.png`.
- NO `git add -A` / `git add .`; NEVER commit `.omo/**`; NO push to main; NO merge attempts.
- NO scope creep: no pricing/enterprise/blog pages, no i18n, no CMS, no analytics.

## Verification strategy
> Zero human intervention — all verification agent-executed.
- Test decision: **TDD where the surface is testable** — Task 5 lands ported+updated specs RED first (evidence), Wave 2/3 turn them GREEN. Framework: Playwright (existing), biome, tsc.
- QA policy: every todo has ≥1 happy + ≥1 failure/edge scenario through a real surface (browser via playwright CLI/spec run, or CLI stdout for scripts), with capture + cleanup commands.
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>` inside the worktree (uncommitted).
- Dev-server convention for scenarios: `cd /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/light-greeny-redesign-interactive-demo/packages/web && (PORT=4310 pnpm run dev >/tmp/lcx-dev.log 2>&1 &)` then poll `until curl -sf http://127.0.0.1:4310/ >/dev/null; do sleep 1; done` (bounded 90s). Teardown: `lsof -ti :4310 | xargs kill -9 2>/dev/null; lsof -i :4310 | wc -l` → 0.
- Spec-run convention: ALWAYS under pipefail with a sentinel — `set -o pipefail; pnpm exec playwright test <spec> 2>&1 | tee <evidence> && echo SPEC-PASS` → expected `SPEC-PASS` (playwright builds+starts prod itself; a failing spec fails the pipeline and the sentinel never prints).
- QA cwd convention (BINDING for every scenario): ALL scenario commands — `pnpm exec …`, the one-off `node -e "import('@playwright/test')…"` scripts, `npx tsc` — run from `packages/web` (that is where @playwright/test resolves; the import FAILS from the worktree root — verified). Evidence paths inside those commands are therefore `../../.omo/evidence/…`. Commands that only touch `.omo/` or git (grep/tee/git diff/node .omo/scripts/*.mjs) run from the worktree root with plain `.omo/…` paths.

## Execution strategy

### Parallel execution waves
Wave 1 (no deps): 1, 2, 3, 4
Wave 2 (after Wave 1 completes — including 2, so ported specs compile): 5, 6, 8, 9, 10, 12
Wave 3 (after Wave 2): 7, 11, 14
Wave 4 (after Wave 3): 13 — single task deliberately: the final composition serializes everything.
Wave 5 (after 13): 15 — single task deliberately: the ledger audits the FINAL diff, so it cannot start before 13 lands.
Final wave (after all): F1, F2, F3, F4
Then the Delivery runbook (§ after Commit strategy) — executed by the orchestrator, not a wave task.
Critical path: 2 → 5 → 7 → 13 → F2/F3

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
|---|---|---|---|
| 1 | none | 5,6,7,8,9,10,11,12,13,14 | 2,3,4 |
| 2 | none | 5,7,11,15 | 1,3,4 |
| 3 | none | F1 | 1,2,4 |
| 4 | none | 13 | 1,2,3 |
| 5 | 1,2 | 7,13 | 6,8,9,10,12 |
| 6 | 1 | 11 | 5,8,9,10,12 |
| 7 | 1,2,5 | 13 | 11,14 |
| 8 | 1 | 13 | 5,6,9,10,12 |
| 9 | 1 | 13 | 5,6,8,10,12 |
| 10 | 1 | 13 | 5,6,8,9,12 |
| 11 | 1,2,6 | 13,15 | 7,14 |
| 12 | 1 | 13 | 5,6,8,9,10 |
| 13 | 4,5,7,8,9,10,11,12 | 15,F* | none |
| 14 | 1 | F* | 7,11 |
| 15 | 11,13 | F* | none |

File-ownership disjointness (parallel safety): 1=app/styles/* + docs.css; 2=lib/ulw-demo-scenes.ts + lib/site-config.ts (teamMode/ulwResearch key additions) + .omo/{reference,evidence,scripts}; 3=DESIGN.md; 4=app/{layout.tsx,manifest.ts,og-image-theme.ts,icon.svg}; 5=e2e/*; 6=components/design-system/*; 7=components/site/ulw-demo/* + app/styles/ulw-demo.css + globals.css import + page.tsx (minimal UlwDemoSection mount ONLY); 8=components/site/{hero,site-header}.tsx; 9=components/site/{install-block,command-card,command-cards,copy-button}.tsx; 10=components/site/feature-workflows-section.tsx; 11=components/site/{team-mode-section,ulw-research-section}.tsx; 12=components/site/{hephaestus-section,docs-cta,site-footer}.tsx; 13=app/page.tsx (final IA) + deletions + e2e/landing-sections.spec.ts touch-up; 14=docs surface audit (docs.css leftovers — coordinate with 1: 14 runs in a later wave, sequential by wave ordering); 15=.omo/evidence/copy-ledger.md. page.tsx is touched by 7 (Wave 3) then 13 (Wave 4) — sequential waves, no conflict.

## TODOs
> Implementation + its test = ONE todo.
> All paths relative to worktree root `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/light-greeny-redesign-interactive-demo/` unless absolute. `packages/web` abbreviated `packages/web/`.

- [ ] 1. Flip the token system to the light sage palette (+ serif display font, dotted rules, window-theme token blocks, contrast script)
  **What to do**:
  1. In `packages/web/app/styles/design-system.css` `:root` (L13-53) replace values IN PLACE (keep every token NAME):
     `--surface-base:#f4f6ee; --surface-night:#e9ede0; --surface-0:#f4f6ee; --surface-1:rgba(16,25,20,0.03); --surface-2:rgba(16,25,20,0.05); --surface-3:rgba(16,25,20,0.08); --card-base:#ffffff; --surface-panel:#fbfcf7; --surface-panel-alt:#f7faf2; --surface-panel-deep:#f3f7ec;`
     brand greens unchanged (`--brand-core:#22c55e; --brand-mid:#16a34a; --brand-outer:#15803d`);
     `--accent-primary:#15803d; --accent-primary-soft:rgba(21,128,61,0.08); --accent-primary-border:rgba(21,128,61,0.28); --accent-mint:#86efac` (fills/decoration ONLY, never text on light); `--accent-glow:#14532d;` keep `--accent-cyan/--accent-teal` as green aliases;
     `--text-primary:#101914; --text-secondary:#3f4b43; --text-tertiary:#55645b; --text-muted:rgba(16,25,20,0.75); --text-soft:#14532d;`
     `--border-subtle:rgba(16,25,20,0.10); --border-default:rgba(16,25,20,0.16);` status colors: `--status-success:#15803d; --status-warning:#a16207; --status-error:#b91c1c` (AA on light).
  2. `html` block (L56-59): `color-scheme: light`. `::selection` → bg `#bbf7d0` text `#14532d`. `:focus-visible` outline `--accent-primary`.
  3. Rewrite `.card-gradient-base/-beam/-sheen/-pools` utilities (L86-110) for a light hero card: soft mint/sage radial washes on white (e.g. radial-gradient stops using rgba(34,197,94,0.10→0.04) and rgba(134,239,172,0.16) on `--card-base`), no near-black stops anywhere.
  4. `@theme` block (L1-9): add `--font-serif: ui-serif, Georgia, Cambria, "Times New Roman", serif;` (NO webfont).
  5. Add utility `.rule-grid-dotted` (new, in the utilities layer): applies `border-left: 1px dotted var(--border-subtle)` to children columns for the ampcode-style vertical rules (used by MarketingRuleGrid variant in Task 6).
  6. Append the TWO CodexWindow adapter token blocks (port names from prior branch `design-system.css:58-70` — 13 `--codex-window-*` tokens): default (light, faithful values: bg `#ffffff`, text `#17211b`, etc. copied from prior branch) on `.ulw-window`, and a dark override block scoped `[data-window-theme="dark"]` (bg `#101613`, text `#e8f0ea`, borders/muted tuned; derive from the CURRENT dark site tokens being retired — `#0E1411` family). ALSO move the 10 lane-glyph identity colors into per-theme custom props (`--lane-<name>`) so the dark block can re-tune any glyph that fails contrast.
  7. `packages/web/app/styles/docs.css`: LEAVE pre/code-block colors dark (L313,321,325-327) — locked decision (dark code surfaces on light canvas). Fix any OTHER docs.css literal that assumes dark canvas (scan for rgba(255,255,255 and #0/#1 hex values outside the pre block).
  8. Write `.omo/scripts/contrast-check.mjs` (pure Node, zero deps): hardcode the pair list [(text-primary,surface-base),(text-primary,card-base),(text-secondary,surface-base),(text-secondary,card-base),(text-tertiary,card-base),(text-muted,surface-base),(accent-primary,surface-base),(accent-primary,card-base),(text-soft,surface-base),(status-*,surface-base),(codex-window text,codex-window bg) light AND dark,(lane glyph colors, both window bgs)] with the hex values above; compute WCAG 2.1 relative-luminance contrast; print `PASS`/`FAIL name ratio` lines and exit 1 on any FAIL <4.5 (mark display-only pairs requiring ≥3.0 explicitly).
  **Must NOT do**: rename/remove any token; add webfonts; touch component files; change docs pre colors; commit `.omo/`.
  **Parallelization**: Wave 1 | Blocks: 6,7,8,9,10,11,12,13,14 | Blocked by: none
  **References**:
  - `packages/web/app/styles/design-system.css:11-110` — the master token file; L13-53 :root values to replace, L56-59 color-scheme, L86-110 gradient utilities to rewrite. Names MUST survive (every component consumes `var(--…)`).
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/app/styles/design-system.css:58-70` — the 13 `--codex-window-*` adapter tokens to port (light values).
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/app/styles/ulw-demo.css` — where the 10 lane-glyph hexes currently live (grep `--lane` or the glyph class block) — these move into per-theme props here.
  - `.omo/reference/redesign-light/ampcode-s0.png`, `ampcode-s3.png` — the sage-paper + dotted-rule look being tokenized (STUDY ONLY; do not copy content).
  - `packages/web/app/styles/docs.css:313-327` — pre block that stays dark (locked decision #11 in Metis review).
  **Acceptance criteria**:
  - [ ] `grep -cE -- "--surface-base: ?#f4f6ee|color-scheme: ?light" packages/web/app/styles/design-system.css` → ≥2 matches
  - [ ] `grep -n "codex-window" packages/web/app/styles/design-system.css | wc -l` → ≥26 (13 tokens × two blocks)
  - [ ] `node .omo/scripts/contrast-check.mjs | tee .omo/evidence/task-1-contrast.txt` → last line `ALL PASS`, exit 0
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: light canvas renders end-to-end (happy)
    Tool: playwright CLI screenshot vs dev server
    Steps: 1. `cd packages/web && (PORT=4310 pnpm run dev >/tmp/lcx-dev.log 2>&1 &)` 2. `for i in $(seq 1 90); do curl -sf http://127.0.0.1:4310/ >/dev/null && break; sleep 1; done` 3. `pnpm exec playwright screenshot --viewport-size=1440,900 --wait-for-timeout=4000 http://127.0.0.1:4310/ ../../.omo/evidence/task-1-light-canvas.png`
    Expected (binary): `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://127.0.0.1:4310/');console.log('bg='+await p.evaluate(()=>getComputedStyle(document.body).backgroundColor));await b.close();})"` → `bg=rgb(244, 246, 238)`; screenshot is the human-auditable artifact.
    Capture: the screenshot command above writes the evidence file; append the bg= line to .omo/evidence/task-1-light-canvas.txt.
    Cleanup: `lsof -ti :4310 | xargs kill -9 2>/dev/null; lsof -i :4310 | wc -l` → `0`
    Evidence: .omo/evidence/task-1-light-canvas.png
  - Scenario: contrast script catches a failing pair (edge)
    Tool: CLI stdout
    Steps: 1. `node -e "const s=require('fs').readFileSync('.omo/scripts/contrast-check.mjs','utf8'); require('fs').writeFileSync('/tmp/cc-bad.mjs', s.replace('#101914','#c9d2cb'))"` 2. `set -o pipefail; node /tmp/cc-bad.mjs 2>&1 | tee .omo/evidence/task-1-contrast-negative.txt; echo "exit=$?" >> .omo/evidence/task-1-contrast-negative.txt`
    Expected: stdout contains `FAIL` and the recorded line is `exit=1` (pipefail makes `$?` node's status, not tee's)
    Capture: the tee + echo in step 2 write the evidence file.
    Cleanup: `rm -f /tmp/cc-bad.mjs && test ! -f /tmp/cc-bad.mjs && echo clean`
    Evidence: .omo/evidence/task-1-contrast-negative.txt
  **Commit**: Y | `feat(design-system): flip tokens to the light sage palette` | Files: packages/web/app/styles/design-system.css, packages/web/app/styles/docs.css (only if literals fixed), .omo excluded

- [ ] 2. Port the source-grounded demo data + grounding tooling into this worktree
  **What to do**:
  1. `cp /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/lib/ulw-demo-scenes.ts packages/web/lib/ulw-demo-scenes.ts` — VERBATIM port (214 LOC: 8 scenes, 13 workers, steps, proofs, AUTOPLAY_MS). Do not edit copy strings.
  2. `cp /Users/yeongyu/local-workspaces/lazycodex/.omo/reference/source-ledger.md .omo/reference/source-ledger.md` (beat→OMO-source proof for every scene string).
  3. `cp /Users/yeongyu/local-workspaces/lazycodex/.omo/scripts/copy-grounding-check.mjs .omo/scripts/copy-grounding-check.mjs`; read it; if it hardcodes old paths, adapt paths ONLY (no logic changes).
  4. Create `.omo/evidence/copy-ledger.md` skeleton in the main-repo format: `## <config/component key>` sections each with a `| String | Source |` table; pre-fill sections for every EXISTING grounded surface (SITE_CONFIG keys, lib/ulw-demo-scenes.ts → source-ledger.md pointer, lib/commands.ts → plugins/omo/skills/{ulw-loop,ulw-plan,start-work}/SKILL.md citations).
  5. ADD the `ulwDemo`, `teamMode`, and `ulwResearch` config keys to `packages/web/lib/site-config.ts` — copied VERBATIM from `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/lib/site-config.ts` (ulwDemo at its L82, teamMode at L90, ulwResearch at L112; extract via `git -C /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo diff main -- packages/web/lib/site-config.ts` to see exactly what that branch added). These keys are what the ported `ulw-demo-section.tsx` (reads `SITE_CONFIG.ulwDemo.*` at its L18/20/23/33), `landing-sections.spec.ts` (Task 5), and section components (Task 11) import — they MUST land in this task so Wave 2 specs and Wave 3 components compile as literal ports.
  6. Write `.omo/scripts/config-drift-check.mjs` (pure Node, zero deps — replaces fragile inline one-liners) with EXACTLY this behavior: read `packages/web/lib/site-config.ts` (this worktree, relative to worktree root cwd) and `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/lib/site-config.ts`; for each key of `["ulwDemo","teamMode","ulwResearch"]`, extract the block with the SAME function on both sides — `const block=(src,key)=>{const i=src.indexOf(key+": {");if(i<0)return null;const j=src.indexOf("\n  }",i);return j<0?null:src.slice(i,j+4)}` — and print `<KEY>-MATCH`/`<KEY>-DRIFT` per key (uppercased); exit 1 on any DRIFT. (Identical extraction on both sides makes the byte-compare fair regardless of block-end formatting.)
  7. Type-check: the ported data file + config compile.
  **Must NOT do**: edit scene copy; invent new scenes/workers; alter existing site-config keys; touch components; commit `.omo/`.
  **Parallelization**: Wave 1 | Blocks: 5,7,11,15 | Blocked by: none
  **References**:
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/lib/ulw-demo-scenes.ts` — the file to port verbatim; its header comment documents the grounding contract.
  - `/Users/yeongyu/local-workspaces/lazycodex/.omo/reference/source-ledger.md` — 34-line beat→source map; the proof scene copy isn't invented; MUST travel with the branch work.
  - `/Users/yeongyu/local-workspaces/lazycodex/.omo/evidence/copy-ledger.md` — format exemplar (String|Source tables grouped by key).
  - `packages/web/lib/site-config.ts:2-81` + `packages/web/lib/commands.ts` — existing grounded copy the ledger pre-fill indexes.
  - `plugins/omo/skills/ulw-loop/SKILL.md:3`, `plugins/omo/skills/ulw-plan/SKILL.md:3`, `plugins/omo/skills/start-work/SKILL.md:3`, `plugins/omo/skills/teammode/SKILL.md:3,8`, `plugins/omo/skills/ulw-research/SKILL.md:3` — authoritative sources for command-card and section claims.
  **Acceptance criteria**:
  - [ ] `diff packages/web/lib/ulw-demo-scenes.ts /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/lib/ulw-demo-scenes.ts` → empty (exit 0)
  - [ ] `test -f .omo/reference/source-ledger.md && test -f .omo/scripts/copy-grounding-check.mjs && echo OK` → `OK`
  - [ ] `grep -c "^## " .omo/evidence/copy-ledger.md` → ≥4 sections
  - [ ] `grep -c "ulwDemo\|teamMode\|ulwResearch" packages/web/lib/site-config.ts` → ≥3
  - [ ] `node .omo/scripts/config-drift-check.mjs` (from worktree root) → prints `ULWDEMO-MATCH`, `TEAMMODE-MATCH`, `ULWRESEARCH-MATCH`, exit 0
  - [ ] `cd packages/web && pnpm run type-check` → exit 0 (data file compiles unused)
  **QA scenarios**:
  - Scenario: scene data compiles and has exactly 8 scenes (happy)
    Tool: CLI stdout
    Steps: 1. `cd packages/web && set -o pipefail; npx tsc --noEmit lib/ulw-demo-scenes.ts --target es2022 --module esnext --moduleResolution bundler 2>&1 | tee ../../.omo/evidence/task-2-scenes-compile.txt && echo TSC-PASS | tee -a ../../.omo/evidence/task-2-scenes-compile.txt` 2. `grep -c 'tab: "' lib/ulw-demo-scenes.ts | tee -a ../../.omo/evidence/task-2-scenes-compile.txt` (`tab` is a scene-only field per the UlwScene type)
    Expected: `TSC-PASS` printed AND the grep count is exactly `8`
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-2-scenes-compile.txt
  - Scenario: grounding checker rejects an un-ledgered string (edge)
    Tool: CLI stdout
    Steps: 1. read `.omo/scripts/copy-grounding-check.mjs` usage header 2. run it against the current ledger: `node .omo/scripts/copy-grounding-check.mjs 2>&1 | tee .omo/evidence/task-2-grounding-baseline.txt; echo "exit=$?" >> .omo/evidence/task-2-grounding-baseline.txt`
    Expected: script runs (exit 0 or documented non-zero listing missing rows — either is evidence the checker is live in THIS worktree)
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-2-grounding-baseline.txt
  **Commit**: Y | `feat(demo): port source-grounded ulw demo scene data` | Files: packages/web/lib/ulw-demo-scenes.ts, packages/web/lib/site-config.ts

- [ ] 3. Rewrite DESIGN.md for the light system
  **What to do**: Rewrite `packages/web/DESIGN.md` (currently documents the dark "near-black lit by emerald" identity):
  1. §1 Atmosphere: light sage/greeny productivity surface; dark reserved for code/demo-window accents; green stays THE brand color.
  2. §2 Color: full new token table (exact values from Task 1, including both `--codex-window-*` blocks and lane-glyph per-theme props) + rules (accent-mint never text on light; dark surfaces only for code blocks, command surfaces, optional hephaestus band, demo dark variant).
  3. §3 Typography: system stacks unchanged + NEW `--font-serif` display rule (which headings may use it: section display headings only; wordmark/h1 stays sans for LCP).
  4. §4 Layout: 4px rhythm unchanged + dotted-rule grid rule (`.rule-grid-dotted`, when to apply).
  5. §5 Components: port the 4 prior-branch sections — "Codex window adapter tokens", "CodexWindow (ulw-demo)" (KEEP the rule "live DOM only — no raster stand-ins"), "TeamModeSection / UlwResearchSection" (copy-ledger rule), "ulw-demo timeline" (opacity/transform only, AUTOPLAY_MS=7000, IntersectionObserver, reduced-motion disables autoplay) — reworded from "dark canvas" to "light canvas, window themes light(default)/dark via data-window-theme + role=group toggle".
  6. Motion & interaction rules: hover feedback ONLY on actionable elements; transitions opacity/transform only; reduced-motion contract.
  **Must NOT do**: document features that don't exist; leave any "dark canvas" phrasing; touch code files.
  **Parallelization**: Wave 1 | Blocks: F1 | Blocked by: none
  **References**:
  - `packages/web/DESIGN.md` (current) — structure to preserve (sections 1-5 + rules style); the dark values being replaced.
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/DESIGN.md` — the 4 added demo sections to port+reword (grep "Codex window adapter" and "ulw-demo timeline").
  - Task 1's palette (this plan, TODO 1) — the exact values the table must match.
  **Acceptance criteria**:
  - [ ] `grep -c "f4f6ee\|codex-window\|data-window-theme\|rule-grid-dotted\|font-serif" packages/web/DESIGN.md` → ≥8
  - [ ] `grep -ci "dark canvas" packages/web/DESIGN.md` → 0
  - [ ] `grep -c "no raster" packages/web/DESIGN.md` → ≥1
  **QA scenarios**:
  - Scenario: DESIGN.md token table matches design-system.css (happy)
    Tool: CLI stdout
    Steps: 1. `for v in f4f6ee ffffff 15803d 101914 bbf7d0; do grep -q "$v" packages/web/DESIGN.md && grep -q "$v" packages/web/app/styles/design-system.css && echo "$v OK" || echo "$v MISMATCH"; done | tee .omo/evidence/task-3-token-parity.txt`
    Expected: five `OK` lines, zero `MISMATCH`
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-3-token-parity.txt
  - Scenario: no stale dark-identity language (edge)
    Tool: CLI stdout
    Steps: 1. `grep -rniE "near-black|dark canvas|#0a0c0b|#0E1411" packages/web/DESIGN.md | tee .omo/evidence/task-3-stale-dark.txt; echo "matches=$(grep -cniE 'near-black|dark canvas' packages/web/DESIGN.md)" >> .omo/evidence/task-3-stale-dark.txt`
    Expected: `matches=0` (a `#0E1411`-family hex may legitimately appear ONLY inside the dark window-theme token table — if present, file must show it there and nowhere else)
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-3-stale-dark.txt
  **Commit**: Y | `docs(design): rewrite DESIGN.md for the light system` | Files: packages/web/DESIGN.md

- [ ] 4. Light meta/brand surfaces: layout viewport, manifest, OG palette, favicon SVG
  **What to do**:
  1. `packages/web/app/layout.tsx:15-16`: `themeColor: "#f4f6ee"`, `colorScheme: "light"`. TOUCH NOTHING ELSE in this file (SEO strings frozen).
  2. `packages/web/app/manifest.ts`: `background_color: "#f4f6ee"` (L14), keep `theme_color: "#22c55e"` (L11) or move to `#15803d` — pick `#15803d` for AA coherence.
  3. `packages/web/app/og-image-theme.ts`: rewrite `OG_PALETTE`/`OG_GRADIENTS` to the light palette (surfaceBase `#f4f6ee`, cardBase `#ffffff`, text `#101914`/`#3f4b43`, green gradients from mint washes; keep export names/shape so `opengraph-image.tsx` compiles untouched).
  4. `packages/web/app/icon.svg`: re-theme the mark for light browser chrome (white/сage tile + green `L` mark) — MUST retain the literal string `LazyCodex mark` (seo.spec.ts:135-149 asserts it) and stay valid SVG.
  5. `packages/web/app/apple-icon.png`: DO NOT TOUCH (locked decision #9).
  **Must NOT do**: alter any metadata copy string, title, description, JSON-LD; change OG dimensions (1200×630); touch apple-icon.png; add deps.
  **Parallelization**: Wave 1 | Blocks: 13 | Blocked by: none
  **References**:
  - `packages/web/app/layout.tsx:12-17` — viewport block (the ONLY lines to edit); L20+ metadata is frozen contract per `e2e/seo.spec.ts:28-49`.
  - `packages/web/app/og-image-theme.ts` — standalone dark palette; `packages/web/app/opengraph-image.tsx` consumes it (keep type shape).
  - `packages/web/app/icon.svg` — current dark tile `fill="#0E1411"`; seo.spec asserts `/icon.svg` 200 + literal `LazyCodex mark`.
  - `e2e/seo.spec.ts:114-153` — OG/twitter image 1200×630 + icon contracts that must stay green.
  **Acceptance criteria**:
  - [ ] `grep -n "colorScheme" packages/web/app/layout.tsx` → `"light"`; `grep -c "f4f6ee" packages/web/app/layout.tsx packages/web/app/manifest.ts packages/web/app/og-image-theme.ts` → ≥3
  - [ ] `grep -c "LazyCodex mark" packages/web/app/icon.svg` → ≥1; `grep -c "0E1411" packages/web/app/icon.svg` → 0
  - [ ] `git diff --name-only | grep apple-icon` → empty
  - [ ] `cd packages/web && pnpm run type-check && pnpm run build` → exit 0
  **QA scenarios**:
  - Scenario: OG image renders light at 1200×630 (happy)
    Tool: curl vs dev server
    Steps: 1. `cd packages/web && (PORT=4311 pnpm run dev >/tmp/lcx-dev4.log 2>&1 &)` 2. `for i in $(seq 1 90); do curl -sf http://127.0.0.1:4311/ >/dev/null && break; sleep 1; done` 3. `curl -s -o ../../.omo/evidence/task-4-og.png -w "%{http_code} %{content_type}\n" http://127.0.0.1:4311/opengraph-image | tee ../../.omo/evidence/task-4-og-headers.txt` 4. `node -e "const b=require('fs').readFileSync('../../.omo/evidence/task-4-og.png'); console.log('w',b.readUInt32BE(16),'h',b.readUInt32BE(20))" | tee -a ../../.omo/evidence/task-4-og-headers.txt`
    Expected: `200 image/png`, `w 1200 h 630`; visual check of task-4-og.png shows light background dark text.
    Capture: curl -o + tee above.
    Cleanup: `lsof -ti :4311 | xargs kill -9 2>/dev/null; lsof -i :4311 | wc -l` → `0`
    Evidence: .omo/evidence/task-4-og.png, .omo/evidence/task-4-og-headers.txt
  - Scenario: favicon still satisfies the SEO contract (edge)
    Tool: curl vs dev server (same server as happy path, run before cleanup)
    Steps: 1. `curl -s -w "%{http_code} %{content_type}\n" http://127.0.0.1:4311/icon.svg -o /tmp/icon-check.svg | tee ../../.omo/evidence/task-4-icon.txt` 2. `grep -c "LazyCodex mark" /tmp/icon-check.svg | tee -a ../../.omo/evidence/task-4-icon.txt`
    Expected: `200` + `image/svg+xml`, grep count ≥1
    Capture: tee above.
    Cleanup: `rm -f /tmp/icon-check.svg` + the happy-path server teardown; `test ! -f /tmp/icon-check.svg && echo clean`
    Evidence: .omo/evidence/task-4-icon.txt
  **Commit**: Y | `feat(brand): light meta, manifest, OG and favicon surfaces` | Files: packages/web/app/layout.tsx, packages/web/app/manifest.ts, packages/web/app/og-image-theme.ts, packages/web/app/icon.svg

- [ ] 5. Port + update the e2e contract for the new IA (RED first)
  **What to do**:
  1. `cp /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/e2e/ulw-demo.spec.ts packages/web/e2e/ulw-demo.spec.ts` — keep all 6 assertions (scene-0 SSR, autoplay→scene-2 ≤12s, tab-jump atomic, play/pause aria-pressed, reduced-motion stays scene-0, no 390px overflow).
  2. APPEND to `packages/web/e2e/ulw-demo.spec.ts` a window-theme suite: (a) `.ulw-window` has `data-window-theme="light"` by default; (b) locator `role=group[name="Demo window theme"]` contains buttons "Light" (aria-pressed=true) and "Dark" (aria-pressed=false); (c) clicking "Dark" flips data-window-theme to "dark" and aria-pressed states; (d) keyboard: Tab to the Dark button + Enter also flips it; (e) scene-0 transcript text remains visible in dark theme.
  3. `cp .../factory-tone-landing-ulw-demo/packages/web/e2e/landing-sections.spec.ts packages/web/e2e/landing-sections.spec.ts` then EDIT the expected section order to the NEW IA: hero → `#ulw-demo` → install → command cards ($ulw-loop text) → feature workflows → team mode → ulw-research → hephaestus → docs CTA. (Prior order had install before demo; this plan puts demo first.)
  4. Run the two specs; they MUST FAIL (components/IA absent) — capture RED evidence. They MUST COMPILE (Task 2's scene data + site-config keys landed in Wave 1); a `Cannot find module` or type error is a Task-2 regression, not a valid RED.
  **Must NOT do**: touch e2e/{seo,responsive,github-stars,home,landing,docs,lighthouse}.spec.ts; weaken ported assertions; mark specs skip/fixme.
  **Parallelization**: Wave 2 | Blocks: 7,13 | Blocked by: 1,2
  **References**:
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/e2e/ulw-demo.spec.ts` — ported verbatim base (imports ULW_DEMO_SCENES → Task 2's file path resolves).
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/e2e/landing-sections.spec.ts` — base for the IA spec; edit order arrays only.
  - This plan § Locked IA (Context→Must have) — the exact order to encode.
  - Metis #13 — the toggle ARIA contract the new assertions encode (role=group, aria-pressed buttons).
  - `packages/web/playwright.config.ts` — webServer builds prod automatically; no manual server needed for spec runs.
  **Acceptance criteria**:
  - [ ] `test -f packages/web/e2e/ulw-demo.spec.ts && test -f packages/web/e2e/landing-sections.spec.ts && echo OK` → `OK`
  - [ ] `grep -c "data-window-theme\|Demo window theme" packages/web/e2e/ulw-demo.spec.ts` → ≥4
  - [ ] RED: `cd packages/web && pnpm exec playwright test e2e/ulw-demo.spec.ts e2e/landing-sections.spec.ts 2>&1 | tee ../../.omo/evidence/task-5-red.txt; grep -qE "[1-9][0-9]* failed" ../../.omo/evidence/task-5-red.txt && echo RED-CONFIRMED` → `RED-CONFIRMED`
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib` → exit 0 (specs lint-clean even while red)
  **QA scenarios**:
  - Scenario: RED run fails for the RIGHT reason (happy-for-TDD)
    Tool: CLI stdout
    Steps: 1. `grep -E "Error|expect|locator" .omo/evidence/task-5-red.txt | head -20 | tee .omo/evidence/task-5-red-reason.txt`
    Expected: failures reference missing `#ulw-demo` / `.ulw-window` selectors (absent components/IA), NOT syntax/import errors — `Cannot find module` and `TS` error codes must NOT appear anywhere in task-5-red.txt (Task 2 landed in Wave 1, so imports resolve).
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-5-red-reason.txt
  - Scenario: untouched contract specs still pass (edge — no collateral damage)
    Tool: playwright spec run
    Steps: 1. `set -o pipefail; cd packages/web && pnpm exec playwright test e2e/home.spec.ts e2e/landing.spec.ts 2>&1 | tee ../../.omo/evidence/task-5-untouched-green.txt && echo UNTOUCHED-PASS`
    Expected: `UNTOUCHED-PASS` printed (pipefail; sentinel never prints on a failing run) — current site still satisfies old contracts; only NEW specs are red.
    Capture: tee above.
    Cleanup: none (playwright tears down its own webServer; verify `lsof -i :3000 | wc -l` unchanged from before run)
    Evidence: .omo/evidence/task-5-untouched-green.txt
  **Commit**: Y | `test(e2e): port demo specs and encode the new light IA (red)` | Files: packages/web/e2e/ulw-demo.spec.ts, packages/web/e2e/landing-sections.spec.ts

- [ ] 6. Light restyle of design-system primitives (+ dotted rule grid variant)
  **What to do**: In `packages/web/components/design-system/`:
  1. `surfaces.tsx` — replace dark literals: `SurfaceCard`/`NumberedPoint` `bg-white/[0.03] border-white/10` → `bg-[color:var(--card-base)] border-[color:var(--border-subtle)]` (+ soft shadow `shadow-[0_1px_2px_rgba(16,25,20,0.04)]`); `ShowcaseSurface` (L45-49) `bg-black ring-white/5` → KEEP as the intentional dark accent band (used by Hephaestus) but tokenize: `bg-[#101613] ring-black/10` and ensure inner text uses light-on-dark tokens; `CommandCodeSurface` (L56) `bg-black/40` → solid dark code chip `bg-[#101613] text-[#dcfce7]` (locked: code surfaces stay dark); `CompactDotList` dot `bg-white/25` → `bg-[color:var(--border-default)]`.
  2. `layout.tsx` — `MarketingRuleGrid` L66 `border-white/10` → `border-[color:var(--border-subtle)]`; ADD optional prop `ruleStyle?: "solid" | "dotted"` mapping dotted → the `.rule-grid-dotted` utility from Task 1.
  3. `typography.tsx` — `gradientTextStyle` L4-9: light-legible green gradient (`#15803d→#16a34a→#22c55e`); ADD `SerifDisplay` variant or a `serif?: boolean` prop on `SectionHeading` applying `font-[family-name:var(--font-serif)]` (display headings only).
  4. `actions.tsx` — primary stays token-inverted (dark button on light canvas via `bg-[var(--text-primary)] text-[var(--surface-base)]` — verify visually); secondary `border-white/20 hover:bg-white/5` → `border-[color:var(--border-default)] hover:bg-[color:var(--surface-1)]`; `GlowActionFrame` mint blur → soften for light (`opacity-40`).
  5. `brand-mark.tsx` — L77 glow `rgba(74,222,128,0.45)` → `rgba(21,128,61,0.25)`; tile fill uses `var(--card-base)` (verify mark reads on light: stroke `var(--accent-primary)`).
  **Must NOT do**: change any component's exported API except the two ADDITIVE props named above; introduce raw color values beyond the ones THIS task sanctions (`#101613`, `#dcfce7`, gradient stops `#15803d`/`#16a34a`/`#22c55e`, glow `rgba(21,128,61,0.25)`, shadow `rgba(16,25,20,0.04)`); touch components/site/*.
  **Parallelization**: Wave 2 | Blocks: none hard (file-disjoint from section tasks) | Blocked by: 1
  **References**:
  - `packages/web/components/design-system/surfaces.tsx:45-56` — ShowcaseSurface/CommandCodeSurface dark literals (the two that STAY dark by design).
  - `packages/web/components/design-system/layout.tsx:66`, `typography.tsx:4-9`, `actions.tsx`, `brand-mark.tsx:77` — remaining literals per explorer inventory.
  - `packages/web/DESIGN.md` (post-Task-3) — the rules these primitives must embody.
  - `.omo/reference/redesign-light/ampcode-s3.png` — dotted-rule column reference (STUDY ONLY).
  **Acceptance criteria**:
  - [ ] `grep -rn "bg-white/\[0.03\]\|border-white/10\|border-white/20\|bg-white/5\|bg-black/40" packages/web/components/design-system/ | wc -l` → 0
  - [ ] `grep -c "rule-grid-dotted\|ruleStyle" packages/web/components/design-system/layout.tsx` → ≥2
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: primitives render light without layout drift (happy)
    Tool: playwright CLI screenshot vs dev server
    Steps: 1. `cd packages/web && (PORT=4312 pnpm run dev >/tmp/lcx-dev6.log 2>&1 &)` 2. poll `for i in $(seq 1 90); do curl -sf http://127.0.0.1:4312/ >/dev/null && break; sleep 1; done` 3. `pnpm exec playwright screenshot --viewport-size=1440,2400 --full-page --wait-for-timeout=4000 http://127.0.0.1:4312/ ../../.omo/evidence/task-6-primitives-full.png`
    Expected (binary): the literal-audit grep in the edge scenario returns count=0 AND `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4312/');const c=await p.locator('article').first().evaluate(e=>getComputedStyle(e).backgroundColor+'|'+getComputedStyle(e).borderColor);console.log('card='+c);await b.close();})"` → card backgroundColor `rgb(255, 255, 255)` and a non-white borderColor; screenshot is the audit artifact.
    Capture: screenshot above + append card= line to .omo/evidence/task-6-literal-audit.txt.
    Cleanup: `lsof -ti :4312 | xargs kill -9 2>/dev/null; lsof -i :4312 | wc -l` → `0`
    Evidence: .omo/evidence/task-6-primitives-full.png
  - Scenario: no dark-literal regressions creep back (edge)
    Tool: CLI stdout
    Steps: 1. `grep -rnE "bg-white/|border-white/|ring-white/|bg-black" packages/web/components/design-system/ | tee .omo/evidence/task-6-literal-audit.txt; echo "count=$(grep -rcE 'bg-white/|border-white/' packages/web/components/design-system/ | awk -F: '{s+=$2} END {print s+0}')" >> .omo/evidence/task-6-literal-audit.txt`
    Expected: `count=0`; any `bg-black`-family match appears ONLY in ShowcaseSurface/CommandCodeSurface sanctioned lines.
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-6-literal-audit.txt
  **Commit**: Y | `refactor(design-system): light primitives and dotted rule grid` | Files: packages/web/components/design-system/*.tsx

- [ ] 7. Port the CodexWindow demo to the light canvas + build the window-theme toggle
  **What to do**:
  1. Port verbatim then adapt: `cp -r /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/components/site/ulw-demo packages/web/components/site/ulw-demo` and `cp .../packages/web/app/styles/ulw-demo.css packages/web/app/styles/ulw-demo.css` (add the import to `packages/web/app/globals.css` after landing.css).
  2. `ulw-demo.css` light-canvas retune: `.ulw-window` box-shadow `0 30px 90px rgba(0,0,0,0.55)` → `0 24px 70px rgba(16,25,20,0.16), 0 2px 8px rgba(16,25,20,0.06)`; border `1px solid var(--border-default)`; replace the 10 lane-glyph raw hexes with `var(--lane-*)` props from Task 1. Give `.ulw-window` a fixed min-height per breakpoint (e.g. `min-height: 560px` desktop, `min-height: 480px` ≤768px) so autoplay scene swaps cause ZERO layout shift; panes stack single-column ≤768px; horizontal scroll allowed ONLY inside `.ulw-*-code` rows (`overflow-x:auto`).
  3. `ulw-demo-section.tsx`: LITERAL port — it reads `SITE_CONFIG.ulwDemo.{kicker,title,intro,quote}` (source L18/20/23/33), which Task 2 already added to this worktree's site-config, so the port compiles unchanged. Only styling edit: drop the dark-tuned green glow `shadow-[0_0_30px_rgba(74,222,128,0.1)]`. id stays `ulw-demo`. Do NOT re-source the heading from `ultraworkTagline` — `ulwDemo.*` IS the grounded copy.
  4. `codex-window.tsx`: ADD window-theme state `windowTheme: "light" | "dark"` default `"light"`; render `role="group" aria-label="Demo window theme"` with two `<button type="button">` "Light"/"Dark", each `aria-pressed`, click sets state; root `.ulw-window` gets `data-window-theme={windowTheme}`. Preserve EVERYTHING else (IntersectionObserver 0.2 one-shot, reduced-motion first-line guard, 7000ms interval, tablist semantics, aria-live, play/pause). Keep file <250 LOC — if the toggle pushes it over, extract `window-theme-toggle.tsx` (~30 LOC).
  5. Verify no `<article>` wraps an `<h2>` anywhere in ulw-demo components (landing.spec:62).
  6. MINIMAL MOUNT (this task, deliberately): in `packages/web/app/page.tsx`, add `import { UlwDemoSection } from "../components/site/ulw-demo/ulw-demo-section"` and render `<UlwDemoSection />` immediately after the `<MarketingContainer><Hero /></MarketingContainer>` block. Touch NOTHING else in page.tsx (UltraworkSection stays until Task 13). This makes the demo spec runnable deterministically now; Task 13 later rewrites the full composition.
  7. GREEN: `cd packages/web && pnpm exec playwright test e2e/ulw-demo.spec.ts` all pass (including Task 5's toggle suite). `landing-sections.spec.ts` REMAINS RED until Task 13 — expected and out of scope here.
  **Must NOT do**: edit scene copy; use raster images anywhere in the demo; add hover styles to non-actionable elements; console.log anything; exceed 250 LOC/file; touch page.tsx beyond the single mount described; create any temporary routes.
  **Parallelization**: Wave 3 | Blocks: 13 | Blocked by: 1,2,5
  **References**:
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/components/site/ulw-demo/{codex-window.tsx,window-panes.tsx,ulw-demo-section.tsx}` — 118/157/41 LOC sources; codex-window's state machine + a11y contract documented in explorer report (IntersectionObserver one-shot, reduced-motion first line).
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/app/styles/ulw-demo.css` — 468 LOC; shadow at the `.ulw-window` rule; lane glyph hex block.
  - `packages/web/lib/ulw-demo-scenes.ts` (Task 2) — data contract; `AUTOPLAY_MS` import.
  - `packages/web/e2e/ulw-demo.spec.ts` (Task 5) — the RED assertions this turns GREEN, incl. toggle ARIA contract.
  - `~/Desktop/desktop app.png` (user-provided grounding) — the real Codex app the light window is faithful to.
  - `packages/web/DESIGN.md` §CodexWindow (Task 3) — live-DOM-only rule, motion rules.
  **Acceptance criteria**:
  - [ ] `test -d packages/web/components/site/ulw-demo && grep -c "data-window-theme" packages/web/components/site/ulw-demo/*.tsx` → ≥1 (the single .ulw-window attr; more if the toggle component references it)
  - [ ] `grep -c "Demo window theme" packages/web/components/site/ulw-demo/*.tsx` → 1; default state renders `data-window-theme="light"`
  - [ ] `grep -rn "console\." packages/web/components/site/ulw-demo/ | wc -l` → 0; `awk 'END{print NR}' packages/web/components/site/ulw-demo/codex-window.tsx` → <250
  - [ ] `grep -rn "<article" packages/web/components/site/ulw-demo/ | wc -l` → 0
  - [ ] GREEN: `set -o pipefail; cd packages/web && pnpm exec playwright test e2e/ulw-demo.spec.ts 2>&1 | tee ../../.omo/evidence/task-7-demo-green.txt && echo DEMO-SPEC-PASS` → `DEMO-SPEC-PASS` (pipefail makes a failing spec fail the whole pipeline)
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: window renders both themes with legible transcript (happy)
    Tool: playwright CLI screenshot vs dev server (section is mounted by this task's step 6)
    Steps: 1. `cd packages/web && (PORT=4313 pnpm run dev >/tmp/lcx-dev7.log 2>&1 &)` 2. poll to 90s for `curl -sf http://127.0.0.1:4313/` 3. `pnpm exec playwright screenshot --viewport-size=1440,900 --wait-for-timeout=5000 "http://127.0.0.1:4313/#ulw-demo" ../../.omo/evidence/task-7-window-light.png` 4. flip to dark via a one-off script: `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4313/#ulw-demo');await p.getByRole('button',{name:'Dark'}).click();await p.waitForTimeout(700);await p.screenshot({path:'../../.omo/evidence/task-7-window-dark.png'});await b.close();})"`
    Expected: light PNG = white window, dark text, "ULTRAWORK MODE ENABLED!" visible, 13-agent roster rail visible; dark PNG = dark window, light text, same content.
    Capture: the two screenshot commands.
    Cleanup: `lsof -ti :4313 | xargs kill -9 2>/dev/null; lsof -i :4313 | wc -l` → `0`
    Evidence: .omo/evidence/task-7-window-light.png, .omo/evidence/task-7-window-dark.png
  - Scenario: reduced-motion + keyboard toggle (edge/a11y)
    Tool: playwright one-off script
    Steps: 1. same server; 2. `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const c=await b.newContext({reducedMotion:'reduce',viewport:{width:1440,height:900}});const p=await c.newPage();await p.goto('http://127.0.0.1:4313/#ulw-demo');await p.waitForTimeout(9000);const scene=await p.locator('.ulw-window [role=tab][aria-selected=true]').textContent();await p.keyboard.press('Tab');const out={scene};require('fs').writeFileSync('../../.omo/evidence/task-7-reduced-motion.json',JSON.stringify(out));await b.close();})"` 3. assert scene contains `01` (autoplay never started).
    Expected: selected tab is still the first scene after 9s under reduced motion; toggle reachable by keyboard (covered again by e2e suite).
    Capture: the JSON write above.
    Cleanup: same server teardown as happy path.
    Evidence: .omo/evidence/task-7-reduced-motion.json
  **Commit**: Y | `feat(demo): codex window on light canvas with window-theme toggle` | Files: packages/web/components/site/ulw-demo/*, packages/web/app/styles/ulw-demo.css, packages/web/app/globals.css, packages/web/app/page.tsx (minimal mount)

- [ ] 8. Light declarative hero + header
  **What to do**:
  1. `packages/web/components/site/hero.tsx` — restyle to a compact, open-canvas declarative hero (sisyphus tone, factory compactness): KEEP all copy exactly (`SITE_CONFIG.eyebrow`, wordmark h1, `heroLineA`, `heroLineB` parts, `harnessPillars`); REMOVE the dark card + `.card-gradient-*` layers + the L19 inline dark gradient (open light canvas; optional single soft mint radial via the retuned `.card-gradient-base` if it aids hierarchy); hero must stay image-free (LCP = text). Height budget: hero block ≤ ~60vh at 1440×900 so `#ulw-demo`'s window top edge is visible in the first viewport.
  2. `packages/web/components/site/site-header.tsx` — light: `bg-[color:var(--surface-base)]/85` backdrop-blur, `border-b border-[color:var(--border-subtle)]`; keep exact nav contract (brand link, GithubStarsPill, Docs link).
  **Must NOT do**: change any copy string; add CTAs/links that don't exist today; add images; break one-h1 contract; touch install-block.
  **Parallelization**: Wave 2 | Blocks: 13 | Blocked by: 1
  **References**:
  - `packages/web/components/site/hero.tsx:7-59` — current card hero; L19 inline gradient to remove; copy props to preserve verbatim (asserted by `e2e/landing.spec.ts:19-35`).
  - `packages/web/components/site/site-header.tsx:41 LOC` — nav contract asserted by `landing.spec.ts:89-108`.
  - `.omo/reference/redesign-light/sisyphus-s0.png` + `factory-s0.png` — stacked declarative tone / compact split reference (STUDY ONLY).
  - `e2e/responsive.spec.ts:22-52` — wordmark must fit 360px width.
  **Acceptance criteria**:
  - [ ] `grep -c "card-gradient-beam\|card-gradient-sheen\|card-gradient-pools" packages/web/components/site/hero.tsx` → 0
  - [ ] `cd packages/web && pnpm exec playwright test e2e/landing.spec.ts e2e/home.spec.ts` → all passed (copy + h1 + skip-link intact)
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: hero legible + demo top edge above the fold (happy)
    Tool: playwright CLI screenshot
    Steps: 1. `cd packages/web && (PORT=4314 pnpm run dev >/tmp/lcx-dev8.log 2>&1 &)` 2. poll 90s 3. `pnpm exec playwright screenshot --viewport-size=1440,900 --wait-for-timeout=4000 http://127.0.0.1:4314/ ../../.omo/evidence/task-8-hero-fold.png`
    Expected (binary): `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4314/');const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);const h1=await p.locator('h1').isVisible();console.log('bg='+bg,'h1='+h1);await b.close();})"` → `bg=rgb(244, 246, 238) h1=true`. Screenshot is supplementary human-auditable evidence. (Fold contract for the demo window is verified in Task 13, where the final IA exists.)
    Capture: screenshot above.
    Cleanup: `lsof -ti :4314 | xargs kill -9 2>/dev/null; lsof -i :4314 | wc -l` → `0`
    Evidence: .omo/evidence/task-8-hero-fold.png
  - Scenario: 360px wordmark fit (edge)
    Tool: playwright CLI screenshot
    Steps: 1. same server 2. `pnpm exec playwright screenshot --viewport-size=360,780 --wait-for-timeout=4000 http://127.0.0.1:4314/ ../../.omo/evidence/task-8-hero-360.png` 3. `set -o pipefail; pnpm exec playwright test e2e/responsive.spec.ts 2>&1 | tee ../../.omo/evidence/task-8-responsive.txt && echo RESPONSIVE-PASS` (tee the FULL output; no tail before capture)
    Expected: wordmark fully inside viewport, no horizontal scrollbar; `RESPONSIVE-PASS` printed.
    Capture: screenshot + tee.
    Cleanup: same teardown.
    Evidence: .omo/evidence/task-8-hero-360.png, .omo/evidence/task-8-responsive.txt
  **Commit**: Y | `feat(landing): light declarative hero and header` | Files: packages/web/components/site/hero.tsx, packages/web/components/site/site-header.tsx

- [ ] 9. Light install block + command cards
  **What to do**:
  1. `packages/web/components/site/install-block.tsx` — white card on sage, `border-[color:var(--border-subtle)]`; the command line itself stays a DARK code chip (CommandCodeSurface, locked decision); copy-button contrast on dark chip verified (`--accent-mint` text ok on dark).
  2. `packages/web/components/site/command-card.tsx` + `command-cards.tsx` — keep `<article>`/`<h2>` structure EXACTLY (landing.spec:62); light card surfaces; syntax lines stay dark code chips; SVG glyphs `currentColor` inherits new text tokens; facts list light.
  3. `packages/web/components/site/copy-button.tsx` — verify focus ring + hover on light (actionable → hover allowed); no logic changes.
  **Must NOT do**: change card element structure or command copy; introduce hover on non-actionable card bodies; touch commands.ts data.
  **Parallelization**: Wave 2 | Blocks: 13 | Blocked by: 1
  **References**:
  - `packages/web/components/site/{install-block.tsx:26,command-card.tsx:100,command-cards.tsx:16,copy-button.tsx:67}` — current literals per explorer inventory (`border-white/10`, `bg-black/40` via CommandCodeSurface).
  - `e2e/landing.spec.ts:44-67` — install copy + article>h2 + literal headings contract.
  - Task 6 CommandCodeSurface — the dark chip primitive these consume.
  **Acceptance criteria**:
  - [ ] `cd packages/web && pnpm exec playwright test e2e/landing.spec.ts` → all passed
  - [ ] `grep -rn "border-white/\|bg-black/40" packages/web/components/site/install-block.tsx packages/web/components/site/command-card.tsx | wc -l` → 0
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: copy button works on light (happy)
    Tool: playwright one-off script
    Steps: 1. `cd packages/web && (PORT=4315 pnpm run dev >/tmp/lcx-dev9.log 2>&1 &)`; poll 90s 2. `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const c=await b.newContext({permissions:['clipboard-read','clipboard-write']});const p=await c.newPage();await p.goto('http://127.0.0.1:4315/');await p.getByRole('button',{name:/copy/i}).first().click();const t=await p.evaluate(()=>navigator.clipboard.readText());require('fs').writeFileSync('../../.omo/evidence/task-9-copy.txt','clipboard='+t);await b.close();})"`
    Expected: file contains `clipboard=npx lazycodex-ai install`
    Capture: the writeFileSync above.
    Cleanup: `lsof -ti :4315 | xargs kill -9 2>/dev/null; lsof -i :4315 | wc -l` → `0`
    Evidence: .omo/evidence/task-9-copy.txt
  - Scenario: cards keep article>h2 order under restyle (edge)
    Tool: CLI stdout
    Steps: 1. `grep -n "<article\|<h2" packages/web/components/site/command-card.tsx | tee .omo/evidence/task-9-structure.txt`
    Expected: exactly one `<article` and one `<h2` per card render path, h2 = command name (structure unchanged from main).
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-9-structure.txt
  **Commit**: Y | `feat(landing): light install block and command cards` | Files: packages/web/components/site/{install-block,command-card,command-cards,copy-button}.tsx

- [ ] 10. Light feature workflows + skills band
  **What to do**: `packages/web/components/site/feature-workflows-section.tsx` — swap `border-white/10` dividers → `border-[color:var(--border-subtle)]`; skill pills L47 `bg-black/20` → light pills `bg-[color:var(--surface-2)] border-[color:var(--border-subtle)] text-[color:var(--text-secondary)]`; apply `ruleStyle="dotted"` on the MarketingRuleGrid split (ampcode column-rule feel); headings may adopt serif display via Task 6's prop. All copy untouched (headings are landing.spec:63-67 literals).
  **Must NOT do**: alter "Harness the whole codebase"/"Context that survives"/"Plans before edits"/"Evidence at the end"/"Built-in skill coverage" strings; reorder relative to omoIntro ("Built-in skill coverage" stays ABOVE "Where it comes from", landing.spec:70-82); touch other sections.
  **Parallelization**: Wave 2 | Blocks: 13 | Blocked by: 1
  **References**:
  - `packages/web/components/site/feature-workflows-section.tsx:56 LOC` (pills at L47) — explorer inventory.
  - `e2e/landing.spec.ts:63-82` — literal headings + ordering contract.
  - Task 6 `ruleStyle` prop — the dotted variant consumed here.
  **Acceptance criteria**:
  - [ ] `grep -c "bg-black/20\|border-white/10" packages/web/components/site/feature-workflows-section.tsx` → 0
  - [ ] `cd packages/web && pnpm exec playwright test e2e/landing.spec.ts` → all passed
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: skills band pills legible on light (happy)
    Tool: playwright CLI screenshot
    Steps: 1. `cd packages/web && (PORT=4316 pnpm run dev >/tmp/lcx-dev10.log 2>&1 &)`; poll 90s 2. `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4316/');await p.getByText('Built-in skill coverage').scrollIntoViewIfNeeded();await p.waitForTimeout(600);await p.screenshot({path:'../../.omo/evidence/task-10-skills-band.png'});await b.close();})"`
    Expected: pills read as light chips with hairline borders; dotted column rules visible; section headings dark-on-light.
    Capture: screenshot above.
    Cleanup: `lsof -ti :4316 | xargs kill -9 2>/dev/null; lsof -i :4316 | wc -l` → `0`
    Evidence: .omo/evidence/task-10-skills-band.png
  - Scenario: ordering contract intact (edge)
    Tool: playwright spec
    Steps: 1. `set -o pipefail; cd packages/web && pnpm exec playwright test e2e/landing.spec.ts 2>&1 | tee ../../.omo/evidence/task-10-ordering.txt && echo ORDERING-PASS` (run the FULL spec file — no grep filter, it may match zero tests and vacuously pass)
    Expected: `ORDERING-PASS` printed; the file includes the ordering assertion ("Built-in skill coverage" above "Where it comes from").
    Capture: tee above.
    Cleanup: none (playwright self-managed)
    Evidence: .omo/evidence/task-10-ordering.txt
  **Commit**: Y | `feat(landing): light feature workflows and skills band` | Files: packages/web/components/site/feature-workflows-section.tsx

- [ ] 11. Port team-mode + ulw-research sections to the light canvas
  **What to do**:
  1. `cp /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/components/site/team-mode-section.tsx packages/web/components/site/team-mode-section.tsx` — thread mock reuses `.ulw-window`/`--codex-window-*` (flips free via Task 1 tokens); adjust any canvas-level dark literals to light tokens.
  2. Same for `ulw-research-section.tsx`; REWRITE lane chips `border-white/10 bg-black/20` → `bg-[color:var(--surface-2)] border-[color:var(--border-subtle)]`.
  3. Copy sourcing (two kinds, both fixed): section headings/intro render from the SITE_CONFIG `teamMode`/`ulwResearch` keys Task 2 added (grounded in teammode/SKILL.md + ulw-research/SKILL.md); the thread-mock's inline strings (e.g. team-mode-section.tsx:65-66 "Member A COMPLETE verification note…") are ported VERBATIM and STAY hardcoded exactly as in the prior branch — do NOT move them into config (that would break the drift rule) and do NOT reword them. The literal-strings QA below verifies every inline string is byte-identical to the prior branch.
  4. No `<article>`-wrapped `<h2>`; verify.
  NOTE: the teamMode/ulwResearch site-config keys were added by Task 2 — this task consumes them; visual browser proof of these sections happens in Task 13's full-page walkthrough and F3 (they are unmounted until Task 13).
  **Must NOT do**: invent new copy; alter ported strings; edit site-config keys (Task 2 owns them); break landing.spec article>h2 equality; touch ulw-demo components.
  **Parallelization**: Wave 3 | Blocks: 13,15 | Blocked by: 1,2,6
  **References**:
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/components/site/{team-mode-section.tsx,ulw-research-section.tsx}` — 96/44 LOC sources; explorer flagged the chip literals as the one rewrite point.
  - `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/lib/site-config.ts` — the teamMode/ulwResearch config keys to port (diff against this worktree's site-config to extract exactly).
  - `plugins/omo/skills/teammode/SKILL.md:3,8` + `plugins/omo/skills/ulw-research/SKILL.md:3` — grounding sources.
  - `e2e/landing.spec.ts:62` — article>h2 tripwire.
  **Acceptance criteria**:
  - [ ] `test -f packages/web/components/site/team-mode-section.tsx && test -f packages/web/components/site/ulw-research-section.tsx && echo OK` → `OK`
  - [ ] `grep -rn "border-white/10\|bg-black/20" packages/web/components/site/{team-mode-section,ulw-research-section}.tsx | wc -l` → 0
  - [ ] `grep -c "SITE_CONFIG.teamMode\|SITE_CONFIG.ulwResearch\|teamMode\|ulwResearch" packages/web/components/site/{team-mode-section,ulw-research-section}.tsx | awk -F: '{s+=$2} END {print (s>=2)?"CONSUMES-CONFIG":"MISSING"}'` → `CONSUMES-CONFIG`
  - [ ] `grep -n "<article" packages/web/components/site/{team-mode-section,ulw-research-section}.tsx | wc -l` → 0
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: ported components' visible strings all come from config/skill sources (happy — grounding through the real artifact)
    Tool: CLI stdout
    Steps: 1. `node -e "const s=require('fs').readFileSync('packages/web/components/site/team-mode-section.tsx','utf8')+require('fs').readFileSync('packages/web/components/site/ulw-research-section.tsx','utf8');const lits=[...s.matchAll(/>([A-Za-z][^<>{}]{20,})</g)].map(m=>m[1].trim());console.log('hardcoded-long-literals='+lits.length);lits.forEach(l=>console.log('LIT: '+l))" | tee .omo/evidence/task-11-literal-strings.txt` 2. For every `LIT:` line, verify the string exists verbatim in the prior branch's same component (`grep -F "<lit>" /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/components/site/*.tsx`) — append `FOUND`/`NOT-FOUND` per literal to the evidence file.
    Expected: every `LIT:` resolves `FOUND` (zero new invented strings in the components).
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-11-literal-strings.txt
  - Scenario: ported config keys match prior branch byte-for-byte (edge — zero copy drift)
    Tool: CLI stdout
    Steps: 1. from worktree root: `set -o pipefail; node .omo/scripts/config-drift-check.mjs | tee .omo/evidence/task-11-copy-drift.txt && echo DRIFT-CHECK-PASS` (script created by Task 2)
    Expected: `TEAMMODE-MATCH`, `ULWRESEARCH-MATCH`, `DRIFT-CHECK-PASS` (all three lines, exact)
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-11-copy-drift.txt
  **Commit**: Y | `feat(landing): port team mode and ulw-research sections to light` | Files: packages/web/components/site/{team-mode-section,ulw-research-section}.tsx

- [ ] 12. Light hephaestus + docs CTA + footer
  **What to do**:
  1. `packages/web/components/site/hephaestus-section.tsx` — LOCKED: the ShowcaseSurface stays a DARK accent band (the single intentional dark marketing band, ampcode pattern); inner text uses light-on-dark values; surrounding section canvas + omoIntro comparison cards go light (SurfaceCard flips via Task 6). GradientTitle uses the light-legible gradient (Task 6).
  2. `packages/web/components/site/docs-cta.tsx` — light card, `rgba(74,222,128,0.12)` ring → `var(--accent-primary-border)`.
  3. `packages/web/components/site/site-footer.tsx` — light footer on `--surface-night` (#e9ede0) with `border-t border-[color:var(--border-subtle)]`; reorganize EXISTING links only (GitHub, OmO, Docs, "lazycodex.ai" text) into a modest 2-3 column grid (ampcode footer feel, NO invented links).
  **Must NOT do**: add footer links that don't exist today; lighten the hephaestus band (it's the contrast anchor); alter copy.
  **Parallelization**: Wave 2 | Blocks: 13 | Blocked by: 1
  **References**:
  - `packages/web/components/site/{hephaestus-section.tsx:92,docs-cta.tsx:28,site-footer.tsx:38}` — current literals per explorer inventory.
  - `e2e/landing.spec.ts:111-116` — footer must keep `a[href=omoUrl]` + "lazycodex.ai" text.
  - `.omo/reference/redesign-light/ampcode-s3.png` — footer column reference (STUDY ONLY).
  **Acceptance criteria**:
  - [ ] `grep -c "rgba(74,222,128,0.12)" packages/web/components/site/docs-cta.tsx` → 0
  - [ ] `cd packages/web && pnpm exec playwright test e2e/landing.spec.ts` → all passed (footer contract)
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check` → exit 0
  **QA scenarios**:
  - Scenario: footer + hephaestus band contrast (happy)
    Tool: playwright screenshot
    Steps: 1. `cd packages/web && (PORT=4318 pnpm run dev >/tmp/lcx-dev12.log 2>&1 &)`; poll 90s 2. `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4318/');await p.keyboard.press('End');await p.waitForTimeout(1200);await p.screenshot({path:'../../.omo/evidence/task-12-footer.png'});await b.close();})"`
    Expected (binary): `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4318/');const f=await p.locator('footer').evaluate(e=>getComputedStyle(e).backgroundColor);const links=await p.locator('footer a').count();console.log('footer='+f,'links='+links);await b.close();})"` → `footer=rgb(233, 238, 224)` and `links=` ≥2; screenshot is the audit artifact.
    Capture: screenshot above + append footer= line to .omo/evidence/task-12-footer-links.txt.
    Cleanup: `lsof -ti :4318 | xargs kill -9 2>/dev/null; lsof -i :4318 | wc -l` → `0`
    Evidence: .omo/evidence/task-12-footer.png
  - Scenario: no invented footer links (edge — real rendered anchors, not source grep: footer hrefs are JSX expressions per site-footer.tsx:19,27)
    Tool: playwright one-off script vs the same :4318 dev server
    Steps: 1. from `packages/web` (binding cwd convention): `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://127.0.0.1:4318/');const hrefs=await p.locator('footer a').evaluateAll(as=>as.map(a=>a.getAttribute('href')));const allowed=['https://github.com/code-yeongyu/lazycodex','https://github.com/code-yeongyu/oh-my-openagent','/docs','https://lazycodex.ai'];const bad=hrefs.filter(h=>!allowed.some(x=>h&&h.startsWith(x)));console.log('hrefs='+JSON.stringify(hrefs));console.log(bad.length===0?'FOOTER-LINKS-OK':'FOOTER-LINKS-BAD:'+JSON.stringify(bad));await b.close();})" | tee ../../.omo/evidence/task-12-footer-links.txt`
    Expected: `FOOTER-LINKS-OK` (allowed list = exactly the URLs in SITE_CONFIG:5-9 + /docs; extend the allowed array ONLY from those config values, e.g. the stars URL variant `.../lazycodex/stargazers`).
    Capture: tee above.
    Cleanup: none beyond the happy-path server teardown.
    Evidence: .omo/evidence/task-12-footer-links.txt
  **Commit**: Y | `feat(landing): light hephaestus, docs cta and footer` | Files: packages/web/components/site/{hephaestus-section,docs-cta,site-footer}.tsx

- [ ] 13. Compose the new IA in page.tsx + retire the raster badge (GREEN gate for IA specs)
  **What to do**:
  1. `packages/web/app/page.tsx` — new composition order: SiteHeader → MarketingMain[ MarketingContainer[Hero] → UlwDemoSection → InstallBlock → CommandCards → FeatureWorkflowsSection → TeamModeSection → UlwResearchSection → HephaestusSection → DocsCta ] → SiteFooter. Import the three new sections; REMOVE UltraworkSection import/usage.
  2. DELETE `packages/web/components/site/ultrawork-section.tsx`, `packages/web/components/site/brand-image.tsx`, `packages/web/public/img/badge-ultrawork.png` + `.avif` + `.webp` (verify no remaining importers first: `grep -rn "BrandImage\|badge-ultrawork\|UltraworkSection" packages/web/ --include="*.ts*"`).
  3. GREEN: `cd packages/web && pnpm exec playwright test e2e/landing-sections.spec.ts e2e/ulw-demo.spec.ts` → all passed (Task 5's RED turns GREEN). Then full non-lighthouse sweep: `pnpm exec playwright test --grep-invert "@lighthouse"` → all passed.
  4. Confirm fold contract: demo window top edge within 900px at 1440 (Task 8's deferred check lands here).
  **Must NOT do**: reorder hero/install relative to spec; leave dead imports; delete anything else; touch docs.
  **Parallelization**: Wave 4 | Blocks: 15,F* | Blocked by: 4,5,7,8,9,10,11,12
  **References**:
  - `packages/web/app/page.tsx:1-40` — current composition to rewrite (imports at L1-17, order at L19-37).
  - `packages/web/e2e/landing-sections.spec.ts` (Task 5) — the order contract this must satisfy.
  - Metis #7 — `grep -rn "<article" packages/web/components/site/ | wc -l` sanity before the landing.spec run.
  - Explorer verification: badge-ultrawork referenced ONLY by ultrawork-section.tsx:29; BrandImage only by ultrawork-section — deletion is safe.
  **Acceptance criteria**:
  - [ ] `grep -c "UlwDemoSection\|TeamModeSection\|UlwResearchSection" packages/web/app/page.tsx` → ≥6 (3 imports + 3 JSX usages, each on its own line); `grep -c "UltraworkSection" packages/web/app/page.tsx` → 0
  - [ ] `test ! -f packages/web/components/site/ultrawork-section.tsx && test ! -f packages/web/public/img/badge-ultrawork.png && echo DELETED` → `DELETED`
  - [ ] GREEN: `set -o pipefail; cd packages/web && pnpm exec playwright test e2e/landing-sections.spec.ts e2e/ulw-demo.spec.ts 2>&1 | tee ../../.omo/evidence/task-13-green.txt && echo IA-SPECS-PASS` → `IA-SPECS-PASS` (pairs with task-5-red.txt)
  - [ ] `set -o pipefail; cd packages/web && pnpm exec playwright test --grep-invert "@lighthouse" 2>&1 | tee ../../.omo/evidence/task-13-full-e2e.txt && echo FULL-E2E-PASS` → `FULL-E2E-PASS`
  - [ ] Fold contract (binary): with dev server on :4319 — `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4319/');const box=await p.locator('.ulw-window').boundingBox();console.log('windowTop='+Math.round(box.y), box.y<900?'ABOVE-FOLD':'BELOW-FOLD');await b.close();})"` → `ABOVE-FOLD`
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check && pnpm run build` → exit 0
  **QA scenarios**:
  - Scenario: full-page IA walkthrough (happy)
    Tool: playwright CLI screenshot
    Steps: 1. `cd packages/web && (PORT=4319 pnpm run dev >/tmp/lcx-dev13.log 2>&1 &)`; poll 90s 2. `pnpm exec playwright screenshot --viewport-size=1440,900 --full-page --wait-for-timeout=5000 http://127.0.0.1:4319/ ../../.omo/evidence/task-13-ia-fullpage.png` 3. `pnpm exec playwright screenshot --viewport-size=390,844 --full-page --wait-for-timeout=5000 http://127.0.0.1:4319/ ../../.omo/evidence/task-13-ia-mobile.png`
    Expected (binary, plus screenshots as audit trail): the landing-sections.spec GREEN run IS the order assertion; additionally `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4319/');const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);const demo=await p.locator('#ulw-demo').count();const tm=await p.locator('text=' + 'team').first().count();console.log('bg='+bg,'demo='+demo);await b.close();})"` → `bg=rgb(244, 246, 238) demo=1`; team-mode + ulw-research sections visible in the full-page PNG.
    Capture: two screenshots above.
    Cleanup: `lsof -ti :4319 | xargs kill -9 2>/dev/null; lsof -i :4319 | wc -l` → `0`
    Evidence: .omo/evidence/task-13-ia-fullpage.png, .omo/evidence/task-13-ia-mobile.png
  - Scenario: deleted assets 404 (edge)
    Tool: curl
    Steps: 1. same server: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4319/img/badge-ultrawork.png | tee ../../.omo/evidence/task-13-badge-404.txt`
    Expected: `404`
    Capture: tee above.
    Cleanup: same teardown as happy path.
    Evidence: .omo/evidence/task-13-badge-404.txt
  **Commit**: Y | `feat(landing): compose the light IA and retire the raster badge` | Files: packages/web/app/page.tsx, deleted files, (e2e spec touch-ups if selector drift found — document in commit body)

- [ ] 14. Docs surface light-coherence audit
  **What to do**: With tokens flipped (Task 1), audit `/docs` end-to-end: sidebar, ToC, tables, blockquotes, links, search field, mobile menu — fix any residual dark-canvas artifact in `packages/web/app/styles/docs.css` (beyond the deliberately-dark pre blocks). Verify no-JS SSR contract untouched.
  **Must NOT do**: lighten code blocks (locked dark); touch docs content .md files or generation script logic; change docs-sections.ts.
  **Parallelization**: Wave 3 | Blocks: F* | Blocked by: 1 (docs surface flips with tokens; runs parallel to 7/11 — its file scope, docs.css leftovers, is sequential-safe because Task 1 finished in Wave 1)
  **References**:
  - `packages/web/app/styles/docs.css` (514 LOC; ~95% token-driven; pre block L313-327 stays dark).
  - `e2e/docs.spec.ts:15-126` — nav/order/literals/no-JS contracts that must stay green.
  **Acceptance criteria**:
  - [ ] `set -o pipefail; cd packages/web && pnpm exec playwright test e2e/docs.spec.ts 2>&1 | tee ../../.omo/evidence/task-14-docs-spec.txt && echo DOCS-SPEC-PASS` → `DOCS-SPEC-PASS`
  - [ ] `cd packages/web && pnpm exec biome lint app e2e components lib` → exit 0
  **QA scenarios**:
  - Scenario: docs renders light with dark code blocks (happy)
    Tool: playwright CLI screenshot
    Steps: 1. `cd packages/web && (PORT=4320 pnpm run dev >/tmp/lcx-dev14.log 2>&1 &)`; poll 90s 2. `pnpm exec playwright screenshot --viewport-size=1440,2000 --wait-for-timeout=4000 "http://127.0.0.1:4320/docs" ../../.omo/evidence/task-14-docs-light.png` 3. mobile: `pnpm exec playwright screenshot --viewport-size=390,844 --wait-for-timeout=4000 "http://127.0.0.1:4320/docs" ../../.omo/evidence/task-14-docs-mobile.png`
    Expected (binary): `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://127.0.0.1:4320/docs');const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);const pre=await p.locator('.docs-content pre').first().evaluate(e=>getComputedStyle(e).backgroundColor).catch(()=>'none');console.log('docs-bg='+bg,'pre-bg='+pre);await b.close();})"` → `docs-bg=rgb(244, 246, 238)` AND `pre-bg=rgb(12, 16, 14)` (docs canvas flipped light, code blocks still deliberately dark); screenshots are the audit artifacts.
    Capture: screenshots above + append the docs-bg/pre-bg line to .omo/evidence/task-14-docs-spec.txt.
    Cleanup: `lsof -ti :4320 | xargs kill -9 2>/dev/null; lsof -i :4320 | wc -l` → `0`
    Evidence: .omo/evidence/task-14-docs-light.png, .omo/evidence/task-14-docs-mobile.png
  - Scenario: no-JS SSR intact (edge)
    Tool: playwright one-off script
    Steps: 1. same server 2. from `packages/web`: `node -e "import('@playwright/test').then(async ({chromium})=>{const b=await chromium.launch();const c=await b.newContext({javaScriptEnabled:false});const p=await c.newPage();await p.goto('http://127.0.0.1:4320/docs');const n=await p.locator('h2').count();const line='h2count='+n+' '+(n>=6?'NOJS-SSR-OK':'NOJS-SSR-FAIL');console.log(line);require('fs').writeFileSync('../../.omo/evidence/task-14-nojs.txt',line);await b.close();})"`
    Expected: printed line ends `NOJS-SSR-OK` (fails loudly as NOJS-SSR-FAIL when sections aren't server-rendered)
    Capture: writeFileSync above.
    Cleanup: same teardown.
    Evidence: .omo/evidence/task-14-nojs.txt
  **Commit**: Y | `fix(docs): light-theme coherence for the docs surface` | Files: packages/web/app/styles/docs.css (only if fixes needed; else no commit — record "no changes needed" in evidence)

- [ ] 15. Copy-ledger completeness + grounding check
  **What to do**: Fill `.omo/evidence/copy-ledger.md` (Task 2 skeleton): one row per NEW visible string introduced by this redesign (teamMode/ulwResearch config keys, ulw-demo section intro, window-theme toggle labels "Light"/"Dark"/"Demo window theme" [UI chrome — cite the toggle decision + desktop app.png artifact], any heading changed). Scene strings covered by pointer to `.omo/reference/source-ledger.md`. Then run the grounding checker AGAINST A LIVE SERVER — the script curls `${BASE}/` where BASE = `process.env.ULW_AUDIT_BASE ?? "http://localhost:3000"` (verified in the main-repo source `/Users/yeongyu/local-workspaces/lazycodex/.omo/scripts/copy-grounding-check.mjs:6,31`): 1. start `cd packages/web && (PORT=4321 pnpm run dev >/tmp/lcx-dev15.log 2>&1 &)` and poll up to 90s for `curl -sf http://127.0.0.1:4321/`; 2. run with `ULW_AUDIT_BASE=http://127.0.0.1:4321`; 3. tear the server down (`lsof -ti :4321 | xargs kill -9 2>/dev/null`).
  **Must NOT do**: retro-ledger pre-existing strings (only NEW/changed ones); mark descriptive headings as hard quotes (label them "descriptive heading over grounded content" per format).
  **Parallelization**: Wave 5 | Blocks: F* | Blocked by: 11,13
  **References**:
  - `/Users/yeongyu/local-workspaces/lazycodex/.omo/evidence/copy-ledger.md` — format exemplar.
  - `.omo/reference/source-ledger.md` (Task 2) — scene grounding.
  - `git diff origin/main -- packages/web/lib/site-config.ts packages/web/components/site/` — the authoritative list of NEW strings to ledger.
  **Acceptance criteria**:
  - [ ] Every string in `git diff origin/main -- packages/web/lib/site-config.ts` additions appears in a ledger row: spot-verify `grep -c "teamMode\|ulwResearch" .omo/evidence/copy-ledger.md` → ≥2
  - [ ] `set -o pipefail; ULW_AUDIT_BASE=http://127.0.0.1:4321 node .omo/scripts/copy-grounding-check.mjs 2>&1 | tee .omo/evidence/task-15-grounding.txt && echo GROUNDING-PASS` → `GROUNDING-PASS` — SCOPE NOTE: this checker only validates `site-config.ts` strings against the rendered page (its own header, main-repo source L10); it does NOT cover component-level strings. Component coverage is the next criterion.
  - [ ] Write and run `.omo/scripts/new-string-audit.mjs` (pure Node + child_process git, zero deps; ledger path from `LEDGER_PATH` env, default `.omo/evidence/copy-ledger.md`): (a) collect added lines from `git diff origin/main -- packages/web/components/site packages/web/lib/site-config.ts`; (b) extract candidate visible literals — double-quoted strings ≥8 chars and JSX text `>text<` ≥8 chars (threshold 8 so "Demo window theme" is caught), skipping pure className/attr values (lines matching `className=|aria-|data-|href=|id=`... only when the literal is the attribute value, not JSX text); (c) each candidate must satisfy BOTH: (i) grounding — appears (grep -F) in the prior branch `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/factory-tone-landing-ulw-demo/packages/web/` sources OR `packages/web/content/docs/*.md` OR `plugins/omo/skills/**/SKILL.md` OR is itself quoted in the ledger's Source column; AND (ii) ledger coverage — appears verbatim in `.omo/evidence/copy-ledger.md` OR its component/config-key `## section` exists in the ledger with a ported-verbatim row; (d) print `MISSING: <literal> (grounding|ledger)` per failure and exit 1, else print `NEW-STRINGS-OK`. Run: `set -o pipefail; node .omo/scripts/new-string-audit.mjs 2>&1 | tee .omo/evidence/task-15-new-strings.txt && echo AUDIT-PASS` → last lines `NEW-STRINGS-OK` + `AUDIT-PASS`.
  - [ ] Toggle labels explicitly ledgered: `grep -c "Demo window theme" .omo/evidence/copy-ledger.md` → ≥1 (row also covering "Light"/"Dark" as UI chrome citing the toggle decision + desktop app.png artifact).
  **QA scenarios**:
  - Scenario: ledger covers a sampled new string (happy)
    Tool: CLI stdout
    Steps: 1. `S=$(git -C . diff origin/main -- packages/web/lib/site-config.ts | grep '^+' | grep -oE '"[A-Z][^"]{15,}"' | head -1 | tr -d '"')` 2. `grep -F "$S" .omo/evidence/copy-ledger.md && echo LEDGERED || echo MISSING` → tee .omo/evidence/task-15-sample.txt
    Expected: `LEDGERED`
    Capture: tee above.
    Cleanup: none (read-only)
    Evidence: .omo/evidence/task-15-sample.txt
  - Scenario: the new-string audit actually fails on an uncovered string (edge — proves the checker has teeth)
    Tool: CLI stdout (the audit script MUST read the ledger path from `LEDGER_PATH` env, default `.omo/evidence/copy-ledger.md` — build this into its spec)
    Steps: 1. `printf '# empty ledger\n' > /tmp/ledger-empty.md` 2. from worktree root: `set -o pipefail; LEDGER_PATH=/tmp/ledger-empty.md node .omo/scripts/new-string-audit.mjs 2>&1 | tee .omo/evidence/task-15-negative.txt; echo "exit=$?" >> .omo/evidence/task-15-negative.txt`
    Expected: output contains at least one `MISSING:` line AND the recorded line is `exit=1` (with pipefail, `$?` is node's status, not tee's). Zero candidates would mean the extraction is broken (the diff DID add visible strings — ulwDemo/teamMode/ulwResearch): treat that as scenario FAILURE.
    Capture: the tee + echo above.
    Cleanup: `rm -f /tmp/ledger-empty.md && test ! -f /tmp/ledger-empty.md && echo clean`
    Evidence: .omo/evidence/task-15-negative.txt
  **Commit**: N (ledger lives uncommitted under .omo/) | — | Files: .omo/evidence/copy-ledger.md

## Final Verification Wave
> Runs in parallel after ALL todos. Each reviewer returns APPROVE or REJECT.

- [ ] F1. Plan compliance audit — read this plan end-to-end; verify every Must Have exists (open the real files / run the commands), every Must NOT Have absent (`grep -rn "bg-black\b" packages/web/components` finding only sanctioned dark surfaces; `git log --stat` shows no `.omo/` commits; `git diff origin/main --name-only` contains no forbidden files: apple-icon.png, lib/github-stars*, api route, responsive/seo/github-stars/home specs), every evidence file exists under `.omo/evidence/`.
- [ ] F2. Code quality review — from `packages/web`, every piped command under `set -o pipefail`: `pnpm exec biome lint app e2e components lib && pnpm run type-check && pnpm run build && echo BUILD-PASS` → `BUILD-PASS`; then `set -o pipefail; pnpm exec playwright test --grep-invert "@lighthouse" 2>&1 | tee ../../.omo/evidence/f2-e2e.txt && echo E2E-PASS` → `E2E-PASS`; then `set -o pipefail; pnpm exec playwright test --grep "@lighthouse" 2>&1 | tee ../../.omo/evidence/f2-lighthouse.txt && echo LH-PASS` → `LH-PASS` with 100×4 visible for mobile AND desktop inside f2-lighthouse.txt; then `set -o pipefail; pnpm exec opennextjs-cloudflare build 2>&1 | tee ../../.omo/evidence/f2-opennext.txt && echo OPENNEXT-PASS` → `OPENNEXT-PASS`. Review the full diff for `as any`/empty catch/console.log/dead code/unused tokens.
- [ ] F3. Real manual QA — from clean state execute EVERY QA scenario from every todo plus integration passes: desktop 1440 full-page + mobile 390 full-page screenshots of `/` and `/docs`; demo autoplay progression 01→02 observed; tab-jump; play/pause; window-theme toggle light↔dark (screenshots BOTH themes); reduced-motion (autoplay stays scene 01); keyboard: Tab reaches toggle buttons + scene tabs, arrow keys move tabs; hover audit (hover feedback ONLY on links/buttons/tabs). Save all to `.omo/evidence/final-qa/`. Use omo-visual-qa discipline for judgment calls (spacing, contrast, hierarchy) on both viewports.
- [ ] F4. Scope fidelity check — per todo, diff spec vs actual changes (`git show <commit> --stat`): nothing missing, nothing beyond spec, no cross-task file contamination, no unaccounted files in `git status --short` (except `.omo/`), every commit message matches the Commit line of its todo.

## Commit strategy
- One commit per todo, conventional, explicit paths only (never `git add -A`; `.omo/**` never staged). Pre-commit for every commit: `pnpm exec biome lint app e2e components lib && pnpm run type-check` green from `packages/web`.
- 1: `feat(design-system): flip tokens to the light sage palette` — app/styles/*, docs.css
- 2: `feat(demo): port source-grounded ulw demo scene data` — lib/ulw-demo-scenes.ts, lib/site-config.ts (ulwDemo/teamMode/ulwResearch keys)
- 3: `docs(design): rewrite DESIGN.md for the light system` — DESIGN.md
- 4: `feat(brand): light meta, manifest, OG and favicon surfaces` — app/layout.tsx, app/manifest.ts, app/og-image-theme.ts, app/icon.svg
- 5: `test(e2e): port demo specs and encode the new light IA (red)` — e2e/ulw-demo.spec.ts, e2e/landing-sections.spec.ts
- 6: `refactor(design-system): light primitives and dotted rule grid` — components/design-system/*
- 7: `feat(demo): codex window on light canvas with window-theme toggle` — components/site/ulw-demo/*, app/styles/ulw-demo.css, app/globals.css, app/page.tsx (minimal mount)
- 8: `feat(landing): light declarative hero and header` — components/site/hero.tsx, site-header.tsx
- 9: `feat(landing): light install block and command cards` — components/site/{install-block,command-card,command-cards,copy-button}.tsx
- 10: `feat(landing): light feature workflows and skills band` — components/site/feature-workflows-section.tsx
- 11: `feat(landing): port team mode and ulw-research sections to light` — components/site/{team-mode-section,ulw-research-section}.tsx
- 12: `feat(landing): light hephaestus, docs cta and footer` — components/site/{hephaestus-section,docs-cta,site-footer}.tsx
- 13: `feat(landing): compose the light IA and retire the raster badge` — app/page.tsx, deletions, e2e/landing-sections.spec.ts
- 14: `fix(docs): light-theme coherence for the docs surface` — app/styles/docs.css (if needed)
- 15: (no commit — ledger is uncommitted `.omo/` evidence)

## Delivery runbook (orchestrator-executed, AFTER F1-F4 all APPROVE)
> Exact commands; run from the worktree root `/Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/light-greeny-redesign-interactive-demo`. The repo's `pr-source-guidance.yml` bot auto-closes every PR — step 5 VERIFIES the close instead of fighting it. NEVER push to main.

1. Rebase onto current main (marketplace syncs may have advanced it):
   `git fetch origin main && git rebase origin/main` → expected: `Successfully rebased` or `up to date`. On conflict: STOP, report (packages/web conflicts are unexpected — origin syncs don't touch it).
2. Re-verify after rebase (cheap gate): `cd packages/web && pnpm exec biome lint app e2e components lib && pnpm run type-check && pnpm run build && echo REBASE-GATE-PASS` → `REBASE-GATE-PASS`.
3. Push: `git push -u origin code-yeongyu/light-greeny-redesign-interactive-demo` → expected: branch on origin.
4. Create the PR (English body summarizing per the work-with-pr template: Summary / Changes by area / QA & Evidence with artifact names / Risks & Residuals incl. "Cubic + auto-merge gates: SKIPPED — repo auto-closes all PRs by policy"). Write body to `.omo/pr-body.md` first, then:
   `gh pr create --base main --head code-yeongyu/light-greeny-redesign-interactive-demo --title "feat(web): light sage redesign with interactive Codex-window ultrawork demo" --body-file .omo/pr-body.md` → capture the PR URL.
5. Verify the expected auto-close + one-shot CI, bounded poll (no sleep-forever):
   `for i in $(seq 1 30); do S=$(gh pr view <PR#> --json state -q .state); [ "$S" = "CLOSED" ] && break; sleep 10; done; echo "state=$S"` → `state=CLOSED` (by github-actions[bot] — confirm with `gh api repos/code-yeongyu/lazycodex/issues/<PR#>/events --jq '.[] | select(.event=="closed") | .actor.login'` → `github-actions[bot]`). Record `gh run list --branch code-yeongyu/light-greeny-redesign-interactive-demo --limit 5` output (the `opened` event triggers one web-ci run; capture its conclusion — if it reports failure, treat as Gate A failure: fix and re-verify locally even though the PR is closed).
   Evidence: `gh pr view <PR#> --json url,state,title > .omo/evidence/delivery-pr.json`
6. Final report to the user states: branch pushed, PR URL, auto-closed-by-policy note, all local gates green with evidence paths, and that landing the change on main (production deploy via web-deploy.yml) is the owner's direct-push decision — NOT performed.

## Success criteria

### Verification commands
```bash
cd /Users/yeongyu/local-workspaces/lazycodex-wt/code-yeongyu/light-greeny-redesign-interactive-demo/packages/web
pnpm exec biome lint app e2e components lib     # Expected: no errors (pnpm run lint covers app+e2e only — insufficient)
pnpm run type-check                             # Expected: exit 0
pnpm run build                                  # Expected: compiled successfully
pnpm exec playwright test --grep-invert "@lighthouse"   # Expected: all passed
pnpm exec playwright test --grep "@lighthouse"          # Expected: 100/100/100/100 mobile AND desktop
pnpm exec opennextjs-cloudflare build           # Expected: exit 0
node ../../.omo/scripts/contrast-check.mjs      # Expected: ALL PASS
git -C .. log --oneline origin/main..HEAD       # Expected: ~14 conventional commits
```

### Final checklist
- [ ] All Must Have present
- [ ] All Must NOT Have absent
- [ ] All QA evidence captured under .omo/evidence/ (incl. lighthouse artifacts, both window themes, 1440+390, /docs)
- [ ] Branch pushed; English PR created; auto-close by repo policy recorded in final report

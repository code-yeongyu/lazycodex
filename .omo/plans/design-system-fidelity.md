# Design System Fidelity Refactor

## TL;DR
> Summary:      Preserve the current LazyCodex landing/docs UI exactly while extracting the existing visual language into an explicit design system, then prove no design, copy, DOM behavior, docs navigation, ToC, landing, SEO, or performance regression occurred.
> Deliverables:
> - Behavior-preserving design-system refactor for `packages/web`
> - Updated `packages/web/DESIGN.md` that codifies the rendered UI tokens and components
> - Token/theme/primitives split that keeps Tailwind v4, Next.js 16, React 19, and current app behavior intact
> - Browser baseline/after screenshots, image-diff JSON, docs interaction logs, automated test logs, Lighthouse reports
> - Atomic commits, pushed branch, and GitHub PR
> Effort:       Large
> Risk:         High - the refactor crosses landing, docs, CSS tokens, generated docs content, OG image theming, and visual-regression-sensitive surfaces.

## Scope
### Must have
- Work only in `/Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity`, with implementation scope limited to `packages/web` and `.omo/evidence`.
- Fetch/pull latest from `origin/main` before implementation, then keep branch `code-yeongyu/design-system-fidelity` rebased or fast-forwarded onto the latest base.
- Preserve the current rendered landing visual surface exactly: near-black emerald canvas/card identity in `packages/web/DESIGN.md:3-69`, `packages/web/app/globals.css:14-114`, and `packages/web/components/site/hero.tsx:4-98`.
- Preserve existing visible copy by keeping `packages/web/lib/site-config.ts:1-82` and docs markdown content semantically unchanged unless the task is explicitly about `DESIGN.md`.
- Preserve docs behavior exactly: `⌘K` / `Ctrl-K` search focus, search filtering, hash navigation, mobile menu open/close, section scroll-spy, heading scroll-spy, right ToC, and prev/next cards from `packages/web/components/docs/docs-shell.tsx:25-143`, `packages/web/components/docs/docs-sidebar.tsx:21-85`, `packages/web/components/docs/docs-toc.tsx:11-36`, and `packages/web/app/styles/docs.css:68-514`.
- Preserve generated docs pipeline behavior from `packages/web/scripts/generate-docs-content.mjs:1-142`, `packages/web/lib/docs-source.ts:1-21`, and section order from `packages/web/lib/docs-sections.ts:30-80`.
- Preserve current SEO and app metadata behavior from `packages/web/app/layout.tsx:12-122`, `packages/web/e2e/seo.spec.ts:24-155`, `packages/web/app/opengraph-image.tsx`, and `packages/web/app/og-image-theme.ts`.
- Keep Next.js production verification path: `packages/web/playwright.config.ts:59-67` runs `pnpm run build && pnpm run start`; do not replace production-build tests with dev-server-only checks.
- Use Tailwind v4 CSS-first configuration already present in `packages/web/app/globals.css:1-4`, `packages/web/postcss.config.mjs:1-8`, and `packages/web/package.json:35-43`.
- Keep TypeScript strictness from `packages/web/tsconfig.json:2-40` and Biome lint style from `packages/web/biome.json:1-49`.
- Use captured real-browser evidence under `.omo/evidence/task-<N>-<slug>.<ext>` for every task.
- Push the branch and create a PR after all local and manual QA gates pass.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not intentionally change visible product copy, landing order, docs content, nav labels, button labels, section headings, OG text, or metadata copy.
- Do not change the LazyCodex visual identity away from the current dark emerald/mint surface; no cyan/teal reintroduction except documented legacy aliases in `DESIGN.md:17-20`.
- Do not “fix” the page to stale `DESIGN.md` values if they differ from the rendered UI; codify the current rendered UI as the preservation baseline. Current known mismatch: `DESIGN.md:14-20` lists older `#10b981/#059669/#065f46/#34d399/#6ee7b7` values while `app/globals.css:29-47` renders `#22c55e/#16a34a/#15803d/#4ade80/#86efac`.
- Do not add shadcn, framer-motion, a CSS-in-JS library, new font downloads, or external UI kits.
- Do not add new visible landing sections, new marketing copy, decorative blobs/orbs, gradients unrelated to current card layers, new images, or new icons that change the visual read.
- Do not weaken accessibility, SEO, Lighthouse, reduced-motion, focus-ring, no-JS docs SSR, or responsive behavior to make the refactor easier.
- Do not rewrite generated `packages/web/lib/docs-content.generated.ts` manually; only regenerate through `node ./scripts/generate-docs-content.mjs`.
- Do not commit `.omo/evidence`, Playwright reports, `.next`, `.open-next`, or temporary server logs.
- Do not overwrite unrelated dirty work. Planner exploration found existing `.omo/ulw-loop/design-system-fidelity/*` state, and the final sanity check saw production-path changes outside this plan file: `packages/web/DESIGN.md`, `packages/web/app/globals.css`, and `packages/web/app/styles/design-system.css`. Treat those as external/user or concurrent-agent changes; Task 1 must inspect, adopt, or explicitly reconcile them before any executor edits.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD/characterization-first for refactor + Playwright (`@playwright/test`) + existing TypeScript/Biome/Next build/Lighthouse gates
- QA policy: every task has agent-executed scenarios
- Evidence: `.omo/evidence/task-<N>-<slug>.<ext>`

Required command set, run from `/Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web` unless stated otherwise:
- Install/check dependencies: `pnpm install --frozen-lockfile`
- Generate docs: `node ./scripts/generate-docs-content.mjs`
- Lint: `pnpm run lint`
- Typecheck: `pnpm run type-check`
- Production build: `pnpm run build`
- Focused e2e: `pnpm exec playwright test e2e/landing.spec.ts e2e/docs.spec.ts e2e/responsive.spec.ts e2e/seo.spec.ts --project=chromium`
- Full e2e: `pnpm run test:e2e`
- Lighthouse: `pnpm run test:lighthouse`
- Visual diff script: `bun /Users/yeongyu/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/visual-qa/scripts/cli.ts image-diff <baseline.png> <after.png>`

Primary external references for the executor:
- External: `https://nextjs.org/docs` - Next.js App Router, production build/start, metadata, and file conventions
- External: `https://tailwindcss.com/docs/theme` - Tailwind CSS v4 `@theme` CSS-first token model
- External: `https://tailwindcss.com/docs/functions-and-directives#theme-directive` - Tailwind v4 theme directive
- External: `https://playwright.dev/docs/screenshots` - Playwright screenshot capture
- External: `https://playwright.dev/docs/test-snapshots` - Playwright visual comparison patterns

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Wave 1 (serial safety gate; no dependencies):
- Task 1: Sync branch, protect dirty state, and install dependencies

Wave 2 (after Wave 1):
- Task 2: depends [1] - Capture baseline rendered UI and behavior evidence
- Task 3: depends [1] - Add characterization coverage for design-system fidelity
- Task 4: depends [1] - Reconcile `DESIGN.md` to the current rendered design system
- Task 5: depends [1] - Add design-token drift guard and package script

Wave 3 (after Wave 2):
- Task 6: depends [4, 5] - Extract CSS tokens and gradient utilities without cascade drift
- Task 7: depends [4, 5] - Extract TypeScript theme tokens for OG/meta surfaces
- Task 8: depends [3, 4, 5] - Extract shared SVG/icon/brand primitives without DOM behavior drift

Wave 4 (after Wave 3):
- Task 9: depends [6, 8] - Migrate landing components to design-system primitives
- Task 10: depends [6, 8] - Migrate docs components/styles to design-system primitives
- Task 11: depends [7, 8] - Align OG/Twitter/fav visual assets with shared tokens

Wave 5 (after Wave 4):
- Task 12: depends [2, 9, 10, 11] - Run after-state visual diff and interaction QA
- Task 13: depends [9, 10, 11, 12] - Run complete automated gates and fix-only loop
- Task 14: depends [13] - Commit audit, push branch, create PR, and verify PR checks

Critical path: Task 1 -> Task 2 -> Task 6 -> Task 9 -> Task 12 -> Task 13 -> Task 14

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1    | none       | 2, 3, 4, 5 | none |
| 2    | 1          | 12     | 3, 4, 5 |
| 3    | 1          | 8, 13  | 2, 4, 5 |
| 4    | 1          | 6, 7, 8 | 2, 3, 5 |
| 5    | 1          | 6, 7, 8, 13 | 2, 3, 4 |
| 6    | 4, 5       | 9, 10  | 7, 8 |
| 7    | 4, 5       | 11     | 6, 8 |
| 8    | 3, 4, 5    | 9, 10, 11 | 6, 7 |
| 9    | 6, 8       | 12, 13 | 10, 11 |
| 10   | 6, 8       | 12, 13 | 9, 11 |
| 11   | 7, 8       | 12, 13 | 9, 10 |
| 12   | 2, 9, 10, 11 | 13 | none |
| 13   | 9, 10, 11, 12 | 14 | none |
| 14   | 13         | final verification | none |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Sync branch, protect dirty state, and install dependencies

  What to do: From the worktree root, fetch latest `origin/main`, fast-forward or rebase `code-yeongyu/design-system-fidelity` onto it, install `packages/web` dependencies with the locked package manager, and write a preflight evidence file that records branch, upstream, HEAD, base HEAD, package versions, and dirty production paths. Inspect any pre-existing production diffs and decide whether they are already-completed plan slices or unrelated dirty work before editing.
  Must NOT do: Do not reset, stash-pop, force-push, delete `.omo/ulw-loop`, or modify production files. If `packages/web` has unrelated dirty changes before implementation, stop and record `BLOCKED: dirty production files`; if the diffs match planned Task 4/6 work, record them as adopted evidence before continuing.

  Parallelization: Can parallel: NO | Wave 1 | Blocks: [2, 3, 4, 5] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/package.json:6-24` - pnpm version, scripts, and build/test commands to preserve
  - Pattern:  `packages/web/pnpm-workspace.yaml:1-14` - pnpm 11 allowBuilds/overrides that must stay intact
  - Pattern:  `packages/web/playwright.config.ts:59-67` - production web server command used by e2e
  - Pattern:  `packages/web/tsconfig.json:2-40` - strict TypeScript baseline
  - Pattern:  `packages/web/biome.json:1-49` - Biome lint baseline
  - External: `https://pnpm.io/cli/install` - `pnpm install --frozen-lockfile` behavior

  Acceptance criteria (agent-executable only):
  - [ ] `git -C /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity merge-base --is-ancestor origin/main HEAD` exits `0`
  - [ ] `git -C /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity status --porcelain -- packages/web` prints nothing before implementation begins
  - [ ] `cd packages/web && pnpm install --frozen-lockfile` exits `0`
  - [ ] `.omo/evidence/task-1-preflight.txt` contains branch name, `HEAD`, `origin/main`, `pnpm --version`, `node --version`, and `pnpm list next react tailwindcss @playwright/test --depth=0`

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: use Chrome to drive the page; if Chrome is not available, download and use agent-browser (https://github.com/vercel-labs/agent-browser). Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: latest base and clean package scope
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && mkdir -p .omo/evidence && { git fetch origin main && git status --short --branch && git merge-base --is-ancestor origin/main HEAD && git status --porcelain -- packages/web && git rev-parse HEAD && git rev-parse origin/main && cd packages/web && pnpm install --frozen-lockfile && node --version && pnpm --version && pnpm list next react tailwindcss @playwright/test --depth=0; } | tee .omo/evidence/task-1-preflight.txt
    Expected: command exits 0; `packages/web` dirty-status section is empty; evidence file is non-empty
    Evidence: .omo/evidence/task-1-preflight.txt

  Scenario: unrelated production dirt is detected
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git status --porcelain -- packages/web | tee .omo/evidence/task-1-dirty-production.txt && test ! -s .omo/evidence/task-1-dirty-production.txt
    Expected: command exits 0 only when no pre-existing production-path changes exist
    Evidence: .omo/evidence/task-1-dirty-production.txt
  ```

  Commit: NO | Message: `chore(web): record design-system preflight` | Files: []

- [ ] 2. Capture baseline rendered UI and behavior evidence

  What to do: Before changing UI code, run the production app and capture baseline screenshots for `/`, `/docs`, `/opengraph-image`, and `/twitter-image` at fixed viewports. Also capture a browser action log proving no console errors and no horizontal overflow. Store all baseline artifacts under `.omo/evidence/task-2-baseline/`.
  Must NOT do: Do not update source files, snapshots, or package scripts in this task. Do not use a dev server as the baseline.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [12] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/components/site/hero.tsx:4-98` - primary landing visual baseline
  - Pattern:  `packages/web/app/page.tsx:12-39` - landing composition order
  - Pattern:  `packages/web/app/docs/page.tsx:33-55` - docs page shell and hero
  - Pattern:  `packages/web/app/styles/docs.css:68-514` - docs responsive layout and interactions
  - Pattern:  `packages/web/e2e/lighthouse.spec.ts:8-25` - production/real Chrome audit posture
  - External: `https://playwright.dev/docs/screenshots` - screenshot capture API

  Acceptance criteria (agent-executable only):
  - [ ] `.omo/evidence/task-2-baseline/screenshots/home-1440.png`, `home-390.png`, `docs-1280.png`, `docs-390.png`, `og-image.png`, and `twitter-image.png` exist and are non-empty
  - [ ] `.omo/evidence/task-2-baseline/browser-log.json` records zero console errors and zero horizontal overflow for `/` and `/docs`
  - [ ] `cd packages/web && pnpm run build` exits `0` before screenshot capture

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: production baseline screenshot capture
    Tool:     playwright(real Chrome)
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && mkdir -p .omo/evidence/task-2-baseline/screenshots && cd packages/web && pnpm run build && (PORT=41730 pnpm run start > ../../.omo/evidence/task-2-baseline/server.log 2>&1 & echo $! > ../../.omo/evidence/task-2-baseline/server.pid) && node - <<'JS'
              const { chromium } = await import("@playwright/test");
              const fs = await import("node:fs/promises");
              const base = "http://127.0.0.1:41730";
              const browser = await chromium.launch({ channel: "chrome", headless: true });
              const log = [];
              async function shot(path, width, height, name) {
                const page = await browser.newPage({ viewport: { width, height } });
                const errors = [];
                page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
                await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
                await page.screenshot({ path: `../../.omo/evidence/task-2-baseline/screenshots/${name}.png`, fullPage: true });
                log.push({ path, width, height, errors, overflow });
                await page.close();
              }
              await shot("/", 1440, 900, "home-1440");
              await shot("/", 390, 844, "home-390");
              await shot("/docs", 1280, 800, "docs-1280");
              await shot("/docs", 390, 844, "docs-390");
              await shot("/opengraph-image", 1200, 630, "og-image");
              await shot("/twitter-image", 1200, 630, "twitter-image");
              await browser.close();
              await fs.writeFile("../../.omo/evidence/task-2-baseline/browser-log.json", JSON.stringify(log, null, 2));
              if (log.some((entry) => entry.errors.length > 0 || entry.overflow)) process.exit(1);
              JS
              kill "$(cat ../../.omo/evidence/task-2-baseline/server.pid)"
    Expected: command exits 0; six screenshots and JSON log exist; JSON contains no console errors and no overflow
    Evidence: .omo/evidence/task-2-baseline/browser-log.json

  Scenario: baseline artifact completeness
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && test -s .omo/evidence/task-2-baseline/screenshots/home-1440.png && test -s .omo/evidence/task-2-baseline/screenshots/home-390.png && test -s .omo/evidence/task-2-baseline/screenshots/docs-1280.png && test -s .omo/evidence/task-2-baseline/screenshots/docs-390.png && test -s .omo/evidence/task-2-baseline/screenshots/og-image.png && test -s .omo/evidence/task-2-baseline/screenshots/twitter-image.png
    Expected: command exits 0
    Evidence: .omo/evidence/task-2-baseline/screenshots/
  ```

  Commit: NO | Message: `test(web): capture design-system baseline` | Files: []

- [ ] 3. Add characterization coverage for design-system fidelity

  What to do: Add a focused Playwright spec that locks the behavior most likely to drift during extraction: landing copy/order, copy button state, docs `⌘K`/`Ctrl-K` search focus, docs search filtering, mobile menu toggle, `$ulw-loop` hash navigation, active ToC/section state, no-JS docs SSR, and no horizontal overflow on `/` and `/docs` at 390 and 1280 widths. Use existing tolerant selector style from the current e2e suite.
  Must NOT do: Do not add brittle exact full-page snapshots to CI unless the test is explicitly guarded for local visual QA. Do not rewrite existing specs unless needed to share helpers.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [8, 13] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Test:     `packages/web/e2e/landing.spec.ts:14-118` - existing landing behavior patterns and tolerant selectors
  - Test:     `packages/web/e2e/docs.spec.ts:14-126` - existing docs SSR/nav patterns
  - Test:     `packages/web/e2e/responsive.spec.ts:20-113` - viewport/no-overflow patterns
  - Pattern:  `packages/web/components/docs/docs-shell.tsx:34-87` - keyboard focus, hash handling, and scroll-spy effects
  - Pattern:  `packages/web/components/docs/docs-sidebar.tsx:29-85` - search filtering and empty state
  - Pattern:  `packages/web/components/site/copy-button.tsx:11-67` - copy button state and clipboard behavior
  - External: `https://playwright.dev/docs/input` - keyboard and click input behavior

  Acceptance criteria (agent-executable only):
  - [ ] New or updated spec includes tests for docs keyboard search focus, mobile menu, search filter, `$ulw-loop` navigation, copy button state, and no horizontal overflow
  - [ ] `cd packages/web && pnpm exec playwright test e2e/design-system-fidelity.spec.ts --project=chromium` exits `0`
  - [ ] `cd packages/web && pnpm run lint && pnpm run type-check` exits `0`

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: characterization spec passes on current behavior
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && mkdir -p ../../.omo/evidence && pnpm exec playwright test e2e/design-system-fidelity.spec.ts --project=chromium | tee ../../.omo/evidence/task-3-characterization.txt
    Expected: command exits 0; output lists passing tests for landing, docs interactions, copy button, and overflow checks
    Evidence: .omo/evidence/task-3-characterization.txt

  Scenario: no-JS docs SSR edge remains covered
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm exec playwright test e2e/docs.spec.ts --grep "server-renders every section heading without JavaScript" --project=chromium | tee ../../.omo/evidence/task-3-no-js-docs.txt
    Expected: command exits 0; no-JS docs sections remain visible with prose
    Evidence: .omo/evidence/task-3-no-js-docs.txt
  ```

  Commit: YES | Message: `test(web): characterize design-system fidelity` | Files: [`packages/web/e2e/design-system-fidelity.spec.ts`]

- [ ] 4. Reconcile `DESIGN.md` to the current rendered design system

  What to do: Update `packages/web/DESIGN.md` so it is a proper design-system source of truth for the current rendered UI. Preserve all existing identity decisions, add the seven required design-system sections where missing, document the actual CSS variable values from `app/globals.css`, note legacy aliases, document landing/docs/OG components, and state that rendered UI values win over stale prose when preserving fidelity.
  Must NOT do: Do not change app CSS or TS in this task. Do not revise product copy or visual direction. Do not invent new tokens that are not present in current UI.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [6, 7, 8] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/DESIGN.md:3-69` - current design intent and anti-patterns to preserve
  - Pattern:  `packages/web/app/globals.css:14-57` - actual rendered CSS variables to codify
  - Pattern:  `packages/web/app/globals.css:89-114` - gradient utility tokens to document
  - Pattern:  `packages/web/app/styles/docs.css:16-514` - docs component/layout system to document
  - Pattern:  `packages/web/app/og-image-theme.ts:1-30` - OG theme values that must align with design tokens
  - External: `https://tailwindcss.com/docs/theme` - Tailwind v4 token model

  Acceptance criteria (agent-executable only):
  - [ ] `packages/web/DESIGN.md` documents the actual rendered values `#22c55e`, `#16a34a`, `#15803d`, `#4ade80`, and `#86efac`
  - [ ] `git diff -- packages/web/DESIGN.md` is the only production-path diff for this task
  - [ ] `cd packages/web && pnpm run lint && pnpm run type-check` exits `0`

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: design doc token reconciliation
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && rg -n "#22c55e|#16a34a|#15803d|#4ade80|#86efac|--surface-base|--accent-primary|Docs Information Architecture|Components" packages/web/DESIGN.md | tee .omo/evidence/task-4-design-doc-tokens.txt
    Expected: command exits 0; evidence includes actual rendered colors, token names, docs architecture, and component section
    Evidence: .omo/evidence/task-4-design-doc-tokens.txt

  Scenario: documentation-only change guard
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git diff --name-only -- packages/web | tee .omo/evidence/task-4-diff-files.txt && test "$(cat .omo/evidence/task-4-diff-files.txt)" = "packages/web/DESIGN.md"
    Expected: command exits 0; only `packages/web/DESIGN.md` changed in this task
    Evidence: .omo/evidence/task-4-diff-files.txt
  ```

  Commit: YES | Message: `docs(web): codify rendered design system` | Files: [`packages/web/DESIGN.md`]

- [ ] 5. Add design-token drift guard and package script

  What to do: Add a lightweight local script and `package.json` script that audits design-system fidelity: raw color literals outside approved token/theme files, Tailwind v4 import/directive assumptions, `framer-motion` imports, new external UI libraries, visible-copy drift in `SITE_CONFIG`, and manual edits to generated docs content. Keep it dependency-free Node ESM.
  Must NOT do: Do not add npm dependencies. Do not forbid existing approved raw colors in `app/globals.css`, `app/og-image-theme.ts`, `app/opengraph-image.tsx`, `app/manifest.ts`, and `app/layout.tsx` without an explicit allowlist.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [6, 7, 8, 13] | Blocked by: [1]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/package.json:10-24` - script style and package-manager surface
  - Pattern:  `packages/web/app/globals.css:1-4` - Tailwind v4 CSS-first entrypoint
  - Pattern:  `packages/web/postcss.config.mjs:1-8` - `@tailwindcss/postcss` v4 plugin
  - Pattern:  `packages/web/DESIGN.md:64-69` - anti-patterns to enforce
  - Pattern:  `packages/web/lib/docs-content.generated.ts:1` - generated banner
  - Pattern:  `packages/web/lib/site-config.ts:1-82` - visible copy surface to guard

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run check:design` exits `0`
  - [ ] `cd packages/web && pnpm run lint && pnpm run type-check` exits `0`
  - [ ] Script exits non-zero if a temporary forbidden `framer-motion` import is appended to a temp file under `/tmp/design-check-fixture.ts`
  - [ ] Script does not require network or new dependencies

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: design drift guard passes on current code
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run check:design | tee ../../.omo/evidence/task-5-check-design.txt
    Expected: command exits 0; output names checked rules and reports no drift
    Evidence: .omo/evidence/task-5-check-design.txt

  Scenario: forbidden dependency edge is caught
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && printf 'import { motion } from "framer-motion"\\n' > /tmp/design-check-fixture.ts && node ./scripts/check-design-system.mjs /tmp/design-check-fixture.ts > ../../.omo/evidence/task-5-forbidden-import.txt 2>&1; test "$?" -ne 0
    Expected: final `test` exits 0 because the checker rejects the forbidden import
    Evidence: .omo/evidence/task-5-forbidden-import.txt
  ```

  Commit: YES | Message: `test(web): add design-system drift guard` | Files: [`packages/web/package.json`, `packages/web/scripts/check-design-system.mjs`]

- [ ] 6. Extract CSS tokens and gradient utilities without cascade drift

  What to do: Split CSS design-system primitives out of `app/globals.css` into explicit files such as `app/styles/tokens.css` and `app/styles/effects.css`, imported before landing/docs styles. Move existing `@theme`, `:root` variables, focus base rules, and card-gradient utilities without changing names or values. Keep `globals.css` as the app-level import/base entrypoint.
  Must NOT do: Do not rename public CSS variables, remove legacy aliases, change import order in a way that changes cascade, or add new visual effects.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [9, 10] | Blocked by: [4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/app/globals.css:1-114` - CSS source to split exactly
  - Pattern:  `packages/web/app/styles/landing.css:1-30` - landing import currently follows globals
  - Pattern:  `packages/web/app/docs/page.tsx:8` - docs CSS is route-imported separately
  - Pattern:  `packages/web/components/site/hero.tsx:11-20` - depends on `card-gradient-*` utilities and inline gradient values
  - Pattern:  `packages/web/components/site/site-header.tsx:8-64` - depends on global surface/accent tokens
  - External: `https://tailwindcss.com/docs/functions-and-directives#theme-directive` - `@theme` directive placement

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm run build` exits `0`
  - [ ] `rg -n "@theme|--surface-base|--accent-primary|card-gradient" packages/web/app/styles packages/web/app/globals.css` shows all moved tokens/utilities still present exactly once
  - [ ] Visual diff against Task 2 baseline is `similarityScore >= 99.5` for home/docs same-viewport pairs

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: CSS extraction build and token audit
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm run build | tee ../../.omo/evidence/task-6-css-extraction-build.txt
    Expected: command exits 0
    Evidence: .omo/evidence/task-6-css-extraction-build.txt

  Scenario: no cascade drift smoke screenshot
    Tool:     playwright(real Chrome)
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && mkdir -p .omo/evidence/task-6-css/screenshots && cd packages/web && (PORT=41731 pnpm run start > ../../.omo/evidence/task-6-css/server.log 2>&1 & echo $! > ../../.omo/evidence/task-6-css/server.pid) && node - <<'JS'
              const { chromium } = await import("@playwright/test");
              const browser = await chromium.launch({ channel: "chrome", headless: true });
              const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
              await page.goto("http://127.0.0.1:41731/", { waitUntil: "networkidle" });
              await page.screenshot({ path: "../../.omo/evidence/task-6-css/screenshots/home-1440.png", fullPage: true });
              await browser.close();
              JS
              kill "$(cat ../../.omo/evidence/task-6-css/server.pid)" && bun /Users/yeongyu/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/visual-qa/scripts/cli.ts image-diff ../../.omo/evidence/task-2-baseline/screenshots/home-1440.png ../../.omo/evidence/task-6-css/screenshots/home-1440.png > ../../.omo/evidence/task-6-css/home-1440-diff.json && node --input-type=module -e 'import fs from "node:fs"; const r = JSON.parse(fs.readFileSync("../../.omo/evidence/task-6-css/home-1440-diff.json", "utf8")); if (!r.dimensionsMatch || r.similarityScore < 99.5) process.exit(1)'
    Expected: command exits 0; diff JSON reports dimensionsMatch true and similarityScore >= 99.5
    Evidence: .omo/evidence/task-6-css/home-1440-diff.json
  ```

  Commit: YES | Message: `refactor(web): extract CSS design tokens` | Files: [`packages/web/app/globals.css`, `packages/web/app/styles/tokens.css`, `packages/web/app/styles/effects.css`]

- [ ] 7. Extract TypeScript theme tokens for OG/meta surfaces

  What to do: Create a typed design-system theme module (for example `packages/web/lib/design-system/theme.ts`) that exports readonly palette, typography, dimensions, and OG-card values derived from the rendered CSS token set. Update `app/og-image-theme.ts` and any metadata color usage that can safely consume the shared tokens without altering output.
  Must NOT do: Do not import browser-only CSS into server/OG code. Do not change `/opengraph-image`, `/twitter-image`, favicon, manifest, or metadata output.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [11] | Blocked by: [4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/app/og-image-theme.ts:1-30` - current OG palette/effects source
  - Pattern:  `packages/web/app/opengraph-image.tsx:1-246` - OG image composition using theme values
  - Pattern:  `packages/web/app/twitter-image.tsx:1-12` - Twitter image re-export route
  - Pattern:  `packages/web/app/layout.tsx:12-17` - viewport `themeColor`
  - Pattern:  `packages/web/app/manifest.ts:1-17` - manifest theme/background colors
  - Test:     `packages/web/e2e/seo.spec.ts:114-155` - OG/Twitter/favicon validation

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/seo.spec.ts --project=chromium` exits `0`
  - [ ] `rg -n "palette|themeColor|#22c55e|#4ade80|#86efac" packages/web/lib/design-system packages/web/app/og-image-theme.ts packages/web/app/layout.tsx packages/web/app/manifest.ts` shows shared token usage and no conflicting stale colors
  - [ ] `/opengraph-image` and `/twitter-image` remain 1200x630 PNGs

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: typed theme preserves SEO image contracts
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/seo.spec.ts --project=chromium | tee ../../.omo/evidence/task-7-theme-seo.txt
    Expected: command exits 0; SEO spec confirms OG/Twitter PNG dimensions and icon assets
    Evidence: .omo/evidence/task-7-theme-seo.txt

  Scenario: no stale theme color remains
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && ! rg -n "#10b981|#059669|#065f46|#34d399|#6ee7b7" packages/web/app packages/web/components packages/web/lib --glob '!lib/docs-content.generated.ts' | tee .omo/evidence/task-7-stale-colors.txt
    Expected: command exits 0; no stale pre-render-token values remain in app/component/theme code
    Evidence: .omo/evidence/task-7-stale-colors.txt
  ```

  Commit: YES | Message: `refactor(web): centralize theme tokens` | Files: [`packages/web/lib/design-system/theme.ts`, `packages/web/app/og-image-theme.ts`, `packages/web/app/layout.tsx`, `packages/web/app/manifest.ts`]

- [ ] 8. Extract shared SVG/icon/brand primitives without DOM behavior drift

  What to do: Extract repeated inline SVG concepts into typed reusable primitives under `packages/web/components/ui/`, including the LazyCodex brand mark, search icon, copy/check icons, command glyph icons, and any shared icon props. Replace current inline usage in landing/docs components while preserving size, viewBox, stroke/fill, `aria-hidden`, labels, focus behavior, and class names that affect visual state.
  Must NOT do: Do not add an icon dependency. Do not change button names, link labels, `aria-label`, or SVG geometry unless evidence proves identical rendering.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [9, 10, 11] | Blocked by: [3, 4, 5]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/components/site/site-header.tsx:16-46` - header brand mark SVG
  - Pattern:  `packages/web/components/site/hero.tsx:60-98` - hero mark SVG
  - Pattern:  `packages/web/components/docs/docs-sidebar.tsx:87-105` - search glyph SVG
  - Pattern:  `packages/web/components/site/copy-button.tsx:31-64` - copy/check SVG state
  - Pattern:  `packages/web/components/site/command-card.tsx:8-68` - command glyph switch
  - Test:     `packages/web/e2e/landing.spec.ts:40-49` - copy button visibility
  - Test:     `packages/web/e2e/seo.spec.ts:135-155` - favicon/mark asset contracts

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/landing.spec.ts e2e/design-system-fidelity.spec.ts --project=chromium` exits `0`
  - [ ] Header link still has `aria-label="LazyCodex home"` and copy button still has `aria-label="Copy install command"`
  - [ ] Visual diff against Task 2 baseline is `similarityScore >= 99.5` for `/` 1440 and 390 screenshots

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: icon primitives preserve interactive labels
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/landing.spec.ts e2e/design-system-fidelity.spec.ts --project=chromium | tee ../../.omo/evidence/task-8-icons-tests.txt
    Expected: command exits 0; landing and design-fidelity tests pass
    Evidence: .omo/evidence/task-8-icons-tests.txt

  Scenario: no icon dependency was introduced
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && ! rg -n "\"lucide|\"framer-motion|\"@radix-ui|\"@heroicons" package.json pnpm-lock.yaml components app lib | tee ../../.omo/evidence/task-8-no-icon-deps.txt
    Expected: command exits 0; no new icon/UI dependency appears
    Evidence: .omo/evidence/task-8-no-icon-deps.txt
  ```

  Commit: YES | Message: `refactor(web): extract shared visual primitives` | Files: [`packages/web/components/ui/*`, `packages/web/components/site/site-header.tsx`, `packages/web/components/site/hero.tsx`, `packages/web/components/docs/docs-sidebar.tsx`, `packages/web/components/site/copy-button.tsx`, `packages/web/components/site/command-card.tsx`]

- [ ] 9. Migrate landing components to design-system primitives

  What to do: Introduce small, typed landing/design primitives only where they remove real duplication: container, section shell, panel/card, badge/pill, and CTA/button primitives if at least two current components share the pattern. Migrate landing components in small chunks while preserving component order from `app/page.tsx`, copy from `SITE_CONFIG`, exact interactive labels, focus rings, responsive constraints, and visual layout.
  Must NOT do: Do not restructure page order, add landing sections, add visible copy, or chase unrelated file-size refactors. Do not change the hero LCP posture: pure CSS gradients and system-font wordmark.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [12, 13] | Blocked by: [6, 8]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/app/page.tsx:12-39` - landing component order
  - Pattern:  `packages/web/components/site/hero.tsx:4-58` - hero visual and LCP constraints
  - Pattern:  `packages/web/components/site/install-block.tsx:5-25` - install command block and copy button
  - Pattern:  `packages/web/components/site/command-card.tsx:70-102` - command card surface pattern
  - Pattern:  `packages/web/components/site/feature-workflows-section.tsx` - repeated section/card patterns
  - Pattern:  `packages/web/components/site/hephaestus-section.tsx` - repeated section/card patterns
  - Pattern:  `packages/web/components/site/ultrawork-section.tsx` - gradient text/surface patterns
  - Pattern:  `packages/web/components/site/docs-cta.tsx` - CTA/button patterns
  - Test:     `packages/web/e2e/landing.spec.ts:14-118` - landing behavior and order contracts
  - Test:     `packages/web/e2e/responsive.spec.ts:20-113` - responsive landing contract

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/landing.spec.ts e2e/home.spec.ts e2e/responsive.spec.ts e2e/design-system-fidelity.spec.ts --project=chromium` exits `0`
  - [ ] Visual diff against Task 2 baseline is `similarityScore >= 99.5` for `home-1440` and `home-390`
  - [ ] `git diff -- packages/web/lib/site-config.ts packages/web/content/docs` is empty

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: landing behavior and responsive contracts survive primitive migration
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/landing.spec.ts e2e/home.spec.ts e2e/responsive.spec.ts e2e/design-system-fidelity.spec.ts --project=chromium | tee ../../.omo/evidence/task-9-landing-tests.txt
    Expected: command exits 0
    Evidence: .omo/evidence/task-9-landing-tests.txt

  Scenario: no visible copy drift in landing config
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git diff --exit-code -- packages/web/lib/site-config.ts packages/web/content/docs | tee .omo/evidence/task-9-copy-drift.txt
    Expected: command exits 0; no visible copy/content diff
    Evidence: .omo/evidence/task-9-copy-drift.txt
  ```

  Commit: YES | Message: `refactor(web): migrate landing to design primitives` | Files: [`packages/web/components/ui/*`, `packages/web/components/site/*`, `packages/web/app/page.tsx`]

- [ ] 10. Migrate docs components/styles to design-system primitives

  What to do: Extract only behavior-preserving docs primitives where they clarify the design system: docs layout shell, search field, nav group, nav link, ToC link, prev/next card, and docs content token classes. Keep `DocsShell` state semantics and `IntersectionObserver` behavior unchanged. CSS may be reorganized but selectors/classes used by tests and browser behavior must remain stable or be deliberately migrated with tests.
  Must NOT do: Do not change docs section order, generated HTML content, search query semantics, hash URLs, mobile breakpoint behavior, right ToC visibility breakpoints, or no-JS SSR output.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [12, 13] | Blocked by: [6, 8]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/components/docs/docs-shell.tsx:25-143` - docs state and scroll-spy owner
  - Pattern:  `packages/web/components/docs/docs-sidebar.tsx:21-85` - search/nav filtering owner
  - Pattern:  `packages/web/components/docs/docs-toc.tsx:11-36` - ToC render owner
  - Pattern:  `packages/web/components/docs/docs-prev-next.tsx:1-32` - prev/next owner
  - Pattern:  `packages/web/app/styles/docs.css:68-514` - docs layout, ToC, responsive, reduced-motion CSS
  - Pattern:  `packages/web/lib/docs-sections.ts:30-80` - docs order and neighbor contract
  - Test:     `packages/web/e2e/docs.spec.ts:14-126` - docs structure/nav/no-JS contracts

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/docs.spec.ts e2e/design-system-fidelity.spec.ts --project=chromium` exits `0`
  - [ ] Visual diff against Task 2 baseline is `similarityScore >= 99.5` for `docs-1280` and `docs-390`
  - [ ] Browser QA proves `Ctrl-K`/`Meta-K`, mobile menu, search `ulw`, `$ulw-loop` link, and ToC highlighting still work

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: docs interaction contracts survive primitive migration
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm exec playwright test e2e/docs.spec.ts e2e/design-system-fidelity.spec.ts --project=chromium | tee ../../.omo/evidence/task-10-docs-tests.txt
    Expected: command exits 0
    Evidence: .omo/evidence/task-10-docs-tests.txt

  Scenario: manual docs browser path at mobile width
    Tool:     playwright(real Chrome)
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && mkdir -p .omo/evidence/task-10-docs/screenshots && cd packages/web && pnpm run build && (PORT=41732 pnpm run start > ../../.omo/evidence/task-10-docs/server.log 2>&1 & echo $! > ../../.omo/evidence/task-10-docs/server.pid) && node - <<'JS'
              const { chromium } = await import("@playwright/test");
              const fs = await import("node:fs/promises");
              const browser = await chromium.launch({ channel: "chrome", headless: true });
              const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
              const log = [];
              page.on("console", (msg) => { if (msg.type() === "error") log.push({ type: "console-error", text: msg.text() }); });
              await page.goto("http://127.0.0.1:41732/docs", { waitUntil: "networkidle" });
              await page.getByRole("button", { name: "Menu" }).click();
              await page.getByPlaceholder("Search docs...").fill("ulw");
              await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
              await page.getByRole("link", { name: "$ulw-loop" }).click();
              const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
              const url = page.url();
              await page.screenshot({ path: "../../.omo/evidence/task-10-docs/screenshots/docs-mobile-ulw-loop.png", fullPage: true });
              await browser.close();
              await fs.writeFile("../../.omo/evidence/task-10-docs/action-log.json", JSON.stringify({ log, overflow, url }, null, 2));
              if (log.length || overflow || !url.endsWith("#ulw-loop")) process.exit(1);
              JS
              kill "$(cat ../../.omo/evidence/task-10-docs/server.pid)"
    Expected: command exits 0; URL ends `#ulw-loop`; no console errors; no overflow; screenshot exists
    Evidence: .omo/evidence/task-10-docs/action-log.json
  ```

  Commit: YES | Message: `refactor(web): migrate docs to design primitives` | Files: [`packages/web/components/docs/*`, `packages/web/components/ui/*`, `packages/web/app/styles/docs.css`]

- [ ] 11. Align OG/Twitter/fav visual assets with shared tokens

  What to do: Ensure OG/Twitter/fav routes use the shared theme/brand primitives where safe while producing exactly the same PNG/SVG dimensions, MIME types, and visual identity. If component reuse would alter ImageResponse output, prefer token reuse only and document that boundary in `DESIGN.md`.
  Must NOT do: Do not change `1200x630` OG/Twitter dimensions, icon path conventions, metadata tags, or generated image text.

  Parallelization: Can parallel: YES | Wave 4 | Blocks: [12, 13] | Blocked by: [7, 8]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/app/opengraph-image.tsx:1-246` - OG image route and visual composition
  - Pattern:  `packages/web/app/twitter-image.tsx:1-12` - Twitter image export
  - Pattern:  `packages/web/app/icon.svg` - canonical favicon asset
  - Pattern:  `packages/web/app/og-brand-mark.tsx:1-32` - OG brand mark helper
  - Pattern:  `packages/web/app/layout.tsx:47-62` - OpenGraph/Twitter metadata integration
  - Test:     `packages/web/e2e/seo.spec.ts:52-75` - OG/Twitter meta assertions
  - Test:     `packages/web/e2e/seo.spec.ts:114-155` - OG/Twitter image and icon assertions

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run type-check && pnpm exec playwright test e2e/seo.spec.ts --project=chromium` exits `0`
  - [ ] Visual diff against Task 2 baseline is `similarityScore >= 99.5` for `og-image` and `twitter-image`
  - [ ] `curl -i http://127.0.0.1:<PORT>/opengraph-image` and `/twitter-image` return `200` and `image/png` during QA

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: OG/Twitter asset contracts survive theme alignment
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run type-check && pnpm exec playwright test e2e/seo.spec.ts --project=chromium | tee ../../.omo/evidence/task-11-og-seo.txt
    Expected: command exits 0; SEO spec confirms metadata, PNG dimensions, and icons
    Evidence: .omo/evidence/task-11-og-seo.txt

  Scenario: OG image visual diff
    Tool:     playwright(real Chrome)
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && mkdir -p .omo/evidence/task-11-og/screenshots && cd packages/web && pnpm run build && (PORT=41733 pnpm run start > ../../.omo/evidence/task-11-og/server.log 2>&1 & echo $! > ../../.omo/evidence/task-11-og/server.pid) && node - <<'JS'
              const { chromium } = await import("@playwright/test");
              const browser = await chromium.launch({ channel: "chrome", headless: true });
              for (const [path, name] of [["/opengraph-image", "og-image"], ["/twitter-image", "twitter-image"]]) {
                const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
                await page.goto(`http://127.0.0.1:41733${path}`, { waitUntil: "networkidle" });
                await page.screenshot({ path: `../../.omo/evidence/task-11-og/screenshots/${name}.png` });
                await page.close();
              }
              await browser.close();
              JS
              kill "$(cat ../../.omo/evidence/task-11-og/server.pid)" && bun /Users/yeongyu/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/visual-qa/scripts/cli.ts image-diff ../../.omo/evidence/task-2-baseline/screenshots/og-image.png ../../.omo/evidence/task-11-og/screenshots/og-image.png > ../../.omo/evidence/task-11-og/og-image-diff.json && node --input-type=module -e 'import fs from "node:fs"; const r = JSON.parse(fs.readFileSync("../../.omo/evidence/task-11-og/og-image-diff.json", "utf8")); if (!r.dimensionsMatch || r.similarityScore < 99.5) process.exit(1)'
    Expected: command exits 0; diff JSON reports dimensionsMatch true and similarityScore >= 99.5
    Evidence: .omo/evidence/task-11-og/og-image-diff.json
  ```

  Commit: YES | Message: `refactor(web): align social images with design tokens` | Files: [`packages/web/app/opengraph-image.tsx`, `packages/web/app/og-brand-mark.tsx`, `packages/web/app/og-image-theme.ts`, `packages/web/app/twitter-image.tsx`, `packages/web/DESIGN.md`]

- [ ] 12. Run after-state visual diff and interaction QA

  What to do: Capture after-state screenshots at the same viewports as Task 2, run image diffs for landing/docs/OG/Twitter, drive docs interactions at mobile and desktop, drive the copy button, inspect console errors, and write one consolidated QA JSON plus screenshots under `.omo/evidence/task-12-final-visual/`.
  Must NOT do: Do not fix issues inside this task except by routing back to the specific failing implementation task and creating a new atomic fix commit.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [13] | Blocked by: [2, 9, 10, 11]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `.omo/evidence/task-2-baseline/screenshots/` - baseline comparison images
  - Pattern:  `packages/web/components/docs/docs-shell.tsx:34-87` - docs interaction behavior to drive
  - Pattern:  `packages/web/components/site/copy-button.tsx:14-19` - copy state behavior to drive
  - Pattern:  `packages/web/app/styles/docs.css:470-514` - responsive docs breakpoints
  - External: `https://playwright.dev/docs/screenshots` - Playwright screenshot API
  - External: `https://playwright.dev/docs/test-snapshots` - visual comparison reference

  Acceptance criteria (agent-executable only):
  - [ ] `.omo/evidence/task-12-final-visual/visual-diff-summary.json` exists and every same-viewport pair has `dimensionsMatch: true` and `similarityScore >= 99.5`
  - [ ] `.omo/evidence/task-12-final-visual/docs-action-log.json` records successful mobile and desktop docs scenarios with zero console errors and zero overflow
  - [ ] `.omo/evidence/task-12-final-visual/copy-button-log.json` records copy button click and visible/ARIA copied state without errors

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: final visual fidelity diff
    Tool:     playwright(real Chrome)
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && mkdir -p .omo/evidence/task-12-final-visual/screenshots && cd packages/web && pnpm run build && (PORT=41734 pnpm run start > ../../.omo/evidence/task-12-final-visual/server.log 2>&1 & echo $! > ../../.omo/evidence/task-12-final-visual/server.pid) && node - <<'JS'
              const { chromium } = await import("@playwright/test");
              const fs = await import("node:fs/promises");
              const base = "http://127.0.0.1:41734";
              const browser = await chromium.launch({ channel: "chrome", headless: true });
              const log = [];
              async function shot(path, width, height, name) {
                const page = await browser.newPage({ viewport: { width, height } });
                const errors = [];
                page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
                await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
                await page.screenshot({ path: `../../.omo/evidence/task-12-final-visual/screenshots/${name}.png`, fullPage: true });
                log.push({ path, width, height, errors, overflow });
                await page.close();
              }
              await shot("/", 1440, 900, "home-1440");
              await shot("/", 390, 844, "home-390");
              await shot("/docs", 1280, 800, "docs-1280");
              await shot("/docs", 390, 844, "docs-390");
              await shot("/opengraph-image", 1200, 630, "og-image");
              await shot("/twitter-image", 1200, 630, "twitter-image");
              await browser.close();
              await fs.writeFile("../../.omo/evidence/task-12-final-visual/browser-log.json", JSON.stringify(log, null, 2));
              if (log.some((entry) => entry.errors.length > 0 || entry.overflow)) process.exit(1);
              JS
              kill "$(cat ../../.omo/evidence/task-12-final-visual/server.pid)" && for name in home-1440 home-390 docs-1280 docs-390 og-image twitter-image; do bun /Users/yeongyu/.codex/plugins/cache/sisyphuslabs/omo/4.13.0/skills/visual-qa/scripts/cli.ts image-diff ../../.omo/evidence/task-2-baseline/screenshots/$name.png ../../.omo/evidence/task-12-final-visual/screenshots/$name.png > ../../.omo/evidence/task-12-final-visual/$name-diff.json; done && node --input-type=module - <<'JS'
              import fs from "node:fs";
              const names = ["home-1440", "home-390", "docs-1280", "docs-390", "og-image", "twitter-image"];
              const results = Object.fromEntries(names.map((name) => [name, JSON.parse(fs.readFileSync(`../../.omo/evidence/task-12-final-visual/${name}-diff.json`, "utf8"))]));
              fs.writeFileSync("../../.omo/evidence/task-12-final-visual/visual-diff-summary.json", JSON.stringify(results, null, 2));
              if (Object.values(results).some((r) => !r.dimensionsMatch || r.similarityScore < 99.5)) process.exit(1);
              JS
    Expected: command exits 0; all screenshots/diff JSON files exist; every diff is >=99.5 similarity
    Evidence: .omo/evidence/task-12-final-visual/visual-diff-summary.json

  Scenario: final docs and copy-button manual path
    Tool:     playwright(real Chrome)
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && (PORT=41735 pnpm run start > ../../.omo/evidence/task-12-final-visual/manual-server.log 2>&1 & echo $! > ../../.omo/evidence/task-12-final-visual/manual-server.pid) && node - <<'JS'
              const { chromium } = await import("@playwright/test");
              const fs = await import("node:fs/promises");
              const browser = await chromium.launch({ channel: "chrome", headless: true });
              const actionLog = [];
              for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
                const page = await browser.newPage({ viewport });
                const errors = [];
                page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
                await page.goto("http://127.0.0.1:41735/docs", { waitUntil: "networkidle" });
                if (viewport.width < 768) await page.getByRole("button", { name: "Menu" }).click();
                await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
                await page.getByPlaceholder("Search docs...").fill("ulw");
                await page.getByRole("link", { name: "$ulw-loop" }).click();
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
                actionLog.push({ surface: "docs", viewport, url: page.url(), errors, overflow });
                await page.close();
              }
              const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
              await page.goto("http://127.0.0.1:41735/", { waitUntil: "networkidle" });
              await page.getByRole("button", { name: "Copy install command" }).click();
              const copiedText = await page.locator("button[aria-label='Copy install command'] span.sr-only").textContent();
              await page.close();
              await browser.close();
              await fs.writeFile("../../.omo/evidence/task-12-final-visual/docs-action-log.json", JSON.stringify(actionLog, null, 2));
              await fs.writeFile("../../.omo/evidence/task-12-final-visual/copy-button-log.json", JSON.stringify({ copiedText }, null, 2));
              if (actionLog.some((entry) => entry.errors.length || entry.overflow || !entry.url.endsWith("#ulw-loop")) || copiedText !== "Copied") process.exit(1);
              JS
              kill "$(cat ../../.omo/evidence/task-12-final-visual/manual-server.pid)"
    Expected: command exits 0; docs URL ends `#ulw-loop`; copy button announces `Copied`; no console errors; no overflow
    Evidence: .omo/evidence/task-12-final-visual/docs-action-log.json
  ```

  Commit: NO | Message: `test(web): verify visual fidelity` | Files: []

- [ ] 13. Run complete automated gates and fix-only loop

  What to do: Run the full local gate suite: design check, lint, typecheck, build, focused e2e, full e2e, and Lighthouse 100/100/100/100. If a gate fails, route back to the smallest responsible task, fix only that issue, re-run Task 12 and Task 13, and commit the fix atomically.
  Must NOT do: Do not skip Lighthouse, replace it with CLI Lighthouse, suppress tests/lints, or commit evidence artifacts.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [14] | Blocked by: [9, 10, 11, 12]

  References (executor has NO interview context - be exhaustive):
  - Test:     `packages/web/package.json:10-24` - canonical scripts
  - Test:     `packages/web/playwright.config.ts:35-68` - production build/start e2e setup
  - Test:     `packages/web/e2e/lighthouse.spec.ts:8-25` - real Chrome, production server, mobile+desktop Lighthouse 100 requirement
  - Test:     `packages/web/e2e/lighthouse.spec.ts:216-230` - mobile and desktop tests
  - Test:     `packages/web/e2e/landing.spec.ts`, `packages/web/e2e/docs.spec.ts`, `packages/web/e2e/responsive.spec.ts`, `packages/web/e2e/seo.spec.ts`, `packages/web/e2e/github-stars.spec.ts` - full regression suite
  - External: `https://playwright.dev/docs/test-cli` - Playwright CLI filtering and project selection

  Acceptance criteria (agent-executable only):
  - [ ] `cd packages/web && pnpm run check:design` exits `0`
  - [ ] `cd packages/web && pnpm run lint` exits `0`
  - [ ] `cd packages/web && pnpm run type-check` exits `0`
  - [ ] `cd packages/web && pnpm run build` exits `0`
  - [ ] `cd packages/web && pnpm run test:e2e` exits `0`
  - [ ] `cd packages/web && pnpm run test:lighthouse` exits `0`
  - [ ] `git status --porcelain -- packages/web | rg -v '^( M|A |M |MM|AM) packages/web/'` does not show generated junk, reports, or evidence

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: full local gate suite
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && { pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm run build && pnpm run test:e2e && pnpm run test:lighthouse; } | tee ../../.omo/evidence/task-13-full-gates.txt
    Expected: command exits 0; all listed gates pass
    Evidence: .omo/evidence/task-13-full-gates.txt

  Scenario: generated junk is not staged
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git status --porcelain -- packages/web .omo | tee .omo/evidence/task-13-status.txt && ! rg -n "playwright-report|test-results|\\.next|\\.open-next|e2e/lighthouse-reports|\\.omo/evidence" .omo/evidence/task-13-status.txt
    Expected: command exits 0; no reports, build outputs, or evidence artifacts are staged/tracked for commit
    Evidence: .omo/evidence/task-13-status.txt
  ```

  Commit: YES | Message: `fix(web): resolve final design-system regressions` | Files: [`only files implicated by failed gates`]

- [ ] 14. Commit audit, push branch, create PR, and verify PR checks

  What to do: Audit commits for atomicity and conventional messages, ensure each implementation/test slice is committed, push `code-yeongyu/design-system-fidelity`, create a GitHub PR against `main`, include plan path and evidence summary in the PR body, then watch PR checks. If CI fails, fetch logs, fix with a new atomic commit, repeat Task 12 and Task 13, push, and re-watch.
  Must NOT do: Do not squash unrelated changes, force-push without `--force-with-lease` if a rebase was required, merge the PR, or include secrets/tokens/log env dumps in the PR body.

  Parallelization: Can parallel: NO | Wave 5 | Blocks: [final verification] | Blocked by: [13]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/web/package.json:10-24` - verification commands to report in PR
  - Pattern:  `.omo/plans/design-system-fidelity.md` - plan footer to reference in final commit/PR
  - Pattern:  `.omo/evidence/task-12-final-visual/` - manual QA evidence to summarize in PR
  - Pattern:  `.omo/evidence/task-13-full-gates.txt` - automated QA evidence to summarize in PR
  - External: `https://cli.github.com/manual/gh_pr_create` - PR creation
  - External: `https://cli.github.com/manual/gh_pr_checks` - PR checks watch

  Acceptance criteria (agent-executable only):
  - [ ] `git log --oneline origin/main..HEAD` shows atomic Conventional Commit subjects for docs/test/refactor/fix slices
  - [ ] Final commit touching implementation includes footer `Plan: .omo/plans/design-system-fidelity.md`
  - [ ] `git push -u origin code-yeongyu/design-system-fidelity` exits `0`
  - [ ] `gh pr create --base main --head code-yeongyu/design-system-fidelity ...` exits `0` or `gh pr view` confirms an existing PR for the branch
  - [ ] `gh pr checks --watch --fail-fast` exits `0`

  QA scenarios (MANDATORY - task incomplete without these):
  ```
  Scenario: push and PR creation
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git log --oneline origin/main..HEAD | tee .omo/evidence/task-14-commit-log.txt && git push -u origin code-yeongyu/design-system-fidelity | tee .omo/evidence/task-14-push.txt && cat > /tmp/design-system-fidelity-pr.md <<'EOF'
              ## Summary
              - Extracts the current LazyCodex web UI into an explicit design-system structure without intentional visual or behavior changes.
              - Preserves landing, docs navigation/search/ToC, SEO/OG images, Lighthouse posture, and current copy.
              - Plan: .omo/plans/design-system-fidelity.md

              ## Verification
              - `pnpm run check:design`
              - `pnpm run lint`
              - `pnpm run type-check`
              - `pnpm run build`
              - `pnpm run test:e2e`
              - `pnpm run test:lighthouse`
              - Manual browser QA evidence: `.omo/evidence/task-12-final-visual/`
              EOF
              gh pr create --base main --head code-yeongyu/design-system-fidelity --title "refactor(web): extract design system without visual drift" --body-file /tmp/design-system-fidelity-pr.md | tee .omo/evidence/task-14-pr-create.txt || gh pr view --json url,number,title --jq .url | tee .omo/evidence/task-14-pr-create.txt
    Expected: command exits 0; branch is pushed; PR URL is captured
    Evidence: .omo/evidence/task-14-pr-create.txt

  Scenario: PR checks pass
    Tool:     bash
    Steps:    cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && gh pr checks --watch --fail-fast | tee .omo/evidence/task-14-pr-checks.txt
    Expected: command exits 0; all required PR checks pass
    Evidence: .omo/evidence/task-14-pr-checks.txt
  ```

  Commit: NO | Message: `chore(web): open design-system fidelity PR` | Files: []

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - every task done, every acceptance criterion met
- [ ] F2. Code quality review - diagnostics clean, idioms match, no dead code
- [ ] F3. Real manual QA - every QA scenario executed with evidence captured
- [ ] F4. Scope fidelity - nothing extra shipped beyond Must-Have, nothing Must-NOT-Have introduced

Required final verification commands:
- `cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity/packages/web && pnpm run check:design && pnpm run lint && pnpm run type-check && pnpm run build && pnpm run test:e2e && pnpm run test:lighthouse`
- `cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && find .omo/evidence -type f -maxdepth 3 | sort > .omo/evidence/final-evidence-index.txt`
- `cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git diff --check`
- `cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && git status --short`
- `cd /Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity && gh pr checks --watch --fail-fast`

## Commit strategy
- One logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/design-system-fidelity.md`.
- Recommended commit order:
  1. `test(web): characterize design-system fidelity`
  2. `docs(web): codify rendered design system`
  3. `test(web): add design-system drift guard`
  4. `refactor(web): extract CSS design tokens`
  5. `refactor(web): centralize theme tokens`
  6. `refactor(web): extract shared visual primitives`
  7. `refactor(web): migrate landing to design primitives`
  8. `refactor(web): migrate docs to design primitives`
  9. `refactor(web): align social images with design tokens`
  10. `fix(web): resolve final design-system regressions` only if Task 13 finds defects

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.
- The landing page `/` matches Task 2 baseline at 1440x900 and 390x844 with `similarityScore >= 99.5`, no horizontal overflow, and no console errors.
- The docs page `/docs` matches Task 2 baseline at 1280x800 and 390x844 with `similarityScore >= 99.5`, no horizontal overflow, and no console errors.
- Docs `Ctrl-K`/`Meta-K`, search filtering for `ulw`, mobile menu, `$ulw-loop` hash navigation, right ToC, and no-JS SSR all pass Playwright/browser QA.
- `/opengraph-image` and `/twitter-image` remain 1200x630 PNGs and visually match baseline with `similarityScore >= 99.5`.
- `pnpm run check:design`, `pnpm run lint`, `pnpm run type-check`, `pnpm run build`, `pnpm run test:e2e`, and `pnpm run test:lighthouse` all exit `0`.
- No new visible copy, external UI library, font dependency, animation library, or design direction was introduced.
- Branch `code-yeongyu/design-system-fidelity` is pushed and PR is open against `main` with verification evidence summarized.

# Design System Fidelity Manual QA Matrix

## Scope

Worktree: `/Users/yeongyu/local-workspaces/lazycodex-wt/design-system-fidelity`

Branch: `code-yeongyu/design-system-fidelity`

Surface: `packages/web` Next.js app, especially `/` and `/docs`.

## Evidence Matrix

| Criterion | Surface | Scenario | Evidence | Result |
| --- | --- | --- | --- | --- |
| C001 | Browser / visual | Production app baseline and after captures for landing desktop `1440x900`, landing mobile `390x844`, docs desktop `1280x800`, docs mobile `390x844` | `.omo/ulw-loop/evidence/design-system-fidelity/C001-browser-fidelity.json`; `.omo/ulw-loop/evidence/design-system-fidelity/screenshots/` | PASS: all four same-viewport pairs report `similarityScore: 100`, `diffPixels: 0`, no console errors, no horizontal overflow |
| C002 | Browser / interaction | `/docs` mobile and desktop: mobile Menu open/close, search term `ulw`, Meta+K focus, `$ulw-loop` navigation and hash target in viewport | `.omo/ulw-loop/evidence/design-system-fidelity/C002-docs-interactions.json`; interaction screenshots in `.omo/ulw-loop/evidence/design-system-fidelity/screenshots/` | PASS: mobile and desktop interaction results are true, no console errors, no horizontal overflow |
| C003 | Automated regression | `pnpm run lint`, `pnpm run type-check`, `pnpm run build`, focused Playwright landing/docs/responsive suite | `.omo/ulw-loop/evidence/design-system-fidelity/C003-automated-gates.txt` | PASS: lint/type-check/build exit 0; Playwright reports 32 passed |
| Full e2e | Browser / regression | Full Playwright e2e suite | `.omo/evidence/design-system-fidelity-full-gates.txt` | PASS: 52 passed |
| SEO / metadata | Browser and HTTP | SEO spec including metadata, robots, sitemap, manifest, OG/Twitter PNG routes, favicon assets | `.omo/evidence/design-system-fidelity-full-gates.txt` | PASS: SEO spec reports 8 passed |
| Lighthouse | Real Chrome / CDP | `pnpm run test:lighthouse`, mobile and desktop, Playwright `channel: "chrome"` plus Lighthouse Node API/CDP | `.omo/evidence/design-system-fidelity-full-gates.txt` | PASS: mobile and desktop report performance 100, accessibility 100, best-practices 100, SEO 100 |

## Review Matrix

| Review | Artifact | Result |
| --- | --- | --- |
| QA evidence review | subagent result captured in thread, summarized by this matrix | APPROVE |
| Clone/design-system fidelity review | `.omo/evidence/design-system-fidelity-clone-fidelity.md` | APPROVE |
| Code quality review | `.omo/evidence/design-system-fidelity-code-review.md` | REQUEST_CHANGES before commit because `design-system.css` was still untracked; resolved by staging/committing that file with production changes |
| Gate review | `.omo/evidence/design-system-fidelity-gate-review.md` | REQUEST_CHANGES before PR for missing full gates/review artifacts/commit/PR; full gates and artifacts now added, commit/PR follow this matrix |

## Cleanup Receipts

- Playwright browser contexts closed by the capture and interaction scripts.
- Production `next start` server on `:3107` was killed; `lsof -iTCP:3107` was empty after cleanup.
- Full-gate Playwright web servers exited when their test runs completed.
- Generated `packages/web/test-results`, `packages/web/playwright-report`, and `packages/web/e2e/lighthouse-reports` were removed before commit.


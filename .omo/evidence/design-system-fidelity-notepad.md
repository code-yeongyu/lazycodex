# Design System Fidelity Notepad

## Decisions

- Preserve current rendered behavior and visual output exactly; do not redesign the public surface.
- Extract the existing implicit tokens and base utilities from `packages/web/app/globals.css` into `packages/web/app/styles/design-system.css`.
- Keep `packages/web/app/globals.css` as the import hub: Tailwind first, shared design system second, page composition styles third.
- Update `packages/web/DESIGN.md` to match the already-rendered green token values and document implementation sources/component families.
- Keep existing raw literal colors in OG/icon/docs/component files out of this PR unless they were part of the moved token block; clone-fidelity review marks them as non-blocking pre-existing cleanup.

## Browser Tooling

- Codex Chrome Extension path was unavailable earlier in the run, so browser QA used Playwright real Chrome channel for visual and interaction evidence.
- Repo e2e runs use the configured Playwright Chromium project; `pnpm exec playwright install chromium` was run to restore the missing local browser binary.
- Lighthouse was run through the repo's real-Chrome CDP path, not the Lighthouse CLI.

## Completion Notes

- The code-review blocker about `packages/web/app/styles/design-system.css` being untracked is a pre-commit state issue. The PR commit must include that file.
- The gate-review blocker about missing full gates is addressed by `.omo/evidence/design-system-fidelity-full-gates.txt`.
- The gate-review blocker about missing review artifacts is addressed by `.omo/evidence/design-system-fidelity-manual-qa-matrix.md`, `.omo/evidence/design-system-fidelity-notepad.md`, `.omo/evidence/design-system-fidelity-code-review.md`, and `.omo/evidence/design-system-fidelity-clone-fidelity.md`.


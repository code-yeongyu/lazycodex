Skills are specialist playbooks that LazyCodex loads on top of the command pillars. They auto-activate when a task matches their domain — you do not need to study or memorize them. Include `ultrawork` (or the short alias `ulw`) in your prompt and the harness picks the right skills internally.

When you want to call a skill explicitly, put its name in the prompt: `$review-work`, `$remove-ai-slops`, `$ulw-research`, and so on.

### Commands

The command pillars stay simple:

- `$init-deep` — project memory
- `$ulw-plan` — decision-complete planning before coding
- `$start-work` — execute a plan with durable Boulder progress
- `$ulw-loop` — evidence-bound loop until verified completion

Skills add specialist judgment around those pillars. The sections below describe each skill and how it is typically used.

---

### review-work

Five-lane parallel post-implementation review.

After significant work, `review-work` launches five sub-agents in parallel — each covering a different angle: goal/constraint verification, hands-on QA execution, code quality, security, and context mining from git history and issues. All five must pass for the review to pass. One failure means the review fails.

**When it activates:** After completing any meaningful implementation — especially when the change touches 3+ files or runs for 20+ minutes.

**Example:** After finishing a PR, the user says:

```text
review my work
```

The harness spawns five parallel reviewers in separate threads, each with a focused lens. The final verdict is PASS only when every lane agrees.

---

### remove-ai-slops

Behavior-preserving cleanup of AI-generated code smells.

The safety invariant: regression tests lock behavior *before* a single line is deleted. Covers obvious comments, excessive defensive code, unnecessary abstractions, dead code, duplicates, and oversized modules (250+ pure LOC triggers a full modular refactoring). Workers run in parallel batches of five, and any test failure triggers an immediate revert.

**When it activates:** When asked to clean, deslop, or remove AI-generated patterns.

**Example:** Combining with `refactor` and `programming` for a full cleanup pass:

```text
ulw plan and manual qa, no behaviour changes, no regressions
/refactor /remove-ai-slops through /programming
```

The harness plans the cleanup first, locks behavior with tests, then dispatches parallel workers by slop category — safe to dangerous order.

---

### frontend

UI, UX, design, performance, accessibility, and visual QA — all in one router.

Not a single rule file but a router. It reads design, perfection, and ui-ux-db references based on the task, then builds and verifies against the actual browser. Covers UI implementation, styling, layout, animation, Lighthouse 100, Core Web Vitals, accessibility, SEO, and React dev tools like `react-scan` and `react-doctor`.

**When it activates:** Any task involving UI, styling, layout, animation, design, or performance auditing.

**Example:**

```text
redesign the sidebar with better spacing and hit Lighthouse 100
```

The skill routes to the right design references, builds to match the existing design system, then runs a real Playwright Chromium Lighthouse audit — never the Lighthouse CLI, never by weakening UX.

---

### programming

One philosophy across four languages: strict types, modern stacks, TDD.

Applies to every `.py`, `.pyi`, `.rs`, `.ts`, `.tsx`, `.mts`, `.cts`, `.go` file. The skill gates on language, loads the matching reference set, and enforces: parse-don't-validate at boundaries, exhaustive variant matching, typed errors, no escape hatches (`any`, `unwrap`, `@ts-ignore`), 250 pure LOC ceiling per file, and mandatory TDD (RED → GREEN → REFACTOR).

**When it activates:** Automatically on any code file edit in the supported languages.

**Example:** The skill is always on. When editing TypeScript, it loads the TypeScript reference (Bun + Biome + strict tsconfig), enforces branded types and discriminated unions, and runs the post-write review loop: measure pure LOC, self-review seven questions, refactor if over 250 LOC.

---

### debugging

Hypothesis-driven runtime debugging across any language or binary.

Every claim about why a bug happens must come from observed runtime state, not code reading. The skill runs a phased loop: setup and journal, form 3+ orthogonal hypotheses, investigate in parallel, escalate to independent verifiers after 2 failed rounds, confirm root cause by toggling, lock with a failing test, fix minimally, QA on the real surface, then clean up every debug artifact.

**When it activates:** Crashes, silent failures, wrong responses, stuck processes, memory leaks, async misbehavior, or reverse engineering.

**Example:**

```text
debug this — the API returns 200 but the body is empty
```

The skill fires parallel investigation lanes, attaches real debuggers (pdb, node inspect, lldb, dlv), and does not close the bug until the root cause is confirmed by toggling and a failing test goes GREEN.

---

### refactor

Codemap-aware, LSP- and AST-grep-powered restructuring.

Maps the codebase before touching anything, evaluates test coverage to set the verification strategy, plans atomic steps with rollback points, then executes with LSP renames and AST-grep structural rewrites. Any test failure during execution triggers an immediate stop and revert.

**When it activates:** Requests to refactor, restructure, extract, simplify, or modernize code.

**Example:**

```text
refactor the validation logic into its own module --scope=module
```

The skill builds a dependency graph of the target, runs characterization tests to pin current behavior, then executes the restructuring step by step — verifying after each step.

---

### visual-qa

Screenshot and TUI diff plus dual-oracle visual QA.

Captures reference and actual evidence — screenshots for web UIs, `tmux capture-pane` for terminal UIs — then runs a bundled pixel-diff or column-width script. Two parallel read-only oracle passes evaluate: one for design-system and functional integrity, one for visual fidelity and CJK text precision. The final verdict is a single good/bad score.

**When it activates:** After building or changing any UI, or when asked to verify visual correctness.

---

### git-master

Atomic commits, rebase/squash, push safety, history investigation.

Handles commit message style detection, semantic grouping, fixup autosquash, blame, bisect, `log -S`, and questions like "who wrote this" or "when was this added."

**When it activates:** Any git operation — committing, rebasing, squashing, history search.

---

### ulw-research

Maximum-saturation research mode (formerly `ultraresearch`).

Orchestrates parallel explore and librarian swarms across the codebase, the web, official documentation, and OSS repositories. Runs a recursive EXPAND loop driven by leads that workers return, verifies findings empirically by running code, and produces cited synthesis with optional reports.

**When it activates:** Only on explicit demand — the word `ulw-research`, the legacy alias `ultraresearch`, or any request for deep research or an ultra-precise investigation.

**Example:**

```text
ulw-research the typeclaw architecture — map every module and find the official docs
```

The skill fans out 10+ parallel search lanes across GitHub, official docs, and web sources, recursively expands promising leads, then synthesizes a cited report.

---

### LSP

Language-server diagnostics, definitions, references, symbols, and safe renames.

Gives the agent language-server precision via MCP tool calls. Runs diagnostics after every edit, finds definitions and references across the workspace, and performs safe renames through the language server's own workspace edit — not text find-and-replace.

**When it activates:** Automatically after edit-like tool calls (diagnostics), and on demand for navigation and renames.

---

### AST-grep

Structural search and rewrite across 25 languages.

Finds code by syntactic shape rather than text — every function call matching a pattern, every import shaped like X. Rewrites are deterministic and always previewed with `dryRun=true` before applying. Pairs with the `refactor` skill for safe, large-scale codemods.

**When it activates:** Structural code matching, pattern-based search, or deterministic rewrites (strip `as any`, migrate `require()` to `import`, find empty catch blocks).

---

### Where skills live

LazyCodex installs skills as part of the OmO plugin. OmO can also load skills from project and user locations such as `.codex/skills`, `~/.codex/skills`, `.agents/skills`, and `~/.agents/skills`.

Each skill carries deep internal references — detailed playbooks, language-specific recipes, and per-phase instructions — but none of that is something you need to read. The harness reads it for you when the skill activates.

The command pillars and the disciplines behind them are covered in depth: [ulw-plan](./ulw-plan.md), [ulw-loop](./ulw-loop.md), [start-work](./start-work.md), [TDD](./tdd.md), [manual QA](./manual-qa.md), and [git workflow](./git-workflow.md).

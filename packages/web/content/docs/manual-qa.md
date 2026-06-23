Manual QA is the gate that turns "it should work" into "it works, here is the proof". No step closes on a status string; it closes on a captured artifact from a real surface, plus an adversarial pass and a cleanup receipt. Two skills carry this: `visual-qa` for UI surfaces, `review-work` for whole-implementation review.

### visual-qa

For any UI you built or changed — web page or TUI — visual QA runs three phases. First it captures objective reference evidence with a bundled diff script: `image-diff` for screenshots (similarity score, hotspots, `alphaChannelIntact`), `tui-check` for terminal captures (`maxWidth`, `overflowLines`, `borderMisaligned`, wide-char columns). That JSON is reference, not the verdict.

Then it dispatches two read-only oracle subagents in parallel:

- **Pass A — design-system and functional integrity.** The deeper, stricter pass. Proves the surface is a real design-system implementation driven by coherent tokens and reused primitives, not a mock-only screen or a pasted raster faked as live elements. Checks alpha, responsiveness, and that the user-intended features actually work.
- **Pass B — visual fidelity and CJK precision.** The focused pass. Opens the screenshots directly and inspects source/content for clipping, baseline drop, glyph breakage, and Korean/Japanese/Chinese precision.

The harness synthesizes the two passes into one `PASS | REVISE | FAIL` verdict with located findings.

### review-work

After significant implementation, `review-work` launches five parallel background subagents. All five must pass for the review to pass; if one fails, the review fails.

| Lane | Role | Asks |
| --- | --- | --- |
| 1 | Goal Verifier | Did we build what was asked? |
| 2 | QA Executor | Does it actually work? |
| 3 | Code Reviewer | Is the code well-written? |
| 4 | Security Auditor | Is it secure? |
| 5 | Context Miner | Did we miss any context? |

Oracle lanes receive the diff plus full file contents in the prompt (they cannot read files). A crashed, `BLOCKED:`, or inconclusive lane is never counted as a pass — it is respawned smaller, and if the retry budget is exhausted it stays `INCONCLUSIVE` while the aggregate result still emits.

### Adversarial classes and cleanup

Within [`$start-work`](./start-work.md), every checkbox probes each applicable adversarial class and records the observable result for each; skipped classes need a one-line not-applicable reason in the ledger. Every QA resource — scripts, tmux assets, browser sessions, PIDs, ports, containers, temp dirs — is registered as its own teardown todo and executed with a captured receipt. No QA asset is left running.

### Reading more

- [TDD](./tdd.md) — the automated-verification gate that precedes manual QA.
- [ulw-loop](./ulw-loop.md) — the loop whose completion depends on this gate.

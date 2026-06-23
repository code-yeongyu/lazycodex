Strict test-driven development is the discipline that lets the harness call work "done" without hoping. Every change follows the red → green → refactor loop, in that order. Reverse it and you have written speculative code.

### The order

1. **Red.** Write a failing test that names the behavior in `Given / When / Then`. Run it. Confirm it fails for the right reason — not a typo or a missing import.
2. **Green.** Write the minimum code to make it pass. Resist the second case until the first passes; the second case is the next red.
3. **Refactor.** With the test green, restructure ruthlessly. If the test is hard to refactor against, the test is bad — fix it before the code.

### The test pyramid

Every feature ships all three rungs: many fast units (pure-function correctness across happy, edge, boundary, and error paths, < 10 ms each), some integrations against the real downstream via testcontainers or httptest (< 1 s each), and a few E2E scenarios that drive the binary through its real surface and assert the observable outcome. A feature with zero E2E coverage is undone, even if every unit passes.

### Deterministic, or it is broken

A test that passes 9 of 10 times is failing 10% of the time. Forbidden in test bodies unless time itself is the system under test: `setTimeout(resolve, N)`, `await sleep(N)`, "wait long enough for X". The replacement is subscribe-first, timeout-bound — register the listener before the trigger, then race against an explicit circuit breaker that fails with a useful message on timeout. The whole repo must pass `bun test` in one process, one go, no isolation flags, no retries.

### Prompt tests assert behavior, not text

When testing code that builds an LLM prompt, never pin the current wording (`toContain("You are Sisyphus")`, `toMatchSnapshot`, `toBe(EXPECTED_PROMPT)`). Assert the structural invariant the logic enforces — the conditional branch, the negative branch, the redaction, the skill inclusion/exclusion. Test what would break the behavior, never what would only break a diff.

### The five evidence gates

During execution the lifecycle enforces five gates before a step can close: plan reread, automated verification, [manual QA](./manual-qa.md), adversarial QA, and cleanup. A step that cannot pass its gates does not advance, regardless of what the status text claims.

### Reading more

- [ultrawork mode](./ultrawork.md) — the mode that makes the loop binding.
- [start-work](./start-work.md) — where the five gates are enforced per checkbox.

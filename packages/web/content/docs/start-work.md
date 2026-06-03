`$start-work` executes a Prometheus work plan until every top-level checkbox is done.

### How it works

- Durable Boulder state in `.omo/boulder.json` survives across turns and sessions
- A Stop-hook re-injects the next turn until the plan is complete
- Independent sub-tasks fan out to parallel subagents
- Strict TDD plus five evidence gates: plan reread, automated verification, manual-QA, adversarial QA, cleanup
- Progress is recorded to a ledger

### Syntax

```bash
$start-work [plan-name] [--worktree <absolute-path>]
```

### Done

It prints an `ORCHESTRATION COMPLETE` block when every checkbox is checked.

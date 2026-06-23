`$ulw-loop` is a self-referential development loop that decomposes work into systematic, evidence-bound steps and runs until verified completion.

### How it works

The agent works continuously and emits `<promise>DONE</promise>` when it believes the task is complete, but that does NOT end the loop. An Oracle must verify the result first. The loop ends only after the system confirms the Oracle verified it. If verification fails, it continues with the message: "Oracle verification failed. Continuing ULTRAWORK loop."

Each step carries its own evidence: a real artifact, not a dry-run claim. Progress is checkpointed, so a long run survives restarts without losing what was already proven.

### Bootstrap

Before the first run, the loop reads its full workflow reference (Bootstrap tier triage, the Execution Loop, and the Manual-QA channels table) so every later phase executes the same way. It only reads the sections the current phase needs.

### Manual-QA channels

A step does not close on a status string. It closes on a captured artifact from a real surface — an HTTP call, a tmux session, or a browser — plus an adversarial pass and a cleanup receipt. See [manual QA](./manual-qa.md).

### Syntax

```bash
$ulw-loop "task description" [--completion-promise=TEXT] [--strategy=reset|continue]
```

### Limits

The iteration cap is 500 in ultrawork mode (100 in normal mode).

### Reading more

- [ultrawork mode](./ultrawork.md) — the mode that turns the loop into a binding verified run.
- [Hooks & Lifecycle](./hooks-lifecycle.md) — how the Stop-hook re-injects the next turn.

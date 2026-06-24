ultrawork is the headline mode. Include `ultrawork` (or the short alias `ulw`) anywhere in your prompt — like adding `ultrathink` — and the harness switches to maximum-precision, outcome-first, evidence-driven orchestration. Skills activate internally; you do not need to name them.

> "Plan, execute, verify, and keep the evidence attached."

The principle is simple. An agent saying it is done does not mean the work is done. The work is done when **observable evidence verifies** it.

### Usage

Just include the word in your prompt. Nothing else to configure.

```text
ulw add authentication
```

```text
fix the flaky checkout test ultrawork
```

The harness reads the task, picks the right skills (programming, debugging, refactor, etc.), and runs the evidence-bound loop automatically. You do not choose skills yourself unless you want to be explicit — for example `$review-work` or `$ulw-research`.

### What it enforces

- Strict TDD: RED → GREEN → SURFACE → CLEAN
- At least 3 realistic QA scenarios scaled to the risk of the task
- Real manual-QA channels (HTTP call, tmux, browser, computer use, CLI stdout, data diff)
- A binding verification gate that loops until the work is genuinely done

### Relationship to `$ulw-loop`

`$ulw-loop` is the command form of ultrawork discipline. The latest flow stores request, goals, success criteria, and an evidence ledger under `.omo/ulw-loop`:

| File | Role |
| --- | --- |
| `.omo/ulw-loop/brief.md` | Original request and persistent constraints |
| `.omo/ulw-loop/goals.json` | Goals and success criteria |
| `.omo/ulw-loop/ledger.jsonl` | pass, fail, block, steering, checkpoint records |

Saying "done" is not enough. Each success criterion requires evidence captured from a real surface, and that evidence must pass before the loop stops.

The exact syntax and flags live in the [`$ulw-loop` command docs](./ulw-loop.md).

### Failure limits

The loop does not run forever. The latest `$ulw-loop` workflow uses these caps:

| Condition | Limit |
| --- | --- |
| Iterations on one goal without a full pass | 5 cycles |
| Same failure on the same criterion | 3 times |

### Evidence over hope

The loop does not stop at "I wrote some code." It stops when the result is confirmed by evidence — what check ran and what it showed — not by the agent's expected status report.

### Position among commands

`$ulw-loop` is one of several commands, each for a different shape of work.

The typical flow: `$ulw-plan` produces a decision-complete plan, `$start-work` executes it checkpoint by checkpoint, and `$ulw-loop` keeps open-ended work running until a verifier approves. Detailed syntax for each command is in the [Commands](./ulw-plan.md) section.

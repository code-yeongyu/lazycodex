`$ulw-loop` is a self-referential development loop that runs until verified completion.

### How it works

The agent works continuously and emits `<promise>DONE</promise>` when it believes the task is complete, but that does NOT end the loop. An Oracle must verify the result first. The loop ends only after the system confirms Oracle verified it. If verification fails, it continues with the message: "Oracle verification failed. Continuing ULTRAWORK loop."

### Syntax

```bash
$ulw-loop "task description" [--completion-promise=TEXT] [--strategy=reset|continue]
```

### Limits

The iteration cap is 500 in ultrawork mode (100 in normal mode).

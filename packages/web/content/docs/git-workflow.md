Git work runs through the `git-master` skill. It is exact, conservative, and evidence-led: the agent reads the repository state before it infers anything, and never commits, rebases, pushes, force-pushes, resets, or stash-pops unless you explicitly asked for that operation.

### Mode gate

Every request is classified first:

- `COMMIT` — stage and commit local changes.
- `REBASE` — rebase, squash, fixup, autosquash, reorder, or split branch history.
- `HISTORY` — answer when, where, who, why, or which commit changed something.
- `STATUS` — inspect branch, diff, or working-tree state without changing it.

Investigative requests report findings and stop.

### Commit mode

Commits are atomic by behavior, module, and revertability. The agent detects message style from recent history (dominant pattern, language, casing — it does not default to Conventional Commits unless the repo uses them), inspects the full diff, and stages by path or hunk so each commit contains only its group. Implementation and its direct tests land together; unrelated concerns split into separate commits. Before each commit it verifies `git diff --staged --stat`; after, `git log -1 --oneline`.

### Rebase and merge

History rewriting is a shared-impact operation. The agent never rebases or rewrites `main`, `master`, `dev`, release, or protected branches unless you named that exact operation. If commits may already be pushed, it asks before force-pushing and uses `--force-with-lease`, never plain `--force`. Conflicts are resolved by intent — never a blind ours/theirs. If a rebase goes wrong, `git rebase --abort` is the first move; the reflog is the recovery path, explained before use.

### Push safety

Before any write to history: the current branch is known, dirty work is accounted for, upstream/pushed status is known or explicitly unknown, the operation matches your request, and the recovery path is known. Afterward it runs the cheapest relevant verification and leaves the worktree state explicit.

### Reading more

- [start-work](./start-work.md) — the executor that lands planned work as commits.
- [manual QA](./manual-qa.md) — the gates a step passes before it is allowed to close.

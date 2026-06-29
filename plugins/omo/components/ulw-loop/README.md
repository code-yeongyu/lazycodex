# codex-ulw-loop

[![ci](https://img.shields.io/badge/ci-pending-lightgrey.svg)](#) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Codex plugin scaffold for durable repo-native multi-goal orchestration with embedded success criteria and observable evidence audit.

## Behavior

| Subcommand | Purpose |
|------------|---------|
| `omo ulw-loop create-goals` | Create repo-native goals from a brief and seed criteria. |
| `omo ulw-loop record-evidence` | Record observable evidence for the active criterion. |
| `omo ulw-loop criteria` | Inspect or revise goal success criteria. |
| `omo ulw-loop complete-goals` | Complete eligible goals after criteria pass. |
| `omo ulw-loop checkpoint` | Refuse completion until criteria and evidence gates pass. |
| `omo ulw-loop steer` | Apply steering updates to the plan. |
| `omo ulw-loop status` | Report active goal, criteria, and evidence state. |

Wave 1 is scaffold only. Command behavior lands in later waves.

## Resume Snapshots

`ulw-loop` writes a bounded resume snapshot at `.omo/ulw-loop/<session-id>/snapshots/latest.md` for session-scoped runs and `.omo/ulw-loop/snapshots/latest.md` for unscoped runs. The snapshot exists so a fresh Codex turn can resume the next `ulw-loop` action without rereading the prior transcript.

The snapshot is a summary, not a transcript store. It includes the active goal, criteria status, short evidence excerpts, changed-file summaries, and a single next action. Raw ledger JSON, captured evidence fields, file contents, patches, diffs, and raw transcripts are intentionally omitted. Snapshot text is redacted and size-bounded before writing, so secret-like strings and prompt-injection text should not be used as resume context.

Snapshot lookup is local and narrow: readers only trust `latest.md` inside the active workspace and, for session-scoped runs, under the matching session id. If a snapshot is missing, malformed, too large, outside the workspace, or contains unsafe text, resume code must fall back to the normal plan and Boulder state rather than treating it as authoritative.

The snapshot complements `codex resume`; it does not replace Codex's transcript restoration. `codex resume` can restore conversation history, while `latest.md` provides a minimal repo-native handoff for deciding the next `ulw-loop` action when transcript context is unavailable or intentionally discarded.

## Codex Plugin

The plugin ships:

- `.codex-plugin/plugin.json` for Codex plugin discovery.
- `hooks/hooks.json` for the `UserPromptSubmit` hook.
- `skills/ulw-loop/` as the future skill directory.

The hook command is:

```bash
node "${PLUGIN_ROOT}/dist/cli.js" hook user-prompt-submit
```

No MCP server or Codex tool is exposed in this scaffold.

## Local Development

```bash
npm install
npm test
npm run typecheck
npm run check
npm pack --dry-run
```

## Local Codex Installation

```bash
npx lazycodex-ai install
```

The installer builds and copies the plugin into `~/.codex/plugins/cache/sisyphuslabs/omo/0.1.0`, registers the `sisyphuslabs` marketplace from the `lazycodex` Git repository, installs runtime dependencies there, and enables:

```toml
[features]
plugins = true
plugin_hooks = true

[plugins."omo@sisyphuslabs"]
enabled = true
```

## Privacy

This plugin runs locally. The scaffold does not call a network service by itself.

## License

[MIT](LICENSE).

## Related

- [lazycodex](https://github.com/code-yeongyu/lazycodex) - Sisyphus Labs Codex marketplace repository.

One command gets you running. LazyCodex AI is currently available on OpenCode; the Codex edition is coming June 2026.

### Install

```bash
bunx lazycodex-ai install
```

This is exactly equivalent to `bunx --package oh-my-openagent omo install --platform=codex`.

### Autonomous one-liner

```bash
bunx lazycodex-ai install --no-tui --codex-autonomous
```

### Prerequisites

- [Bun](https://bun.sh)
- The [OpenAI Codex CLI](https://github.com/openai/codex)

> Do NOT use `npm install -g` or `bun add -g`. Always invoke via `bunx`.

### Let an agent do it

It is strongly recommended to let an LLM agent run the install and walk the setup for you. The agent handles subscription detection, model selection, and provider auth automatically.

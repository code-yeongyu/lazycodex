# Codex plugin MCP runtime cache failure

## Summary

`npx lazycodex-ai install` can leave the installed Codex plugin cache without the local MCP runtime packages needed by `ast_grep`, `git_bash`, and `lsp`.

The next Codex session then starts with MCP startup failures. Edit-like tool calls can also print `PostToolUse hook (failed)` because the LSP hook cannot resolve `@code-yeongyu/lsp-tools-mcp`.

## Environment

- OS: Windows
- Node: `v24.14.0`
- npm: `11.9.0`
- Install path seen locally: `C:\Users\<user>\.codex\plugins\cache\sisyphuslabs\omo\0.1.0`
- Install command used before the failure: `npx lazycodex-ai install`

## User-visible failures

Codex session startup:

```text
MCP client for `ast_grep` failed to start
MCP client for `git_bash` failed to start
MCP client for `lsp` failed to start
MCP startup incomplete (failed: ast_grep, git_bash, lsp)
```

After an edit-like tool call:

```text
PostToolUse hook (failed)
error: hook exited with code 1
```

## Evidence from the broken install

The installed plugin `.mcp.json` referenced sibling runtime directories:

```json
{
  "ast_grep": ["../../ast-grep-mcp/dist/cli.js", "mcp"],
  "git_bash": ["../../git-bash-mcp/dist/cli.js", "mcp"],
  "lsp": ["../../lsp-tools-mcp/dist/cli.js", "mcp"]
}
```

Those directories were not present under:

```text
C:\Users\<user>\.codex\plugins\cache\sisyphuslabs\
```

Direct startup reproduced the same failure:

```text
Error: Cannot find module 'C:\Users\<user>\.codex\plugins\cache\sisyphuslabs\ast-grep-mcp\dist\cli.js'
Error: Cannot find module 'C:\Users\<user>\.codex\plugins\cache\sisyphuslabs\git-bash-mcp\dist\cli.js'
Error: Cannot find module 'C:\Users\<user>\.codex\plugins\cache\sisyphuslabs\lsp-tools-mcp\dist\cli.js'
```

The LSP PostToolUse hook failed separately:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@code-yeongyu/lsp-tools-mcp' imported from ...\components\lsp\dist\codex-hook-cli.js
```

`comment-checker` and `rules` PostToolUse hooks exited `0` with the same payload. The failing hook was `components/lsp/dist/cli.js hook post-tool-use`.

## Current repository state worth checking

Current `plugins/omo/.mcp.json` points to component-local runtime paths:

```text
./components/ast-grep-mcp/dist/cli.js
./components/git-bash-mcp/dist/cli.js
./components/lsp-tools-mcp/dist/cli.js
```

In the checked-out repository, these directories were not present under `plugins/omo/components/`:

```text
plugins/omo/components/ast-grep-mcp
plugins/omo/components/git-bash-mcp
plugins/omo/components/lsp-tools-mcp
```

The tests still expected the old sibling paths in at least these files:

```text
plugins/omo/test/aggregate.test.mjs
plugins/omo/test/mcp-research-servers.test.mjs
```

That means the install artifact and the tests are not checking the same runtime layout.

## Local workaround that fixed the session

1. Copy the missing MCP runtimes into the path expected by the installed plugin cache.
2. Install `@ast-grep/cli` for `ast_grep` so `sg` resolves.
3. Point `node_modules/@code-yeongyu/lsp-tools-mcp` at a readable plugin-cache copy of `lsp-tools-mcp`, not the npx cache path.

After that:

```text
ast_grep initialize -> serverInfo.name = ast_grep
git_bash initialize -> serverInfo.name = git_bash
lsp initialize -> serverInfo.name = lsp
components/lsp/dist/cli.js hook post-tool-use -> exit 0
sg --version -> ast-grep 0.43.0
```

## Proposed fix

Make the installed Codex plugin self-contained for local MCP servers.

Checks that should pass after install:

1. Every local stdio MCP path in `plugins/omo/.mcp.json` exists relative to `PLUGIN_ROOT`.
2. `node components/lsp/dist/cli.js hook post-tool-use` exits `0` with a minimal Codex `PostToolUse` payload.
3. `ast_grep` can resolve a working `sg` binary without manual `npm install` in the plugin cache.
4. No hook or MCP path depends on an npx cache directory such as `AppData\Local\npm-cache\_npx\...`.

Likely files/components:

```text
plugins/omo/.mcp.json
plugins/omo/scripts/build-bundled-mcp-runtimes.mjs
plugins/omo/components/lsp/package.json
plugins/omo/test/aggregate.test.mjs
plugins/omo/test/mcp-research-servers.test.mjs
```

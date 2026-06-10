#!/usr/bin/env node

// src/cli.ts
import { argv, stderr } from "node:process";

// src/mcp-lifecycle-log.ts
import { appendFileSync, renameSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
var LOG_FILE_NAME = "omo-ast-grep-mcp.log";
var MAX_LOG_BYTES = 5 * 1024 * 1024;
function mcpLifecycleLogPath() {
  return join(tmpdir(), LOG_FILE_NAME);
}
function writeMcpLifecycleLog(event, fields = {}) {
  const path = mcpLifecycleLogPath();
  try {
    rotateLogIfNeeded(path);
    appendFileSync(path, `${JSON.stringify({ ts: new Date().toISOString(), event, pid: process.pid, ppid: process.ppid, ...fields })}
`);
  } catch (error) {
    if (error instanceof Error)
      return;
    return;
  }
}
function rotateLogIfNeeded(path) {
  try {
    if (statSync(path).size < MAX_LOG_BYTES)
      return;
    renameSync(path, `${path}.1`);
  } catch (error) {
    if (error instanceof Error)
      return;
    return;
  }
}

// ../ast-grep-core/src/language-support.ts
var CLI_LANGUAGES = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "elixir",
  "go",
  "haskell",
  "html",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "nix",
  "php",
  "python",
  "ruby",
  "rust",
  "scala",
  "solidity",
  "swift",
  "typescript",
  "tsx",
  "yaml"
];
var DEFAULT_TIMEOUT_MS = 300000;
var DEFAULT_MAX_OUTPUT_BYTES = 1 * 1024 * 1024;
var DEFAULT_MAX_MATCHES = 500;
// ../ast-grep-core/src/pattern-hints.ts
function detectRegexMisuse(pattern) {
  const src = pattern.trim();
  if (/\\[wWdDsSbB]/.test(src)) {
    return 'Hint: "\\w", "\\d", "\\s", "\\b" are regex escapes. ast-grep matches AST nodes, not text - use $VAR for identifiers, $$$ for node lists, or switch to grep for text search.';
  }
  if (/\[[a-zA-Z0-9]-[a-zA-Z0-9]\]/.test(src)) {
    return 'Hint: "[a-z]" and similar character classes are regex, not AST. Use $VAR to match any identifier, or switch to grep for text search.';
  }
  if (!src.includes("$") && /\w\.[*+]/.test(src)) {
    return 'Hint: ".*" and ".+" are regex wildcards. In ast-grep use $$$ for multiple AST nodes and $VAR for a single node. For text patterns, switch to grep.';
  }
  if (/^[-\w.*]+\|[-\w.*|]+$/.test(src)) {
    return 'Hint: "|" is regex alternation and does NOT work in ast-grep patterns. Options: (a) fire one ast_grep_search per alternative, or (b) switch to grep with a regex pattern like "foo|bar".';
  }
  return null;
}
function detectLanguageSpecificMistake(pattern, lang) {
  const src = pattern.trim();
  if (lang === "python") {
    if (src.startsWith("class ") && src.endsWith(":")) {
      return `Hint: Remove trailing colon. Try: "${src.slice(0, -1)}"`;
    }
    if ((src.startsWith("def ") || src.startsWith("async def ")) && src.endsWith(":")) {
      return `Hint: Remove trailing colon. Try: "${src.slice(0, -1)}"`;
    }
  }
  if (["javascript", "typescript", "tsx"].includes(lang)) {
    if (/^(export\s+)?(async\s+)?function\s+\$[A-Z_]+\s*$/i.test(src)) {
      return 'Hint: Function patterns need params and body. Try "function $NAME($$$) { $$$ }"';
    }
  }
  if (lang === "go") {
    if (/^func\s+\$[A-Z_]+\s*$/i.test(src)) {
      return 'Hint: Go function patterns need params and body. Try "func $NAME($$$) { $$$ }"';
    }
  }
  if (lang === "rust") {
    if (/^fn\s+\$[A-Z_]+\s*$/i.test(src)) {
      return 'Hint: Rust fn patterns need params and body. Try "fn $NAME($$$) { $$$ }"';
    }
  }
  return null;
}
function getPatternHint(pattern, lang) {
  return detectRegexMisuse(pattern) ?? detectLanguageSpecificMistake(pattern, lang);
}
// ../ast-grep-core/src/result-formatter.ts
function formatSearchResult(result) {
  if (result.error) {
    return `Error: ${result.error}`;
  }
  if (result.matches.length === 0) {
    return "No matches found";
  }
  const lines = [];
  if (result.truncated) {
    const reason = result.truncatedReason === "max_matches" ? `showing first ${result.matches.length} of ${result.totalMatches}` : result.truncatedReason === "max_output_bytes" ? "output exceeded 1MB limit" : "search timed out";
    lines.push(`[TRUNCATED] Results truncated (${reason})
`);
  }
  lines.push(`Found ${result.matches.length} match(es)${result.truncated ? ` (truncated from ${result.totalMatches})` : ""}:
`);
  for (const match of result.matches) {
    const loc = `${match.file}:${match.range.start.line + 1}:${match.range.start.column + 1}`;
    lines.push(`${loc}`);
    lines.push(`  ${match.lines.trim()}`);
    lines.push("");
  }
  return lines.join(`
`);
}
function formatReplaceResult(result, isDryRun) {
  if (result.error) {
    return `Error: ${result.error}`;
  }
  if (result.matches.length === 0) {
    return "No matches found to replace";
  }
  const prefix = isDryRun ? "[DRY RUN] " : "";
  const lines = [];
  if (result.truncated) {
    const reason = result.truncatedReason === "max_matches" ? `showing first ${result.matches.length} of ${result.totalMatches}` : result.truncatedReason === "max_output_bytes" ? "output exceeded 1MB limit" : "search timed out";
    lines.push(`[TRUNCATED] Results truncated (${reason})
`);
  }
  lines.push(`${prefix}${result.matches.length} replacement(s):
`);
  for (const match of result.matches) {
    const loc = `${match.file}:${match.range.start.line + 1}:${match.range.start.column + 1}`;
    lines.push(`${loc}`);
    lines.push(`  ${match.text}`);
    lines.push("");
  }
  if (isDryRun) {
    lines.push("Use dryRun=false to apply changes");
  }
  return lines.join(`
`);
}
// ../ast-grep-core/src/sg-compact-json-output.ts
function createSgResultFromStdout(stdout) {
  if (!stdout.trim()) {
    return { matches: [], totalMatches: 0, truncated: false };
  }
  const outputTruncated = stdout.length >= DEFAULT_MAX_OUTPUT_BYTES;
  const outputToProcess = outputTruncated ? stdout.substring(0, DEFAULT_MAX_OUTPUT_BYTES) : stdout;
  let matches = [];
  try {
    matches = JSON.parse(outputToProcess);
  } catch {
    if (outputTruncated) {
      try {
        const lastValidIndex = outputToProcess.lastIndexOf("}");
        if (lastValidIndex > 0) {
          const bracketIndex = outputToProcess.lastIndexOf("},", lastValidIndex);
          if (bracketIndex > 0) {
            const truncatedJson = outputToProcess.substring(0, bracketIndex + 1) + "]";
            matches = JSON.parse(truncatedJson);
          }
        }
      } catch {
        return {
          matches: [],
          totalMatches: 0,
          truncated: true,
          truncatedReason: "max_output_bytes",
          error: "Output too large and could not be parsed"
        };
      }
    } else {
      return { matches: [], totalMatches: 0, truncated: false };
    }
  }
  const totalMatches = matches.length;
  const matchesTruncated = totalMatches > DEFAULT_MAX_MATCHES;
  const finalMatches = matchesTruncated ? matches.slice(0, DEFAULT_MAX_MATCHES) : matches;
  return {
    matches: finalMatches,
    totalMatches,
    truncated: outputTruncated || matchesTruncated,
    truncatedReason: outputTruncated ? "max_output_bytes" : matchesTruncated ? "max_matches" : undefined
  };
}
// ../ast-grep-core/src/runner.ts
var SG_BINARY_NOT_FOUND_MESSAGE = `ast-grep (sg) binary not found.

` + `Install options:
` + `  bun add -D @ast-grep/cli
` + `  cargo install ast-grep --locked
` + `  brew install ast-grep`;
function buildSgArgs(options, flags) {
  const args = ["run", "-p", options.pattern, "--lang", options.lang];
  if (flags.includeJson) {
    args.push("--json=compact");
  }
  if (options.rewrite) {
    args.push("-r", options.rewrite);
    if (flags.includeUpdateAll) {
      args.push("--update-all");
    }
  }
  if (typeof options.context === "number" && options.context > 0) {
    args.push("-C", String(options.context));
  }
  if (options.globs) {
    for (const glob of options.globs) {
      args.push("--globs", glob);
    }
  }
  const paths = options.paths && options.paths.length > 0 ? options.paths : ["."];
  args.push("--", ...paths);
  return args;
}
async function runSg(options, deps) {
  const shouldSeparateWritePass = Boolean(options.rewrite && options.updateAll);
  const args = buildSgArgs(options, { includeJson: true, includeUpdateAll: false });
  let binary;
  try {
    binary = await deps.resolveBinary();
  } catch (error) {
    return {
      matches: [],
      totalMatches: 0,
      truncated: false,
      error: isNoEntryError(error) ? SG_BINARY_NOT_FOUND_MESSAGE : `Failed to resolve ast-grep binary: ${errorMessage(error)}`
    };
  }
  const searchResult = await trySpawn(binary, args, options.cwd, deps);
  if (searchResult.error) {
    return searchResult.error;
  }
  const output = searchResult.value;
  if (output.exitCode !== 0 && output.stdout.trim() === "") {
    if (output.stderr.includes("No files found")) {
      return { matches: [], totalMatches: 0, truncated: false };
    }
    if (output.stderr.trim()) {
      return { matches: [], totalMatches: 0, truncated: false, error: output.stderr.trim() };
    }
    return { matches: [], totalMatches: 0, truncated: false };
  }
  const jsonResult = createSgResultFromStdout(output.stdout);
  if (!(shouldSeparateWritePass && jsonResult.matches.length > 0)) {
    return jsonResult;
  }
  const writeArgs = buildSgArgs(options, { includeJson: false, includeUpdateAll: true });
  const writeResult = await trySpawn(binary, writeArgs, options.cwd, deps);
  if (writeResult.error) {
    return { ...jsonResult, error: `Replace failed: ${writeResult.error.error ?? "unknown error"}` };
  }
  if (writeResult.value.exitCode !== 0) {
    const errorDetail = writeResult.value.stderr.trim() || `ast-grep exited with code ${writeResult.value.exitCode}`;
    return { ...jsonResult, error: `Replace failed: ${errorDetail}` };
  }
  return jsonResult;
}
async function trySpawn(binary, args, cwd, deps) {
  try {
    const value = await deps.spawnProcess(binary, args, {
      cwd,
      stdout: "pipe",
      stderr: "pipe"
    });
    return { value };
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      return {
        error: {
          matches: [],
          totalMatches: 0,
          truncated: true,
          truncatedReason: "timeout",
          error: error.message
        }
      };
    }
    if (isNoEntryError(error)) {
      return {
        error: {
          matches: [],
          totalMatches: 0,
          truncated: false,
          error: SG_BINARY_NOT_FOUND_MESSAGE
        }
      };
    }
    return {
      error: {
        matches: [],
        totalMatches: 0,
        truncated: false,
        error: `Failed to spawn ast-grep: ${errorMessage(error)}`
      }
    };
  }
}
function isNoEntryError(error) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = Reflect.get(error, "code");
  const message = errorMessage(error);
  return code === "ENOENT" || message.includes("ENOENT") || message.includes("not found");
}
function errorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
// src/sg-cli-path.ts
import { createRequire } from "module";
import { dirname, join as join2 } from "path";
import { existsSync, statSync as statSync2 } from "fs";
function isValidBinary(filePath) {
  try {
    return statSync2(filePath).size > 1e4;
  } catch {
    return false;
  }
}
function getPlatformPackageName() {
  const platform = process.platform;
  const arch = process.arch;
  const platformMap = {
    "darwin-arm64": "@ast-grep/cli-darwin-arm64",
    "darwin-x64": "@ast-grep/cli-darwin-x64",
    "linux-arm64": "@ast-grep/cli-linux-arm64-gnu",
    "linux-x64": "@ast-grep/cli-linux-x64-gnu",
    "win32-x64": "@ast-grep/cli-win32-x64-msvc",
    "win32-arm64": "@ast-grep/cli-win32-arm64-msvc",
    "win32-ia32": "@ast-grep/cli-win32-ia32-msvc"
  };
  return platformMap[`${platform}-${arch}`] ?? null;
}
function findSgCliPathSync() {
  const binaryName = process.platform === "win32" ? "sg.exe" : "sg";
  try {
    const require2 = createRequire(import.meta.url);
    const cliPackageJsonPath = require2.resolve("@ast-grep/cli/package.json");
    const cliDirectory = dirname(cliPackageJsonPath);
    const sgPath = join2(cliDirectory, binaryName);
    if (existsSync(sgPath) && isValidBinary(sgPath)) {
      return sgPath;
    }
  } catch {}
  const platformPackage = getPlatformPackageName();
  if (platformPackage) {
    try {
      const require2 = createRequire(import.meta.url);
      const packageJsonPath = require2.resolve(`${platformPackage}/package.json`);
      const packageDirectory = dirname(packageJsonPath);
      const astGrepBinaryName = process.platform === "win32" ? "ast-grep.exe" : "ast-grep";
      const binaryPath = join2(packageDirectory, astGrepBinaryName);
      if (existsSync(binaryPath) && isValidBinary(binaryPath)) {
        return binaryPath;
      }
    } catch {}
  }
  if (process.platform === "darwin") {
    const homebrewPaths = ["/opt/homebrew/bin/sg", "/usr/local/bin/sg"];
    for (const path of homebrewPaths) {
      if (existsSync(path) && isValidBinary(path)) {
        return path;
      }
    }
  }
  return null;
}
var resolvedCliPath = null;
function getSgCliPath() {
  if (resolvedCliPath !== null) {
    return resolvedCliPath;
  }
  const syncPath = findSgCliPathSync();
  if (syncPath) {
    resolvedCliPath = syncPath;
    return syncPath;
  }
  return null;
}
function setSgCliPath(path) {
  resolvedCliPath = path;
}
// src/mcp-stdio-server.ts
import { createInterface } from "node:readline";
var DEFAULT_IDLE_TIMEOUT_MS = 10 * 60000;
var noopLog = () => {};
async function runJsonRpcStdioServer(handler, input, output, options, stdioOptions = {}) {
  const log = stdioOptions.log ?? noopLog;
  const idleTimeoutMs = stdioOptions.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const idleTimer = createIdleTimer(idleTimeoutMs, log, stdioOptions.onIdleTimeout);
  log("stdio_started", { cwd: process.cwd(), idle_timeout_ms: idleTimeoutMs });
  idleTimer.arm();
  const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
  try {
    for await (const line of lines) {
      if (idleTimer.closed())
        break;
      idleTimer.arm();
      if (!line.trim())
        continue;
      const parsed = parseJsonRpcLine(line, output, log);
      if (parsed === undefined)
        continue;
      const id = isRecord(parsed) ? jsonRpcId(parsed.id) : null;
      const method = isRecord(parsed) && typeof parsed.method === "string" ? parsed.method : null;
      log("request", { id: id === null ? null : String(id), method });
      const response = await handler(parsed, options);
      if (response) {
        output.write(`${JSON.stringify(response)}
`);
        log("response", { id: String(response.id), method, is_error: response.error !== undefined });
      }
    }
  } finally {
    idleTimer.clear();
    log("stdio_stopped");
  }
}
function createIdleTimer(idleTimeoutMs, log, onIdleTimeout) {
  let timer = null;
  let isClosed = false;
  return {
    arm: () => {
      if (timer !== null)
        clearTimeout(timer);
      if (idleTimeoutMs <= 0)
        return;
      timer = setTimeout(() => {
        isClosed = true;
        log("idle_timeout", { idle_timeout_ms: idleTimeoutMs });
        onIdleTimeout?.();
      }, idleTimeoutMs);
      timer.unref();
    },
    clear: () => {
      if (timer === null)
        return;
      clearTimeout(timer);
      timer = null;
    },
    closed: () => isClosed
  };
}
function parseJsonRpcLine(line, output, log) {
  try {
    return JSON.parse(line);
  } catch (error) {
    const message = messageFromError(error);
    log("parse_error", { message });
    output.write(`${JSON.stringify(errorResponse(null, -32700, "Parse error", message))}
`);
    return;
  }
}
function errorResponse(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}
function jsonRpcId(value) {
  return typeof value === "string" || typeof value === "number" || value === null ? value : null;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function messageFromError(error) {
  return error instanceof Error ? error.message : String(error);
}
// src/runner.ts
import { existsSync as existsSync3 } from "node:fs";

// src/bun-spawn-shim.ts
import { spawn as nodeSpawn, spawnSync as nodeSpawnSync } from "node:child_process";
import { Writable } from "node:stream";
var runtime = globalThis;
var IS_BUN = typeof runtime.Bun !== "undefined";
function emptyReadableStream() {
  return new ReadableStream({
    start(controller) {
      controller.close();
    }
  });
}
function toReadableStream(stream) {
  if (!stream)
    return emptyReadableStream();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(toUint8Array(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}
function toUint8Array(chunk) {
  if (chunk instanceof Uint8Array)
    return new Uint8Array(chunk);
  return new TextEncoder().encode(String(chunk));
}
function emptyWritableStream() {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    }
  });
}
function isOptionsWithCommand(value) {
  return typeof value === "object" && value !== null && "cmd" in value && Array.isArray(value.cmd);
}
function resolveCommand(cmdOrOpts, optsArg) {
  if (isOptionsWithCommand(cmdOrOpts))
    return { cmd: cmdOrOpts.cmd, opts: cmdOrOpts };
  return { cmd: cmdOrOpts, opts: optsArg ?? {} };
}
function resolveStdio(options) {
  if (options.stdio)
    return options.stdio;
  return [options.stdin ?? "ignore", options.stdout ?? "pipe", options.stderr ?? "inherit"];
}
function wrapNodeProcess(proc) {
  let exitCode = null;
  const exited = new Promise((resolve, reject) => {
    proc.on("exit", (code) => {
      exitCode = code ?? 1;
      resolve(exitCode);
    });
    proc.on("error", (error) => {
      if (exitCode === null) {
        exitCode = 1;
        reject(error);
      }
    });
  });
  return {
    get exitCode() {
      return exitCode;
    },
    exited,
    stdout: toReadableStream(proc.stdout),
    stderr: toReadableStream(proc.stderr),
    stdin: proc.stdin ?? emptyWritableStream(),
    pid: proc.pid,
    kill(signal) {
      if (proc.killed || exitCode !== null)
        return;
      proc.kill(signal);
    },
    ref() {
      proc.ref();
    },
    unref() {
      proc.unref();
    }
  };
}
function wrapBunProcess(proc) {
  return {
    ...proc,
    stdout: proc.stdout ?? emptyReadableStream(),
    stderr: proc.stderr ?? emptyReadableStream()
  };
}
function spawn(cmdOrOpts, opts) {
  const { cmd, opts: options } = resolveCommand(cmdOrOpts, opts);
  if (IS_BUN)
    return wrapBunProcess(runtime.Bun.spawn(cmd, options));
  const [bin, ...args] = cmd;
  if (!bin)
    throw new Error("spawn requires a command");
  return wrapNodeProcess(nodeSpawn(bin, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: resolveStdio(options),
    detached: options.detached,
    signal: options.signal
  }));
}

// src/cli-binary-path-resolution.ts
import { existsSync as existsSync2 } from "fs";
var resolvedCliPath2 = null;
var initPromise = null;
async function getAstGrepPath() {
  if (resolvedCliPath2 !== null && existsSync2(resolvedCliPath2)) {
    return resolvedCliPath2;
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    const syncPath = findSgCliPathSync();
    if (syncPath && existsSync2(syncPath)) {
      resolvedCliPath2 = syncPath;
      setSgCliPath(syncPath);
      return syncPath;
    }
    return null;
  })();
  return initPromise;
}

// src/process-output-timeout.ts
async function collectProcessOutputWithTimeout(process2, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      process2.kill();
      reject(new Error(`Search timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    process2.exited.then(() => clearTimeout(timeoutId));
  });
  const stdoutPromise = process2.stdout ? new Response(process2.stdout).text() : Promise.resolve("");
  const stderrPromise = process2.stderr ? new Response(process2.stderr).text() : Promise.resolve("");
  const stdout = await Promise.race([stdoutPromise, timeoutPromise]);
  const stderr = await stderrPromise;
  const exitCode = await process2.exited;
  return { stdout, stderr, exitCode };
}

// src/runner.ts
async function runSg2(options) {
  return runSg(options, {
    resolveBinary: resolveBinaryPath,
    spawnProcess
  });
}
async function resolveBinaryPath() {
  const cliPath = getSgCliPath();
  if (cliPath && existsSync3(cliPath)) {
    return cliPath;
  }
  const resolvedPath = await getAstGrepPath();
  if (!resolvedPath) {
    const noEntryError = new Error("ENOENT: ast-grep binary not found");
    Reflect.set(noEntryError, "code", "ENOENT");
    throw noEntryError;
  }
  return resolvedPath;
}
async function spawnProcess(binary, args, options) {
  const proc = spawn([binary, ...args], {
    cwd: options?.cwd,
    stdout: options?.stdout ?? "pipe",
    stderr: options?.stderr ?? "pipe"
  });
  return collectProcessOutputWithTimeout(proc, DEFAULT_TIMEOUT_MS);
}

// src/tool-descriptions.ts
var AST_GREP_SEARCH_DESCRIPTION = [
  "Search code by AST structure (25 languages). This is NOT regex.",
  "",
  "Meta-variables (the only wildcards ast-grep understands):",
  "  $VAR       - one AST node (an identifier, expression, statement, ...)",
  "  $$$        - zero or more nodes (argument lists, function bodies, ...)",
  "  $$$VAR     - same, captured by name",
  "Patterns must be complete, parseable source code. Each meta-variable replaces a whole node, not a substring.",
  "",
  "Regex syntax does NOT work - never pass these to pattern:",
  '  "foo|bar"      alternation → run separate calls, or switch to grep',
  '  ".*", ".+"     wildcards   → use $$$ between AST fragments',
  '  "\\w", "\\d"    escapes     → use $VAR to capture any identifier',
  '  "[a-z]"        class ranges → no AST equivalent',
  "For text search, cross-language search, or regex features, use the grep tool instead.",
  "",
  "Examples by language:",
  `  typescript/tsx  "function $NAME($$$) { $$$ }", "console.log($$$)", "import { $$$ } from '$MOD'"`,
  '  python          "def $FUNC($$$)", "class $C($$$)"          - no trailing colon',
  '  go              "func $NAME($$$) { $$$ }", "if err != nil { $$$ }"',
  '  rust            "fn $NAME($$$) -> $RET { $$$ }", "impl $TRAIT for $T { $$$ }"',
  "",
  "On empty results the tool returns a hint naming the exact mistake. If the pattern is fundamentally text-shaped, stop retrying and switch to grep."
].join(`
`);
var AST_GREP_SEARCH_PATTERN_PARAM = "AST pattern - valid, parseable code using $VAR (one node) and $$$ (many nodes). NOT regex: no `|`, no `.*`, no `\\w`, no `[a-z]`. For text or alternation, use grep instead.";
var AST_GREP_REPLACE_DESCRIPTION = [
  "Rewrite code by AST pattern (25 languages). Dry-run by default.",
  "Both pattern and rewrite use AST syntax ($VAR for one node, $$$ for many) - regex does NOT work.",
  "Meta-variables captured in pattern can be reused in rewrite to preserve matched content.",
  'Example: pattern="console.log($MSG)" rewrite="logger.info($MSG)"',
  "For text-only replacement or regex features, use a text editor instead."
].join(`
`);

// src/workspace-paths.ts
import { existsSync as existsSync4, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
function normalizeWorkspaceDirectory(workspaceDirectory) {
  return realpathSync(resolve(workspaceDirectory));
}
function resolveWorkspacePaths(rawPaths, workspaceDirectory) {
  const workspace = normalizeWorkspaceDirectory(workspaceDirectory);
  const requestedPaths = rawPaths && rawPaths.length > 0 ? rawPaths : ["."];
  return requestedPaths.map((rawPath) => resolveWorkspacePath(rawPath, workspace));
}
function resolveWorkspacePath(rawPath, workspaceDirectory) {
  if (rawPath.length === 0)
    throw new Error("paths entries must be non-empty strings");
  if (rawPath.startsWith("-"))
    throw new Error(`paths entries must not start with '-': ${rawPath}`);
  if (rawPath.includes("\x00"))
    throw new Error("paths entries must not contain null bytes");
  if (isAbsolute(rawPath))
    return resolveAbsoluteWorkspacePath(rawPath, workspaceDirectory);
  const absolutePath = resolve(workspaceDirectory, rawPath);
  assertInsideWorkspace(absolutePath, workspaceDirectory, rawPath);
  if (existsSync4(absolutePath)) {
    const realPath = realpathSync(absolutePath);
    assertInsideWorkspace(realPath, workspaceDirectory, rawPath);
  }
  const normalizedPath = relative(workspaceDirectory, absolutePath);
  return normalizedPath === "" ? "." : normalizedPath;
}
function resolveAbsoluteWorkspacePath(rawPath, workspaceDirectory) {
  let realPath;
  try {
    realPath = realpathSync(rawPath);
  } catch {
    throw new Error(`absolute path entry does not exist: ${rawPath}`);
  }
  assertInsideWorkspace(realPath, workspaceDirectory, rawPath);
  const normalizedPath = relative(workspaceDirectory, realPath);
  return normalizedPath === "" ? "." : normalizedPath;
}
function assertInsideWorkspace(candidatePath, workspaceDirectory, rawPath) {
  const workspaceRelativePath = relative(workspaceDirectory, candidatePath);
  if (workspaceRelativePath === "" || !workspaceRelativePath.startsWith("..") && !isAbsolute(workspaceRelativePath))
    return;
  throw new Error(`paths entries must stay inside the workspace: ${rawPath}`);
}

// src/mcp.ts
var SERVER_NAME = "ast_grep";
var SERVER_VERSION = "0.1.0";
var LANGUAGE_VALUES = CLI_LANGUAGES;
var DISABLED_TOOLS_ENV = "OMO_AST_GREP_DISABLED_TOOLS";
var AST_GREP_MCP_TOOLS = [
  {
    name: "search",
    title: "AST grep search",
    description: AST_GREP_SEARCH_DESCRIPTION,
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: AST_GREP_SEARCH_PATTERN_PARAM },
        lang: { type: "string", enum: CLI_LANGUAGES, description: "Target language" },
        paths: { type: "array", items: { type: "string" }, description: "Paths to search" },
        globs: { type: "array", items: { type: "string" }, description: "Include/exclude globs" },
        context: { type: "number", description: "Context lines around each match" }
      },
      required: ["pattern", "lang"],
      additionalProperties: false
    }
  },
  {
    name: "replace",
    title: "AST grep replace",
    description: AST_GREP_REPLACE_DESCRIPTION,
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "AST pattern to match" },
        rewrite: { type: "string", description: "Replacement pattern" },
        lang: { type: "string", enum: CLI_LANGUAGES, description: "Target language" },
        paths: { type: "array", items: { type: "string" }, description: "Paths to search" },
        globs: { type: "array", items: { type: "string" }, description: "Include/exclude globs" },
        dryRun: { type: "boolean", description: "Preview changes without applying. Defaults to true." }
      },
      required: ["pattern", "rewrite", "lang"],
      additionalProperties: false
    }
  }
];
async function handleAstGrepMcpRequest(input, options = {}) {
  if (!isRecord2(input))
    return errorResponse2(null, -32600, "Invalid Request");
  const id = jsonRpcId2(input.id);
  if (input.method === "notifications/initialized")
    return;
  if (input.method === "ping")
    return successResponse(id, {});
  if (input.method === "initialize") {
    return successResponse(id, {
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      protocolVersion: requestedProtocolVersion(input.params)
    });
  }
  if (input.method === "tools/list")
    return successResponse(id, { tools: enabledTools(options) });
  if (input.method === "tools/call")
    return handleToolCall(id, input.params, options);
  return errorResponse2(id, -32601, `Method not found: ${String(input.method)}`);
}
async function runMcpStdioServer(input = process.stdin, output = process.stdout, options = {}, stdioOptions = {}) {
  await runJsonRpcStdioServer(handleAstGrepMcpRequest, input, output, options, stdioOptions);
}
async function handleToolCall(id, params, options) {
  if (!isRecord2(params) || typeof params.name !== "string")
    return errorResponse2(id, -32602, "tools/call requires params.name");
  try {
    const result = await executeAstGrepTool(params.name, params.arguments, options);
    return successResponse(id, { content: result.content, isError: result.isError ?? false });
  } catch (error) {
    return successResponse(id, { content: [{ type: "text", text: messageFromError2(error) }], isError: true });
  }
}
async function executeAstGrepTool(name, args, options) {
  if (disabledToolNames(options).has(name))
    throw new Error(`ast-grep tool is disabled: ${name}`);
  const runner = options.runSg ?? runSg2;
  const workspaceDirectory = normalizeWorkspaceDirectory(options.workspaceDirectory ?? process.env.OMO_AST_GREP_WORKSPACE ?? process.cwd());
  if (name === "search") {
    const input = parseSearchArgs(args, workspaceDirectory);
    const result = await runner(input);
    let output = formatSearchResult(result);
    if (result.matches.length === 0 && !result.error) {
      const hint = getPatternHint(input.pattern, input.lang);
      if (hint)
        output += `

${hint}`;
    }
    return { content: [{ type: "text", text: output }], isError: Boolean(result.error) };
  }
  if (name === "replace") {
    const input = parseReplaceArgs(args, workspaceDirectory);
    const result = await runner(input.options);
    return { content: [{ type: "text", text: formatReplaceResult(result, input.dryRun) }], isError: Boolean(result.error) };
  }
  throw new Error(`Unknown ast-grep tool: ${name}`);
}
function parseSearchArgs(args, workspaceDirectory) {
  const input = requireRecord(args);
  return {
    pattern: requireString(input, "pattern"),
    lang: requireLanguage(input, "lang"),
    cwd: workspaceDirectory,
    paths: resolveWorkspacePaths(optionalStringArray(input, "paths"), workspaceDirectory),
    globs: optionalStringArray(input, "globs"),
    context: optionalNumber(input, "context")
  };
}
function parseReplaceArgs(args, workspaceDirectory) {
  const input = requireRecord(args);
  const dryRun = optionalBoolean(input, "dryRun") ?? true;
  return {
    dryRun,
    options: {
      pattern: requireString(input, "pattern"),
      rewrite: requireString(input, "rewrite"),
      lang: requireLanguage(input, "lang"),
      cwd: workspaceDirectory,
      paths: resolveWorkspacePaths(optionalStringArray(input, "paths"), workspaceDirectory),
      globs: optionalStringArray(input, "globs"),
      updateAll: !dryRun
    }
  };
}
function requireRecord(value) {
  if (!isRecord2(value))
    throw new Error("Tool arguments must be an object");
  return value;
}
function requireString(input, key) {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`${key} must be a non-empty string`);
  return value;
}
function requireLanguage(input, key) {
  const value = requireString(input, key);
  if (!isCliLanguage(value))
    throw new Error(`${key} must be one of: ${LANGUAGE_VALUES.join(", ")}`);
  return value;
}
function isCliLanguage(value) {
  return LANGUAGE_VALUES.includes(value);
}
function optionalStringArray(input, key) {
  const value = input[key];
  if (value === undefined)
    return;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string"))
    throw new Error(`${key} must be an array of strings`);
  return value;
}
function enabledTools(options) {
  const disabled = disabledToolNames(options);
  return AST_GREP_MCP_TOOLS.filter((tool) => !disabled.has(tool.name));
}
function disabledToolNames(options) {
  const fromOptions = options.disabledTools ?? [];
  const fromEnv = process.env[DISABLED_TOOLS_ENV]?.split(",") ?? [];
  return new Set([...fromOptions, ...fromEnv].map((tool) => tool.trim()).filter(Boolean));
}
function optionalNumber(input, key) {
  const value = input[key];
  if (value === undefined)
    return;
  if (typeof value !== "number")
    throw new Error(`${key} must be a number`);
  return value;
}
function optionalBoolean(input, key) {
  const value = input[key];
  if (value === undefined)
    return;
  if (typeof value !== "boolean")
    throw new Error(`${key} must be a boolean`);
  return value;
}
function successResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function errorResponse2(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}
function requestedProtocolVersion(params) {
  if (!isRecord2(params) || typeof params.protocolVersion !== "string")
    return "2024-11-05";
  return params.protocolVersion;
}
function jsonRpcId2(value) {
  return typeof value === "string" || typeof value === "number" || value === null ? value : null;
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function messageFromError2(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/cli.ts
async function main() {
  const [command = "mcp"] = argv.slice(2);
  if (command === "mcp") {
    await runMcpStdioServer(process.stdin, process.stdout, {}, {
      log: writeMcpLifecycleLog,
      onIdleTimeout: () => {
        process.exit(0);
      }
    });
    return;
  }
  stderr.write(`Usage: ast-grep-mcp [mcp]
`);
  process.exitCode = 2;
}
main().catch((error) => {
  stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}
`);
  process.exitCode = 1;
});

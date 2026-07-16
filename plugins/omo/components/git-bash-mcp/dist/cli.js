#!/usr/bin/env node

// src/cli.ts
import { argv, stderr } from "node:process";

// ../mcp-stdio-core/src/record.ts
function isPlainRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
// ../mcp-stdio-core/src/responses.ts
function successResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function errorResponse(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}
function jsonRpcId(value) {
  return typeof value === "string" || typeof value === "number" || value === null ? value : null;
}
function messageFromError(error) {
  return error instanceof Error ? error.message : String(error);
}
// ../mcp-stdio-core/src/transport.ts
var HEADER_SEPARATOR = Buffer.from(`\r
\r
`);
async function* readStdioJsonRpcMessages(input) {
  let buffer = Buffer.alloc(0);
  for await (const chunk of input) {
    buffer = Buffer.concat([buffer, bufferFromChunk(chunk)]);
    while (true) {
      const result = readNextMessage(buffer);
      if (result.kind === "incomplete")
        break;
      buffer = result.remaining;
      if (result.message)
        yield result.message;
    }
  }
  const trailing = buffer.toString("utf8").trim();
  if (trailing.length > 0) {
    yield parseJsonPayload(trailing, "line");
  }
}
async function writeStdioJsonRpcResponse(output, response, responseMode) {
  const body = JSON.stringify(response);
  const payload = responseMode === "framed" ? `Content-Length: ${Buffer.byteLength(body, "utf8")}\r
\r
${body}` : `${body}
`;
  await writeChunk(output, payload);
}
function writeChunk(output, chunk) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const onError = (error) => {
      if (settled)
        return;
      settled = true;
      reject(error);
    };
    output.once("error", onError);
    try {
      output.write(chunk, (error) => {
        if (settled)
          return;
        settled = true;
        if (error) {
          queueMicrotask(() => output.removeListener("error", onError));
          reject(error);
          return;
        }
        output.removeListener("error", onError);
        resolve();
      });
    } catch (error) {
      output.removeListener("error", onError);
      if (settled)
        return;
      settled = true;
      reject(error);
    }
  });
}
function readNextMessage(buffer) {
  if (buffer.length === 0)
    return { kind: "incomplete" };
  return startsWithContentLength(buffer) ? readFramedMessage(buffer) : readLineMessage(buffer);
}
function readLineMessage(buffer) {
  const newlineIndex = buffer.indexOf(10);
  if (newlineIndex === -1)
    return { kind: "incomplete" };
  const line = buffer.subarray(0, newlineIndex).toString("utf8").replace(/\r$/, "");
  if (line.trim().length === 0) {
    return { kind: "complete", remaining: buffer.subarray(newlineIndex + 1) };
  }
  return {
    kind: "complete",
    message: parseJsonPayload(line, "line"),
    remaining: buffer.subarray(newlineIndex + 1)
  };
}
function readFramedMessage(buffer) {
  const separatorIndex = buffer.indexOf(HEADER_SEPARATOR);
  if (separatorIndex === -1)
    return { kind: "incomplete" };
  const headers = buffer.subarray(0, separatorIndex).toString("ascii");
  const contentLength = parseContentLength(headers);
  const bodyStart = separatorIndex + HEADER_SEPARATOR.length;
  if (contentLength === undefined) {
    return {
      kind: "complete",
      message: {
        kind: "parse_error",
        message: "Missing or invalid Content-Length header",
        responseMode: "framed"
      },
      remaining: buffer.subarray(bodyStart)
    };
  }
  const bodyEnd = bodyStart + contentLength;
  if (buffer.length < bodyEnd)
    return { kind: "incomplete" };
  const body = buffer.subarray(bodyStart, bodyEnd).toString("utf8");
  return {
    kind: "complete",
    message: parseJsonPayload(body, "framed"),
    remaining: buffer.subarray(bodyEnd)
  };
}
function startsWithContentLength(buffer) {
  const prefix = buffer.subarray(0, "content-length:".length).toString("ascii").toLowerCase();
  return prefix === "content-length:";
}
function parseContentLength(headers) {
  for (const line of headers.split(`\r
`)) {
    const match = /^content-length:\s*(\d+)$/i.exec(line);
    if (match === null)
      continue;
    const value = match[1];
    if (value === undefined)
      return;
    return Number(value);
  }
  return;
}
function parseJsonPayload(payload, responseMode) {
  try {
    return { kind: "request", payload: JSON.parse(payload), responseMode };
  } catch (error) {
    return { kind: "parse_error", message: error instanceof Error ? error.message : String(error), responseMode };
  }
}
function bufferFromChunk(chunk) {
  if (Buffer.isBuffer(chunk))
    return chunk;
  if (typeof chunk === "string")
    return Buffer.from(chunk);
  throw new TypeError(`Unsupported stdio chunk type: ${typeof chunk}`);
}

// ../mcp-stdio-core/src/server.ts
var DEFAULT_IDLE_TIMEOUT_MS = 10 * 60000;
var noopLog = () => {};
async function runJsonRpcStdioServer(config) {
  const log = config.log ?? noopLog;
  const idleTimeoutMs = config.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const idleTimer = createIdleTimer(idleTimeoutMs, log, config.onIdleTimeout);
  log("stdio_started", { cwd: process.cwd(), idle_timeout_ms: idleTimeoutMs });
  idleTimer.arm();
  try {
    for await (const message of readStdioJsonRpcMessages(config.input)) {
      if (idleTimer.closed())
        break;
      idleTimer.arm();
      if (message.kind === "parse_error") {
        if (!await handleParseError(message, config, log))
          break;
        continue;
      }
      if (!await handleRequest(message, config, log))
        break;
    }
  } finally {
    idleTimer.clear();
    log("stdio_stopped");
  }
}
async function handleParseError(message, config, log) {
  log("parse_error", { message: message.message });
  const response = config.parseErrorResponse?.(message.message) ?? errorResponse(null, -32700, "Parse error", message.message);
  if (response === undefined)
    return true;
  return writeResponse(response, {
    output: config.output,
    responseMode: message.responseMode,
    log
  });
}
async function handleRequest(message, config, log) {
  const parsed = message.payload;
  const id = isPlainRecord(parsed) ? jsonRpcId(parsed["id"]) : null;
  const method = isPlainRecord(parsed) && typeof parsed["method"] === "string" ? parsed["method"] : null;
  log("request", { id: id === null ? null : String(id), method });
  let response;
  try {
    response = await config.handler(parsed, config.handlerOptions);
  } catch (error) {
    if (config.onHandlerError === undefined)
      throw error;
    config.onHandlerError(error);
    return true;
  }
  if (response === undefined)
    return true;
  if (!await writeResponse(response, {
    output: config.output,
    responseMode: message.responseMode,
    log
  }))
    return false;
  log("response", { id: String(response.id), method, is_error: response.error !== undefined });
  return true;
}
async function writeResponse(response, context) {
  try {
    await writeStdioJsonRpcResponse(context.output, response, context.responseMode);
    return true;
  } catch (error) {
    if (!isTerminalOutputError(error))
      throw error;
    context.log("output_error", { message: messageFromError(error) });
    return false;
  }
}
function isTerminalOutputError(error) {
  if (!(error instanceof Error) || !("code" in error))
    return false;
  return error.code === "EPIPE" || error.code === "ERR_STREAM_DESTROYED" || error.code === "ERR_STREAM_WRITE_AFTER_END";
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
// ../utils/src/runtime/git-bash.ts
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
var GIT_BASH_ENV_KEY = "OMO_CODEX_GIT_BASH_PATH";
var PROGRAM_FILES_GIT_BASH = "C:\\Program Files\\Git\\bin\\bash.exe";
var PROGRAM_FILES_X86_GIT_BASH = "C:\\Program Files (x86)\\Git\\bin\\bash.exe";
var NON_GIT_BASH_LAUNCHER_DIR_SEGMENTS = ["\\windows\\system32\\", "\\microsoft\\windowsapps\\"];
function resolveGitBash(input) {
  if (input.platform !== "win32")
    return { found: true, path: null, source: "not-required", checkedPaths: [] };
  const checkedPaths = [];
  const envPath = nonEmptyEnvValue(input.env, GIT_BASH_ENV_KEY);
  if (envPath !== undefined) {
    checkedPaths.push(envPath);
    if (isBashExePath(envPath) && input.exists(envPath)) {
      return { found: true, path: envPath, source: "env", checkedPaths };
    }
    return missingGitBash(checkedPaths);
  }
  for (const candidate of [
    { path: PROGRAM_FILES_GIT_BASH, source: "program-files" },
    { path: PROGRAM_FILES_X86_GIT_BASH, source: "program-files-x86" }
  ]) {
    checkedPaths.push(candidate.path);
    if (input.exists(candidate.path))
      return { found: true, path: candidate.path, source: candidate.source, checkedPaths };
  }
  for (const pathCandidate of input.where("bash")) {
    const candidate = pathCandidate.trim();
    if (candidate.length === 0)
      continue;
    checkedPaths.push(candidate);
    if (isKnownNonGitBashLauncher(candidate))
      continue;
    if (isBashExePath(candidate) && input.exists(candidate))
      return { found: true, path: candidate, source: "path", checkedPaths };
  }
  return missingGitBash(checkedPaths);
}
var resolveGitBashForCurrentProcess = (input = {}) => {
  return resolveGitBash({
    platform: input.platform ?? process.platform,
    env: input.env ?? process.env,
    exists: existsSync,
    where: whereCommand
  });
};
function missingGitBash(checkedPaths) {
  return {
    found: false,
    checkedPaths,
    installHint: [
      "Git Bash is required on native Windows.",
      "Install it with: winget install --id Git.Git -e --source winget",
      `For a custom install, set ${GIT_BASH_ENV_KEY}=C:\\path\\to\\bash.exe`
    ].join(`
`)
  };
}
function nonEmptyEnvValue(env, key) {
  const value = env[key];
  if (value === undefined)
    return;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
function isBashExePath(path) {
  return path.toLowerCase().endsWith("bash.exe");
}
function isKnownNonGitBashLauncher(path) {
  const normalized = path.replaceAll("/", "\\").toLowerCase();
  return NON_GIT_BASH_LAUNCHER_DIR_SEGMENTS.some((segment) => normalized.includes(segment));
}
function whereCommand(command) {
  try {
    return execFileSync("where", [command], { encoding: "utf8" }).split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  } catch (error) {
    if (error instanceof Error)
      return [];
    throw error;
  }
}
// src/runner.ts
import { spawn } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
async function runGitBashCommand(input) {
  return await new Promise((resolve, reject) => {
    const outputDirectory = mkdtempSync(join(tmpdir(), "omo-git-bash-run-"));
    const stdoutPath = join(outputDirectory, "stdout");
    const stderrPath = join(outputDirectory, "stderr");
    const stdoutFd = openSync(stdoutPath, "w+");
    const stderrFd = openSync(stderrPath, "w+");
    let outputClosed = false;
    function closeOutputFiles() {
      if (outputClosed) {
        return;
      }
      closeSync(stdoutFd);
      closeSync(stderrFd);
      outputClosed = true;
    }
    function readAndRemoveOutput() {
      closeOutputFiles();
      const stdout = readFileSync(stdoutPath, "utf8");
      const stderr = readFileSync(stderrPath, "utf8");
      rmSync(outputDirectory, { recursive: true, force: true });
      return { stdout, stderr };
    }
    const child = spawn(input.bashPath, ["-lc", input.command], {
      cwd: input.cwd,
      env: input.env,
      windowsHide: true,
      stdio: ["ignore", stdoutFd, stderrFd]
    });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, input.timeoutMs);
    timeout.unref();
    child.on("error", (error) => {
      clearTimeout(timeout);
      closeOutputFiles();
      rmSync(outputDirectory, { recursive: true, force: true });
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      const output = readAndRemoveOutput();
      resolve({ exitCode, ...output, timedOut });
    });
  });
}

// src/mcp.ts
var DEFAULT_TIMEOUT_MS = 120000;
var MAX_TIMEOUT_MS = 30 * 60000;
var EXEC_COMMAND_TIMEOUT_ENV_KEYS = [
  "OMO_CODEX_GIT_BASH_TIMEOUT_MS",
  "OMO_CODEX_EXEC_COMMAND_TIMEOUT_MS",
  "CODEX_EXEC_COMMAND_TIMEOUT_MS",
  "EXEC_COMMAND_TIMEOUT_MS"
];
async function handleGitBashMcpRequest(input, options = {}) {
  if (!isPlainRecord(input))
    return errorResponse(null, -32600, "Invalid Request");
  const id = jsonRpcId(input["id"]);
  const method = typeof input["method"] === "string" ? input["method"] : null;
  if (method === "initialize") {
    const protocolVersion = protocolVersionFromInput(input) ?? "2024-11-05";
    return successResponse(id, {
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "git_bash", version: "0.1.0" },
      protocolVersion
    });
  }
  if (method === "tools/list")
    return successResponse(id, { tools: toolsForOptions(options) });
  if (method === "tools/call") {
    const params = isPlainRecord(input["params"]) ? input["params"] : {};
    const name = typeof params["name"] === "string" ? params["name"] : "";
    const args = isPlainRecord(params["arguments"]) ? params["arguments"] : {};
    return await callTool(id, name, args, options);
  }
  if (method === "notifications/initialized")
    return;
  return errorResponse(id, -32601, "Method not found");
}
async function runMcpStdioServer(input, output, options = {}) {
  if (!canRunGitBash(options))
    return;
  await runJsonRpcStdioServer({
    input,
    output,
    handler: handleGitBashMcpRequest,
    handlerOptions: options,
    idleTimeoutMs: 0,
    log: options.lifecycleLog,
    parseErrorResponse: () => errorResponse(null, -32601, "Method not found")
  });
}
async function callTool(id, name, args, options) {
  if (name === "which_bash")
    return toolResponse(id, whichBashPayload(resolve(options)));
  if (name === "diagnose")
    return toolResponse(id, diagnosePayload(resolve(options), platformFromOptions(options)));
  if (name === "run")
    return await runToolResponse(id, args, options);
  return toolResponse(id, `Unknown git_bash tool: ${name}`, true);
}
async function runToolResponse(id, args, options) {
  const platform = platformFromOptions(options);
  if (platform !== "win32")
    return toolResponse(id, "git_bash run is only available on native Windows.", true);
  const command = typeof args.command === "string" ? args.command.trim() : "";
  if (command.length === 0)
    return toolResponse(id, "run.command must be a non-empty string.", true);
  const cwd = parseWorkdir(args);
  if (cwd === null)
    return toolResponse(id, "run.workdir must be a non-empty string when provided.", true);
  const timeoutMs = parseTimeoutMs(args.timeout ?? args.timeout_ms, options);
  if (timeoutMs === null)
    return toolResponse(id, `run.timeout must be an integer between 1 and ${MAX_TIMEOUT_MS}.`, true);
  const resolution = resolve(options);
  if (!resolution.found || resolution.path === null)
    return toolResponse(id, whichBashPayload(resolution), true);
  try {
    const run = options.runGitBash ?? runGitBashCommand;
    const result = await run({ bashPath: resolution.path, command, cwd, timeoutMs, env: options.env ?? process.env });
    return toolResponse(id, runPayload(result));
  } catch (error) {
    return toolResponse(id, error instanceof Error ? error.message : String(error), true);
  }
}
function toolsForOptions(options) {
  const sharedTools = [
    {
      name: "which_bash",
      description: "Resolve the Git Bash bash.exe path used by the git_bash MCP.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }
    },
    {
      name: "diagnose",
      description: "Report whether Git Bash command execution is available on this host.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }
    }
  ];
  if (!canRunGitBash(options))
    return sharedTools;
  return [
    {
      name: "run",
      description: "Run a shell command through Git Bash on native Windows. Prefer this git_bash run tool for bash/shell commands on Windows before built-in exec_command or Bash; use exec_command only when git_bash is unavailable or for non-shell operations.",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "The command to execute." },
          timeout: {
            type: "integer",
            minimum: 1,
            maximum: MAX_TIMEOUT_MS,
            description: `Optional timeout in milliseconds. If omitted, uses the inherited exec_command timeout when configured; otherwise ${defaultTimeoutMs(options)}ms.`
          },
          workdir: {
            type: "string",
            description: "The working directory to run the command in. Defaults to the current directory. Use this instead of 'cd' commands."
          },
          description: {
            type: "string",
            description: "Clear, concise description of what this command does in 5-10 words."
          }
        },
        required: ["command"],
        additionalProperties: false
      }
    },
    ...sharedTools
  ];
}
function canRunGitBash(options) {
  if (platformFromOptions(options) !== "win32")
    return false;
  const resolution = resolve(options);
  return resolution.found && resolution.path !== null;
}
function resolve(options) {
  if (options.exists === undefined && options.where === undefined) {
    return resolveGitBashForCurrentProcess({
      platform: options.platform,
      env: options.env
    });
  }
  return resolveGitBash({
    platform: platformFromOptions(options),
    env: options.env ?? process.env,
    exists: options.exists ?? (() => false),
    where: options.where ?? (() => [])
  });
}
function platformFromOptions(options) {
  return options.platform ?? process.platform;
}
function whichBashPayload(resolution) {
  return JSON.stringify(resolution, null, 2);
}
function diagnosePayload(resolution, platform) {
  const enabled = platform === "win32" && resolution.found && resolution.path !== null;
  const payload = {
    platform,
    enabled,
    status: platform === "win32" ? enabled ? "ready" : "missing-git-bash" : "disabled: git_bash command execution is only exposed on native Windows",
    resolution
  };
  return JSON.stringify(payload, null, 2);
}
function runPayload(result) {
  return JSON.stringify(result, null, 2);
}
function toolResponse(id, text, isError = false) {
  return successResponse(id, { content: [{ type: "text", text }], isError });
}
function parseWorkdir(args) {
  const value = args.workdir ?? args.cwd;
  if (value === undefined)
    return;
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
function parseTimeoutMs(value, options) {
  if (value === undefined)
    return defaultTimeoutMs(options);
  return normalizeTimeoutMs(value);
}
function defaultTimeoutMs(options) {
  const configured = normalizeTimeoutMs(options.defaultTimeoutMs);
  if (configured !== null)
    return configured;
  const env = options.env ?? process.env;
  for (const key of EXEC_COMMAND_TIMEOUT_ENV_KEYS) {
    const timeoutMs = normalizeTimeoutMs(env[key]);
    if (timeoutMs !== null)
      return timeoutMs;
  }
  return DEFAULT_TIMEOUT_MS;
}
function normalizeTimeoutMs(value) {
  const parsed = typeof value === "string" && value.trim().length > 0 ? Number(value) : value;
  if (!Number.isInteger(parsed))
    return null;
  const timeoutMs = Number(parsed);
  if (timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS)
    return null;
  return timeoutMs;
}
function protocolVersionFromInput(input) {
  if (!isPlainRecord(input["params"]))
    return null;
  const params = input["params"];
  return typeof params["protocolVersion"] === "string" ? params["protocolVersion"] : null;
}

// src/cli.ts
async function main() {
  const [command = "mcp"] = argv.slice(2);
  if (command === "mcp") {
    await runMcpStdioServer(process.stdin, process.stdout);
    return;
  }
  stderr.write(`Usage: omo-git-bash [mcp]
`);
  process.exitCode = 2;
}
main().catch((error) => {
  stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}
`);
  process.exitCode = 1;
});

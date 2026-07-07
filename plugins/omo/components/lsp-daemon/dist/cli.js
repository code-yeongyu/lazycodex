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
function writeStdioJsonRpcResponse(output, response, responseMode) {
  const body = JSON.stringify(response);
  if (responseMode === "framed") {
    output.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r
\r
${body}`);
    return;
  }
  output.write(`${body}
`);
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
        handleParseError(message, config, log);
        continue;
      }
      await handleRequest(message, config, log);
    }
  } finally {
    idleTimer.clear();
    log("stdio_stopped");
  }
}
function handleParseError(message, config, log) {
  log("parse_error", { message: message.message });
  const response = config.parseErrorResponse?.(message.message) ?? errorResponse(null, -32700, "Parse error", message.message);
  if (response !== undefined) {
    writeStdioJsonRpcResponse(config.output, response, message.responseMode);
  }
}
async function handleRequest(message, config, log) {
  const parsed = message.payload;
  const id = isPlainRecord(parsed) ? jsonRpcId(parsed["id"]) : null;
  const method = isPlainRecord(parsed) && typeof parsed["method"] === "string" ? parsed["method"] : null;
  log("request", { id: id === null ? null : String(id), method });
  try {
    const response = await config.handler(parsed, config.handlerOptions);
    if (response === undefined)
      return;
    writeStdioJsonRpcResponse(config.output, response, message.responseMode);
    log("response", { id: String(response.id), method, is_error: response.error !== undefined });
  } catch (error) {
    if (config.onHandlerError === undefined)
      throw error;
    config.onHandlerError(error);
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
// ../lsp-core/src/tools/diagnostics.ts
import { resolve as resolve4 } from "node:path";

// ../lsp-core/src/lsp/client-wrapper.ts
import { existsSync as existsSync5, statSync as statSync2 } from "node:fs";
import { dirname as dirname2, join as join5, resolve as resolve2 } from "node:path";

// ../lsp-core/src/request-context.ts
import { AsyncLocalStorage } from "node:async_hooks";
var storage = new AsyncLocalStorage;
function runWithRequestContext(context, fn) {
  return storage.run(context, fn);
}
function contextCwd() {
  return storage.getStore()?.cwd ?? process.cwd();
}
function contextEnv(key) {
  const store = storage.getStore();
  if (store?.env)
    return store.env[key];
  return process.env[key];
}

// ../lsp-core/src/lsp/effective-extension.ts
import { basename, extname } from "node:path";
var BASENAME_EXTENSIONS = {
  Dockerfile: ".dockerfile",
  Containerfile: ".dockerfile"
};
function effectiveExtension(filePath) {
  return BASENAME_EXTENSIONS[basename(filePath)] ?? extname(filePath);
}

// ../lsp-core/src/lsp/errors.ts
class LspConnectionClosedError extends Error {
  serverId;
  root;
  name = "LspConnectionClosedError";
  constructor(serverId, root, message) {
    super(message ?? `LSP connection closed for ${serverId} at ${root}`);
    this.serverId = serverId;
    this.root = root;
  }
}

class LspProcessExitedError extends Error {
  serverId;
  root;
  exitCode;
  stderrTail;
  name = "LspProcessExitedError";
  constructor(serverId, root, exitCode, stderrTail) {
    const stderrSuffix = stderrTail ? `
stderr tail: ${stderrTail}` : "";
    super(`LSP server ${serverId} at ${root} exited with code ${exitCode ?? "null"}${stderrSuffix}`);
    this.serverId = serverId;
    this.root = root;
    this.exitCode = exitCode;
    this.stderrTail = stderrTail;
  }
}

class LspRequestTimeoutError extends Error {
  method;
  stderrTail;
  name = "LspRequestTimeoutError";
  constructor(method, stderrTail) {
    const stderrSuffix = stderrTail ? `
recent stderr: ${stderrTail}` : "";
    super(`LSP request timeout (method: ${method})${stderrSuffix}`);
    this.method = method;
    this.stderrTail = stderrTail;
  }
}

class LspInvalidPathError extends Error {
  name = "LspInvalidPathError";
}

class LspServerLookupError extends Error {
  name = "LspServerLookupError";
}

class LspServerInitializingError extends Error {
  originalError;
  name = "LspServerInitializingError";
  constructor(originalError) {
    super(`LSP server is still initializing. Please retry in a few seconds. Original error: ${originalError.message}`);
    this.originalError = originalError;
  }
}

class LspProcessSpawnError extends Error {
  name = "LspProcessSpawnError";
}
function isLspDeadConnectionError(err) {
  return err instanceof LspConnectionClosedError || err instanceof LspProcessExitedError;
}

// ../lsp-core/src/lsp/cleanup-errors.ts
function reportBestEffortCleanupError(operation, error) {
  if (process.env["CODEX_LSP_DEBUG_CLEANUP"] !== "1")
    return;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[codex-lsp] ignored ${operation} failure during cleanup: ${message}`);
}

// ../lsp-core/src/lsp/client.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL as pathToFileURL2 } from "node:url";

// ../lsp-core/src/lsp/connection.ts
import { pathToFileURL } from "node:url";

// ../lsp-core/src/lsp/constants.ts
var DEFAULT_MAX_REFERENCES = 200;
var DEFAULT_MAX_SYMBOLS = 200;
var DEFAULT_MAX_DIAGNOSTICS = 200;
var DEFAULT_MAX_DIRECTORY_FILES = 50;
var REQUEST_TIMEOUT_MS = 15000;
var INIT_TIMEOUT_MS = 60000;
var IDLE_TIMEOUT_MS = 5 * 60000;
var REAPER_INTERVAL_MS = 60000;
var STOP_HARD_KILL_TIMEOUT_MS = 5000;
var STOP_SIGKILL_GRACE_MS = 1000;

// ../lsp-core/src/lsp/json-rpc-connection.ts
var HEADER_SEPARATOR2 = `\r
\r
`;
var PARSE_ERROR = -32700;
var INVALID_REQUEST = -32600;
var METHOD_NOT_FOUND = -32601;
var INTERNAL_ERROR = -32603;

class JsonRpcConnection {
  reader;
  writer;
  pendingRequests = new Map;
  notificationHandlers = new Map;
  requestHandlers = new Map;
  closeHandlers = [];
  errorHandlers = [];
  inputBuffer = Buffer.alloc(0);
  nextRequestId = 1;
  listening = false;
  disposed = false;
  constructor(reader, writer) {
    this.reader = reader;
    this.writer = writer;
  }
  listen() {
    if (this.listening)
      return;
    this.listening = true;
    this.reader.on("data", this.handleData);
    this.reader.on("close", this.handleClose);
    this.reader.on("end", this.handleClose);
    this.reader.on("error", this.handleStreamError);
    this.writer.on("error", this.handleStreamError);
  }
  onNotification(method, handler) {
    this.notificationHandlers.set(method, handler);
  }
  onRequest(method, handler) {
    this.requestHandlers.set(method, handler);
  }
  onClose(handler) {
    this.closeHandlers.push(handler);
  }
  onError(handler) {
    this.errorHandlers.push(handler);
  }
  async sendRequest(method, params) {
    if (this.disposed)
      throw new Error("JSON-RPC connection is disposed");
    const id = this.nextRequestId;
    this.nextRequestId += 1;
    const message = params === undefined ? { jsonrpc: "2.0", id, method } : { jsonrpc: "2.0", id, method, params };
    const responsePromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(String(id), {
        resolve(result) {
          resolve(result);
        },
        reject
      });
    });
    try {
      await this.writeMessage(message);
    } catch (error) {
      this.pendingRequests.delete(String(id));
      throw error;
    }
    return responsePromise;
  }
  async sendNotification(method, params) {
    if (this.disposed)
      return;
    const message = params === undefined ? { jsonrpc: "2.0", method } : { jsonrpc: "2.0", method, params };
    await this.writeMessage(message);
  }
  dispose() {
    if (this.disposed)
      return;
    this.disposed = true;
    this.reader.off("data", this.handleData);
    this.reader.off("close", this.handleClose);
    this.reader.off("end", this.handleClose);
    this.reader.off("error", this.handleStreamError);
    this.writer.off("error", this.handleStreamError);
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error("JSON-RPC connection disposed"));
    }
    this.pendingRequests.clear();
    this.notificationHandlers.clear();
    this.requestHandlers.clear();
  }
  handleData = (chunk) => {
    const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf8");
    this.inputBuffer = Buffer.concat([this.inputBuffer, chunkBuffer]);
    this.drainInputBuffer();
  };
  handleClose = () => {
    for (const handler of this.closeHandlers) {
      handler();
    }
  };
  handleStreamError = (error) => {
    this.emitError(error);
  };
  drainInputBuffer() {
    while (true) {
      const headerEnd = this.inputBuffer.indexOf(HEADER_SEPARATOR2);
      if (headerEnd === -1)
        return;
      const headers = this.inputBuffer.subarray(0, headerEnd).toString("ascii");
      const contentLength = parseContentLength2(headers);
      if (contentLength === null) {
        this.inputBuffer = Buffer.alloc(0);
        this.emitError(new Error("JSON-RPC message is missing Content-Length header"));
        return;
      }
      const bodyStart = headerEnd + Buffer.byteLength(HEADER_SEPARATOR2);
      const bodyEnd = bodyStart + contentLength;
      if (this.inputBuffer.length < bodyEnd)
        return;
      const body = this.inputBuffer.subarray(bodyStart, bodyEnd).toString("utf8");
      this.inputBuffer = this.inputBuffer.subarray(bodyEnd);
      this.dispatchBody(body);
    }
  }
  dispatchBody(body) {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      this.writeError(null, PARSE_ERROR, error instanceof Error ? error.message : "Parse error").catch((writeError) => this.emitError(toError(writeError)));
      return;
    }
    if (!isJsonRpcObject(parsed)) {
      this.writeError(null, INVALID_REQUEST, "Invalid JSON-RPC message").catch((error) => this.emitError(toError(error)));
      return;
    }
    if ("id" in parsed && (("result" in parsed) || ("error" in parsed))) {
      this.handleResponse(parsed);
      return;
    }
    if (typeof parsed["method"] !== "string") {
      const id = getMessageId(parsed) ?? null;
      this.writeError(id, INVALID_REQUEST, "Invalid JSON-RPC method").catch((error) => this.emitError(toError(error)));
      return;
    }
    if ("id" in parsed) {
      this.handleRequest(parsed);
      return;
    }
    this.handleNotification(parsed["method"], parsed["params"]);
  }
  handleResponse(message) {
    const id = getMessageId(message);
    if (id === undefined)
      return;
    const pending = this.pendingRequests.get(String(id));
    if (!pending)
      return;
    this.pendingRequests.delete(String(id));
    if ("error" in message) {
      pending.reject(jsonRpcErrorToError(message["error"]));
      return;
    }
    pending.resolve(message["result"]);
  }
  handleNotification(method, params) {
    const handler = this.notificationHandlers.get(method);
    if (!handler)
      return;
    try {
      handler(params);
    } catch (error) {
      this.emitError(toError(error));
    }
  }
  handleRequest(message) {
    const id = getMessageId(message);
    if (id === undefined) {
      this.writeError(null, INVALID_REQUEST, "Invalid JSON-RPC id").catch((error) => this.emitError(toError(error)));
      return;
    }
    const method = typeof message["method"] === "string" ? message["method"] : "";
    const handler = this.requestHandlers.get(method);
    if (!handler) {
      this.writeError(id, METHOD_NOT_FOUND, `Method not found: ${method}`).catch((error) => this.emitError(toError(error)));
      return;
    }
    Promise.resolve().then(() => handler(message["params"])).then((result) => this.writeMessage({ jsonrpc: "2.0", id, result }), (error) => this.writeError(id, INTERNAL_ERROR, toError(error).message)).catch((error) => this.emitError(toError(error)));
  }
  async writeError(id, code, message) {
    await this.writeMessage({ jsonrpc: "2.0", id, error: { code, message } });
  }
  writeMessage(message) {
    const body = JSON.stringify(message);
    const payload = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r
\r
${body}`;
    return new Promise((resolve, reject) => {
      this.writer.write(payload, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
  emitError(error) {
    for (const handler of this.errorHandlers) {
      handler(error);
    }
  }
}
function parseContentLength2(headers) {
  for (const line of headers.split(`\r
`)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1)
      continue;
    const name = line.slice(0, separatorIndex).trim().toLowerCase();
    if (name !== "content-length")
      continue;
    const value = Number.parseInt(line.slice(separatorIndex + 1).trim(), 10);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  return null;
}
function isJsonRpcObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getMessageId(message) {
  const id = message["id"];
  if (typeof id === "number" || typeof id === "string" || id === null)
    return id;
  return;
}
function jsonRpcErrorToError(value) {
  if (!isJsonRpcObject(value))
    return new Error("JSON-RPC request failed");
  const message = typeof value["message"] === "string" ? value["message"] : "JSON-RPC request failed";
  const error = new Error(message);
  if (typeof value["code"] === "number") {
    error.name = `JsonRpcError(${value["code"]})`;
  }
  return error;
}
function toError(error) {
  return error instanceof Error ? error : new Error(String(error));
}

// ../lsp-core/src/lsp/process.ts
import { spawn, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { delimiter, join } from "node:path";
function isMissingProcessError(error) {
  if (!(error instanceof Error) || !("code" in error))
    return false;
  return error.code === "ESRCH";
}
function reportKillError(context, error) {
  if (!isMissingProcessError(error)) {
    reportBestEffortCleanupError(context, error);
  }
}
function validateCwd(cwd) {
  try {
    if (!existsSync(cwd)) {
      return { valid: false, error: `Working directory does not exist: ${cwd}` };
    }
    const stats = statSync(cwd);
    if (!stats.isDirectory()) {
      return { valid: false, error: `Path is not a directory: ${cwd}` };
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Cannot access working directory: ${cwd} (${err instanceof Error ? err.message : String(err)})`
    };
  }
}
function wrap(proc) {
  const exitedPromise = new Promise((resolve) => {
    proc.once("close", (code) => resolve(code ?? 0));
    proc.once("error", () => resolve(1));
  });
  if (!proc.stdin || !proc.stdout || !proc.stderr) {
    throw new LspProcessSpawnError("Spawned process is missing one of stdin/stdout/stderr pipes");
  }
  return {
    stdin: proc.stdin,
    stdout: proc.stdout,
    stderr: proc.stderr,
    get pid() {
      return proc.pid ?? undefined;
    },
    get exitCode() {
      return proc.exitCode;
    },
    get killed() {
      return proc.killed;
    },
    exited: exitedPromise,
    kill(signal) {
      killProcessTree(proc, signal ?? "SIGTERM");
    }
  };
}
function killProcessTree(proc, signal) {
  if (process.platform === "win32" && proc.pid) {
    const result = spawnSync("taskkill", ["/pid", String(proc.pid), "/f", "/t"], {
      stdio: "ignore",
      windowsHide: true
    });
    if (!result.error && result.status === 0)
      return;
    if (result.error)
      reportKillError("windows process tree kill", result.error);
  }
  if (process.platform !== "win32" && proc.pid) {
    try {
      process.kill(-proc.pid, signal);
      return;
    } catch (error) {
      reportKillError("process group kill", error);
    }
  }
  try {
    proc.kill(signal);
  } catch (error) {
    reportKillError("process kill", error);
  }
}
function isWindowsShellShim(command) {
  const lowerCommand = command.toLowerCase();
  return lowerCommand.endsWith(".cmd") || lowerCommand.endsWith(".bat");
}
function splitPath(pathValue, platform) {
  const separator = platform === "win32" ? ";" : delimiter;
  return pathValue.split(separator).filter(Boolean);
}
function getWindowsPathExtensions(env) {
  const rawExtensions = env["PATHEXT"] ?? ".COM;.EXE;.BAT;.CMD";
  const extensions = rawExtensions.split(";").map((extension) => extension.trim()).filter(Boolean).map((extension) => extension.startsWith(".") ? extension : `.${extension}`);
  return [...new Set([...extensions, ".exe", ".cmd", ".bat", ""])];
}
function resolveWindowsCommand(command, env) {
  const hasPathSeparator = command.includes("/") || command.includes("\\");
  const pathValue = env["PATH"] ?? env["Path"] ?? "";
  const baseDirectories = hasPathSeparator ? [""] : splitPath(pathValue, "win32");
  const extensions = getWindowsPathExtensions(env);
  for (const baseDirectory of baseDirectories) {
    for (const extension of extensions) {
      const candidate = baseDirectory ? join(baseDirectory, `${command}${extension}`) : `${command}${extension}`;
      if (existsSync(candidate))
        return candidate;
    }
  }
  return command;
}
function createSpawnCommand(command, platform = process.platform, commandProcessor = process.env["ComSpec"] ?? "cmd.exe", env = process.env) {
  const [cmd, ...args] = command;
  if (!cmd) {
    throw new LspProcessSpawnError("[lsp] empty command");
  }
  if (platform !== "win32") {
    return { command: cmd, args, shell: false };
  }
  const resolvedCommand = resolveWindowsCommand(cmd, env);
  if (!isWindowsShellShim(resolvedCommand)) {
    return { command: resolvedCommand, args, shell: false };
  }
  return {
    command: commandProcessor,
    args: ["/d", "/s", "/c", resolvedCommand, ...args],
    shell: false
  };
}
function spawnProcess(command, options) {
  const cwdValidation = validateCwd(options.cwd);
  if (!cwdValidation.valid) {
    throw new LspInvalidPathError(`[lsp] ${cwdValidation.error}`);
  }
  const [cmd] = command;
  if (!cmd) {
    throw new LspProcessSpawnError("[lsp] empty command");
  }
  const preparedCommand = createSpawnCommand(command, process.platform, process.env["ComSpec"] ?? "cmd.exe", options.env);
  const proc = spawn(preparedCommand.command, preparedCommand.args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    shell: preparedCommand.shell,
    detached: process.platform !== "win32"
  });
  return wrap(proc);
}

// ../lsp-core/src/lsp/transport.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseConfigurationItems(params) {
  if (!isRecord(params) || !Array.isArray(params["items"]))
    return [];
  const items = [];
  for (const item of params["items"]) {
    if (!isRecord(item))
      continue;
    const section = item["section"];
    items.push(section === undefined || typeof section !== "string" ? {} : { section });
  }
  return items;
}
function parseDiagnosticsParams(params) {
  if (!isRecord(params) || typeof params["uri"] !== "string")
    return null;
  const diagnostics = Array.isArray(params["diagnostics"]) ? params["diagnostics"].filter(isDiagnostic) : [];
  return { uri: params["uri"], diagnostics };
}

class LspClientTransport {
  root;
  server;
  proc = null;
  connection = null;
  stderrBuffer = [];
  processExited = false;
  diagnosticsStore = new Map;
  requestTimeoutMs;
  initializeTimeoutMs;
  constructor(root, server2, timeouts = {}) {
    this.root = root;
    this.server = server2;
    this.requestTimeoutMs = timeouts.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;
    this.initializeTimeoutMs = timeouts.initializeTimeoutMs ?? INIT_TIMEOUT_MS;
  }
  pid() {
    return this.proc?.pid;
  }
  command() {
    return [...this.server.command];
  }
  async start() {
    const env = createLspSpawnEnv(this.root, {
      ...process.env,
      ...this.server.env
    });
    this.proc = spawnProcess(this.server.command, {
      cwd: this.root,
      env
    });
    this.startStderrReading();
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (this.proc.exitCode !== null) {
      const stderr = this.stderrBuffer.join(`
`);
      throw new LspProcessExitedError(this.server.id, this.root, this.proc.exitCode, stderr.slice(-2000));
    }
    this.connection = new JsonRpcConnection(this.proc.stdout, this.proc.stdin);
    this.connection.onNotification("textDocument/publishDiagnostics", (params) => {
      const diagnosticsParams = parseDiagnosticsParams(params);
      if (diagnosticsParams?.uri) {
        this.diagnosticsStore.set(diagnosticsParams.uri, diagnosticsParams.diagnostics);
      }
    });
    this.connection.onRequest("workspace/configuration", (params) => {
      const items = parseConfigurationItems(params);
      return items.map((item) => {
        if (item.section === "json")
          return { validate: { enable: true } };
        return {};
      });
    });
    this.connection.onRequest("client/registerCapability", () => null);
    this.connection.onRequest("window/workDoneProgress/create", () => null);
    this.connection.onClose(() => {
      this.processExited = true;
    });
    this.connection.onError((error) => {
      reportBestEffortCleanupError("connection error notification", error);
    });
    this.connection.listen();
  }
  startStderrReading() {
    if (!this.proc)
      return;
    this.proc.stderr.setEncoding("utf-8");
    this.proc.stderr.on("data", (chunk) => {
      this.stderrBuffer.push(chunk);
      if (this.stderrBuffer.length > 100) {
        this.stderrBuffer.shift();
      }
    });
  }
  isConnectionClosedError(error) {
    if (!(error instanceof Error)) {
      return false;
    }
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    return code === "ERR_STREAM_DESTROYED" || /connection closed|connection is disposed|stream was destroyed/i.test(error.message);
  }
  async sendRequest(method, ...args) {
    if (!this.connection)
      throw new Error("LSP client not started");
    if (this.processExited || this.proc && this.proc.exitCode !== null) {
      const stderrTail = this.stderrBuffer.slice(-10).join(`
`);
      throw new LspProcessExitedError(this.server.id, this.root, this.proc?.exitCode ?? null, stderrTail || undefined);
    }
    const timeoutMs = args[1]?.timeoutMs ?? this.requestTimeoutMs;
    let timeoutHandle = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        const stderrTail = this.stderrBuffer.slice(-5).join(`
`);
        reject(new LspRequestTimeoutError(method, stderrTail || undefined));
      }, timeoutMs);
    });
    try {
      const requestPromise = args.length === 0 ? this.connection.sendRequest(method) : this.connection.sendRequest(method, args[0]);
      const result = await Promise.race([requestPromise, timeoutPromise]);
      if (timeoutHandle !== null)
        clearTimeout(timeoutHandle);
      return result;
    } catch (error) {
      if (timeoutHandle !== null)
        clearTimeout(timeoutHandle);
      if (this.processExited || this.proc && this.proc.exitCode !== null) {
        throw new LspProcessExitedError(this.server.id, this.root, this.proc?.exitCode ?? null, this.stderrBuffer.slice(-10).join(`
`) || undefined);
      }
      if (this.isConnectionClosedError(error)) {
        throw new LspConnectionClosedError(this.server.id, this.root, error.message);
      }
      throw error;
    }
  }
  async sendNotification(method, ...args) {
    if (!this.connection)
      return;
    if (this.processExited || this.proc && this.proc.exitCode !== null)
      return;
    try {
      if (args.length === 0) {
        await this.connection.sendNotification(method);
      } else {
        await this.connection.sendNotification(method, args[0]);
      }
    } catch (error) {
      if (this.isConnectionClosedError(error)) {
        throw new LspConnectionClosedError(this.server.id, this.root, error.message);
      }
      throw error;
    }
  }
  isAlive() {
    return this.proc !== null && !this.processExited && this.proc.exitCode === null;
  }
  async stop() {
    if (this.connection) {
      try {
        await this.sendRequest("shutdown");
      } catch (error) {
        reportBestEffortCleanupError("shutdown request", error);
      }
      try {
        await this.sendNotification("exit");
      } catch (error) {
        reportBestEffortCleanupError("exit notification", error);
      }
      try {
        this.connection.dispose();
      } catch (error) {
        reportBestEffortCleanupError("connection dispose", error);
      }
      this.connection = null;
    }
    const proc = this.proc;
    if (proc) {
      this.proc = null;
      let exitedBeforeTimeout = false;
      try {
        proc.kill();
        let timeoutId;
        const timeoutPromise = new Promise((resolve) => {
          timeoutId = setTimeout(resolve, STOP_HARD_KILL_TIMEOUT_MS);
        });
        await Promise.race([
          proc.exited.then(() => {
            exitedBeforeTimeout = true;
          }).finally(() => {
            if (timeoutId)
              clearTimeout(timeoutId);
          }),
          timeoutPromise
        ]);
        if (!exitedBeforeTimeout) {
          try {
            proc.kill("SIGKILL");
            await Promise.race([
              proc.exited,
              new Promise((resolve) => setTimeout(resolve, STOP_SIGKILL_GRACE_MS))
            ]);
          } catch (error) {
            reportBestEffortCleanupError("hard process kill", error);
          }
        }
      } catch (error) {
        reportBestEffortCleanupError("process stop", error);
      }
    }
    this.processExited = true;
    this.diagnosticsStore.clear();
  }
  getStoredDiagnostics(uri) {
    return this.diagnosticsStore.get(uri) ?? [];
  }
}
function createLspSpawnEnv(_root, input) {
  return { ...input };
}
function isDiagnostic(value) {
  return isRecord(value) && isRange(value["range"]) && typeof value["message"] === "string";
}
function isRange(value) {
  return isRecord(value) && isPosition(value["start"]) && isPosition(value["end"]);
}
function isPosition(value) {
  return isRecord(value) && typeof value["line"] === "number" && typeof value["character"] === "number";
}

// ../lsp-core/src/lsp/connection.ts
var INITIALIZE_SETTLE_MS = 300;

class LspClientConnection extends LspClientTransport {
  async initialize() {
    const rootUri = pathToFileURL(this.root).href;
    await this.sendRequest("initialize", {
      processId: process.pid,
      rootUri,
      rootPath: this.root,
      workspaceFolders: [{ uri: rootUri, name: "workspace" }],
      capabilities: {
        textDocument: {
          hover: { contentFormat: ["markdown", "plaintext"] },
          definition: { linkSupport: true },
          references: {},
          documentSymbol: { hierarchicalDocumentSymbolSupport: true },
          publishDiagnostics: {},
          rename: {
            prepareSupport: true,
            prepareSupportDefaultBehavior: 1,
            honorsChangeAnnotations: true
          },
          codeAction: {
            codeActionLiteralSupport: {
              codeActionKind: {
                valueSet: [
                  "quickfix",
                  "refactor",
                  "refactor.extract",
                  "refactor.inline",
                  "refactor.rewrite",
                  "source",
                  "source.organizeImports",
                  "source.fixAll"
                ]
              }
            },
            isPreferredSupport: true,
            disabledSupport: true,
            dataSupport: true,
            resolveSupport: {
              properties: ["edit", "command"]
            }
          }
        },
        workspace: {
          symbol: {},
          workspaceFolders: true,
          configuration: true,
          applyEdit: true,
          workspaceEdit: {
            documentChanges: true
          }
        }
      },
      initializationOptions: this.server.initialization
    }, { timeoutMs: this.initializeTimeoutMs });
    await this.sendNotification("initialized");
    await this.sendNotification("workspace/didChangeConfiguration", {
      settings: { json: { validate: { enable: true } } }
    });
    await new Promise((r) => setTimeout(r, INITIALIZE_SETTLE_MS));
  }
}

// ../lsp-core/src/lsp/language-mappings.ts
var SYMBOL_KIND_MAP = {
  1: "File",
  2: "Module",
  3: "Namespace",
  4: "Package",
  5: "Class",
  6: "Method",
  7: "Property",
  8: "Field",
  9: "Constructor",
  10: "Enum",
  11: "Interface",
  12: "Function",
  13: "Variable",
  14: "Constant",
  15: "String",
  16: "Number",
  17: "Boolean",
  18: "Array",
  19: "Object",
  20: "Key",
  21: "Null",
  22: "EnumMember",
  23: "Struct",
  24: "Event",
  25: "Operator",
  26: "TypeParameter"
};
var SEVERITY_MAP = {
  1: "error",
  2: "warning",
  3: "information",
  4: "hint"
};
var EXT_TO_LANG = {
  ".abap": "abap",
  ".bat": "bat",
  ".bib": "bibtex",
  ".bibtex": "bibtex",
  ".clj": "clojure",
  ".cljs": "clojure",
  ".cljc": "clojure",
  ".edn": "clojure",
  ".coffee": "coffeescript",
  ".c": "c",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".cc": "cpp",
  ".c++": "cpp",
  ".cs": "csharp",
  ".css": "css",
  ".d": "d",
  ".pas": "pascal",
  ".pascal": "pascal",
  ".diff": "diff",
  ".patch": "diff",
  ".dart": "dart",
  ".dockerfile": "dockerfile",
  ".ex": "elixir",
  ".exs": "elixir",
  ".erl": "erlang",
  ".hrl": "erlang",
  ".fs": "fsharp",
  ".fsi": "fsharp",
  ".fsx": "fsharp",
  ".fsscript": "fsharp",
  ".gitcommit": "git-commit",
  ".gitrebase": "git-rebase",
  ".go": "go",
  ".groovy": "groovy",
  ".gleam": "gleam",
  ".hbs": "handlebars",
  ".handlebars": "handlebars",
  ".hs": "haskell",
  ".html": "html",
  ".htm": "html",
  ".ini": "ini",
  ".java": "java",
  ".jl": "julia",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".json": "json",
  ".jsonc": "jsonc",
  ".tex": "latex",
  ".latex": "latex",
  ".less": "less",
  ".lua": "lua",
  ".makefile": "makefile",
  makefile: "makefile",
  ".md": "markdown",
  ".markdown": "markdown",
  ".m": "objective-c",
  ".mm": "objective-cpp",
  ".pl": "perl",
  ".pm": "perl",
  ".pm6": "perl6",
  ".php": "php",
  ".ps1": "powershell",
  ".psm1": "powershell",
  ".pug": "jade",
  ".jade": "jade",
  ".py": "python",
  ".pyi": "python",
  ".r": "r",
  ".cshtml": "razor",
  ".razor": "razor",
  ".rb": "ruby",
  ".rake": "ruby",
  ".gemspec": "ruby",
  ".ru": "ruby",
  ".erb": "erb",
  ".html.erb": "erb",
  ".js.erb": "erb",
  ".css.erb": "erb",
  ".json.erb": "erb",
  ".rs": "rust",
  ".scss": "scss",
  ".sass": "sass",
  ".scala": "scala",
  ".shader": "shaderlab",
  ".sh": "shellscript",
  ".bash": "shellscript",
  ".zsh": "shellscript",
  ".ksh": "shellscript",
  ".sql": "sql",
  ".svelte": "svelte",
  ".swift": "swift",
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".mts": "typescript",
  ".cts": "typescript",
  ".mtsx": "typescriptreact",
  ".ctsx": "typescriptreact",
  ".xml": "xml",
  ".xsl": "xsl",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".vue": "vue",
  ".zig": "zig",
  ".zon": "zig",
  ".astro": "astro",
  ".ml": "ocaml",
  ".mli": "ocaml",
  ".tf": "terraform",
  ".tfvars": "terraform-vars",
  ".hcl": "hcl",
  ".nix": "nix",
  ".typ": "typst",
  ".typc": "typst",
  ".ets": "typescript",
  ".lhs": "haskell",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".prisma": "prisma",
  ".h": "c",
  ".hpp": "cpp",
  ".hh": "cpp",
  ".hxx": "cpp",
  ".h++": "cpp",
  ".objc": "objective-c",
  ".objcpp": "objective-cpp",
  ".fish": "fish",
  ".graphql": "graphql",
  ".gql": "graphql"
};
function getLanguageId(ext) {
  return EXT_TO_LANG[ext] ?? "plaintext";
}

// ../lsp-core/src/lsp/client.ts
var POST_OPEN_DELAY_MS = 1000;
var POST_DIAGNOSTICS_WAIT_MS = 500;

class LspClient extends LspClientConnection {
  openedFiles = new Set;
  documentVersions = new Map;
  lastSyncedText = new Map;
  diagnosticPullErrors = [];
  getDiagnosticPullErrors() {
    return this.diagnosticPullErrors;
  }
  async openFile(filePath) {
    const absPath = resolve(contextCwd(), filePath);
    const uri = pathToFileURL2(absPath).href;
    const text = readFileSync(absPath, "utf-8");
    if (!this.openedFiles.has(absPath)) {
      const ext = effectiveExtension(absPath);
      const languageId = getLanguageId(ext);
      const version = 1;
      await this.sendNotification("textDocument/didOpen", {
        textDocument: {
          uri,
          languageId,
          version,
          text
        }
      });
      this.openedFiles.add(absPath);
      this.documentVersions.set(uri, version);
      this.lastSyncedText.set(uri, text);
      await new Promise((r) => setTimeout(r, POST_OPEN_DELAY_MS));
      return;
    }
    const prevText = this.lastSyncedText.get(uri);
    if (prevText === text) {
      return;
    }
    const nextVersion = (this.documentVersions.get(uri) ?? 1) + 1;
    this.documentVersions.set(uri, nextVersion);
    this.lastSyncedText.set(uri, text);
    await this.sendNotification("textDocument/didChange", {
      textDocument: { uri, version: nextVersion },
      contentChanges: [{ text }]
    });
    await this.sendNotification("textDocument/didSave", {
      textDocument: { uri },
      text
    });
  }
  async definition(filePath, line, character) {
    const absPath = resolve(contextCwd(), filePath);
    await this.openFile(absPath);
    return this.sendRequest("textDocument/definition", {
      textDocument: { uri: pathToFileURL2(absPath).href },
      position: { line: line - 1, character }
    });
  }
  async references(filePath, line, character, includeDeclaration = true) {
    const absPath = resolve(contextCwd(), filePath);
    await this.openFile(absPath);
    return this.sendRequest("textDocument/references", {
      textDocument: { uri: pathToFileURL2(absPath).href },
      position: { line: line - 1, character },
      context: { includeDeclaration }
    });
  }
  async documentSymbols(filePath) {
    const absPath = resolve(contextCwd(), filePath);
    await this.openFile(absPath);
    return this.sendRequest("textDocument/documentSymbol", {
      textDocument: { uri: pathToFileURL2(absPath).href }
    });
  }
  async workspaceSymbols(query) {
    return this.sendRequest("workspace/symbol", { query });
  }
  isUnsupportedDiagnosticPullError(error) {
    if (!(error instanceof Error))
      return false;
    const code = "code" in error && typeof error.code === "number" ? error.code : undefined;
    if (code === -32601)
      return true;
    return /unsupported|not supported|method not found|unknown request/i.test(error.message);
  }
  async diagnostics(filePath) {
    const absPath = resolve(contextCwd(), filePath);
    const uri = pathToFileURL2(absPath).href;
    await this.openFile(absPath);
    await new Promise((r) => setTimeout(r, POST_DIAGNOSTICS_WAIT_MS));
    try {
      const result = await this.sendRequest("textDocument/diagnostic", {
        textDocument: { uri }
      });
      if (result.items) {
        return { items: result.items };
      }
    } catch (error) {
      if (!this.isUnsupportedDiagnosticPullError(error)) {
        this.diagnosticPullErrors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
    return { items: this.getStoredDiagnostics(uri) };
  }
  async prepareRename(filePath, line, character) {
    const absPath = resolve(contextCwd(), filePath);
    await this.openFile(absPath);
    return this.sendRequest("textDocument/prepareRename", {
      textDocument: { uri: pathToFileURL2(absPath).href },
      position: { line: line - 1, character }
    });
  }
  async rename(filePath, line, character, newName) {
    const absPath = resolve(contextCwd(), filePath);
    await this.openFile(absPath);
    return this.sendRequest("textDocument/rename", {
      textDocument: { uri: pathToFileURL2(absPath).href },
      position: { line: line - 1, character },
      newName
    });
  }
}

// ../lsp-core/src/lsp/process-signal-cleanup.ts
function installProcessSignalCleanup(cleanup) {
  const signals = process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGBREAK"] : ["SIGINT", "SIGTERM"];
  const handler = () => {
    cleanup().catch((error) => {
      reportBestEffortCleanupError("signal cleanup", error);
    });
  };
  for (const signal of signals) {
    process.on(signal, handler);
  }
  return () => {
    for (const signal of signals) {
      process.removeListener(signal, handler);
    }
  };
}

// ../lsp-core/src/lsp/manager.ts
async function stopClientBestEffort(client) {
  try {
    await client.stop();
  } catch (error) {
    reportBestEffortCleanupError("client stop", error);
  }
}
function awaitWithSignal(promise, signal) {
  if (!signal)
    return promise;
  return new Promise((resolve2, reject) => {
    let settled = false;
    const onAbort = () => {
      if (settled)
        return;
      settled = true;
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then((value) => {
      if (settled)
        return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      resolve2(value);
    }, (err) => {
      if (settled)
        return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}

class LspManager {
  clients = new Map;
  reaperHandle = null;
  signalDisposer = null;
  disposed = false;
  idleTimeoutMs;
  initTimeoutMs;
  reaperIntervalMs;
  clientFactory;
  now;
  constructor(options = {}) {
    this.idleTimeoutMs = options.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
    this.initTimeoutMs = options.initTimeoutMs ?? INIT_TIMEOUT_MS;
    this.reaperIntervalMs = options.reaperIntervalMs ?? REAPER_INTERVAL_MS;
    this.clientFactory = options.clientFactory ?? ((root, server2) => new LspClient(root, server2));
    this.now = options.now ?? (() => Date.now());
    this.startReaper();
    this.signalDisposer = installProcessSignalCleanup(() => this.stopAll());
  }
  startReaper() {
    if (this.reaperHandle)
      return;
    this.reaperHandle = setInterval(() => {
      this.reapStale();
    }, this.reaperIntervalMs);
    if (typeof this.reaperHandle.unref === "function") {
      this.reaperHandle.unref();
    }
  }
  getKey(root, serverId) {
    return `${root}::${serverId}`;
  }
  reapStale() {
    const t = this.now();
    for (const [key, managed] of this.clients) {
      if (managed.isInitializing && managed.initializingSince !== null && t - managed.initializingSince > this.initTimeoutMs) {
        stopClientBestEffort(managed.client);
        this.clients.delete(key);
        continue;
      }
      if (!managed.isInitializing && managed.refCount === 0 && managed.pendingWaiters === 0 && t - managed.lastUsedAt > this.idleTimeoutMs) {
        stopClientBestEffort(managed.client);
        this.clients.delete(key);
      }
    }
  }
  async tryDeleteIfOrphaned(key, managed) {
    if (managed.refCount === 0 && managed.pendingWaiters === 0 && !managed.isInitializing && this.clients.get(key) === managed) {
      this.clients.delete(key);
      await stopClientBestEffort(managed.client);
    }
  }
  async getClient(root, server2, signal) {
    if (this.disposed) {
      throw new Error("LspManager has been disposed");
    }
    signal?.throwIfAborted();
    const key = this.getKey(root, server2.id);
    let managed = this.clients.get(key);
    if (managed) {
      const t = this.now();
      if (managed.isInitializing && managed.initializingSince !== null && t - managed.initializingSince > this.initTimeoutMs) {
        await stopClientBestEffort(managed.client);
        this.clients.delete(key);
        managed = undefined;
      }
    }
    if (managed) {
      if (managed.initPromise) {
        managed.pendingWaiters++;
        try {
          await awaitWithSignal(managed.initPromise, signal);
        } catch (err) {
          managed.pendingWaiters--;
          await this.tryDeleteIfOrphaned(key, managed);
          throw err;
        }
        managed.pendingWaiters--;
      }
      if (signal?.aborted) {
        await this.tryDeleteIfOrphaned(key, managed);
        signal.throwIfAborted();
      }
      if (!managed.client.isAlive()) {
        await stopClientBestEffort(managed.client);
        this.clients.delete(key);
        return this.getClient(root, server2, signal);
      }
      managed.refCount++;
      managed.lastUsedAt = this.now();
      return managed.client;
    }
    const client = this.clientFactory(root, server2);
    const initStartedAt = this.now();
    const initPromise = (async () => {
      await client.start();
      await client.initialize();
    })();
    const newManaged = {
      client,
      refCount: 0,
      pendingWaiters: 1,
      lastUsedAt: initStartedAt,
      initPromise,
      isInitializing: true,
      initializingSince: initStartedAt
    };
    this.clients.set(key, newManaged);
    try {
      await awaitWithSignal(initPromise, signal);
    } catch (err) {
      newManaged.pendingWaiters--;
      if (this.clients.get(key) === newManaged) {
        this.clients.delete(key);
      }
      await stopClientBestEffort(client);
      throw err;
    }
    newManaged.pendingWaiters--;
    newManaged.isInitializing = false;
    newManaged.initializingSince = null;
    newManaged.initPromise = null;
    if (signal?.aborted) {
      await this.tryDeleteIfOrphaned(key, newManaged);
      signal.throwIfAborted();
    }
    newManaged.refCount++;
    newManaged.lastUsedAt = this.now();
    return client;
  }
  releaseClient(root, serverId) {
    const key = this.getKey(root, serverId);
    const managed = this.clients.get(key);
    if (managed && managed.refCount > 0) {
      managed.refCount--;
      managed.lastUsedAt = this.now();
    }
  }
  invalidateClient(root, serverId, client) {
    const key = this.getKey(root, serverId);
    const managed = this.clients.get(key);
    if (!managed)
      return;
    if (client && managed.client !== client)
      return;
    this.clients.delete(key);
    stopClientBestEffort(managed.client);
  }
  warmupClient(root, server2) {
    if (this.disposed)
      return;
    const key = this.getKey(root, server2.id);
    if (this.clients.has(key))
      return;
    const client = this.clientFactory(root, server2);
    const initStartedAt = this.now();
    const initPromise = (async () => {
      await client.start();
      await client.initialize();
    })();
    const managed = {
      client,
      refCount: 0,
      pendingWaiters: 0,
      lastUsedAt: initStartedAt,
      initPromise,
      isInitializing: true,
      initializingSince: initStartedAt
    };
    this.clients.set(key, managed);
    initPromise.then(() => {
      managed.isInitializing = false;
      managed.initializingSince = null;
      managed.initPromise = null;
      managed.lastUsedAt = this.now();
    }, () => {
      if (this.clients.get(key) === managed) {
        this.clients.delete(key);
      }
      stopClientBestEffort(client);
    });
  }
  isServerInitializing(root, serverId) {
    const managed = this.clients.get(this.getKey(root, serverId));
    return managed?.isInitializing ?? false;
  }
  getSnapshot() {
    const snapshots = [];
    for (const [key, managed] of this.clients) {
      const [root, serverId] = key.split("::");
      snapshots.push({
        root,
        serverId,
        refCount: managed.refCount,
        pendingWaiters: managed.pendingWaiters,
        lastUsedAt: managed.lastUsedAt,
        isInitializing: managed.isInitializing,
        alive: managed.client.isAlive(),
        command: managed.client.command()
      });
    }
    return snapshots;
  }
  hasClient(root, serverId) {
    return this.clients.has(this.getKey(root, serverId));
  }
  clientCount() {
    return this.clients.size;
  }
  async stopAll() {
    this.disposed = true;
    if (this.reaperHandle) {
      clearInterval(this.reaperHandle);
      this.reaperHandle = null;
    }
    if (this.signalDisposer) {
      this.signalDisposer();
      this.signalDisposer = null;
    }
    const stopPromises = [];
    for (const managed of this.clients.values()) {
      stopPromises.push(stopClientBestEffort(managed.client));
    }
    this.clients.clear();
    await Promise.allSettled(stopPromises);
  }
}
var _defaultInstance = null;
function getLspManager() {
  if (!_defaultInstance) {
    _defaultInstance = new LspManager;
  }
  return _defaultInstance;
}
async function disposeDefaultLspManager() {
  if (_defaultInstance) {
    const m = _defaultInstance;
    _defaultInstance = null;
    await m.stopAll();
  }
}

// ../lsp-core/src/lsp/server-install-state.ts
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join as join2 } from "node:path";
function getInstallDecisionsPath() {
  const override = contextEnv("LSP_TOOLS_MCP_INSTALL_DECISIONS");
  if (!override)
    return join2(homedir(), ".codex", "lsp-install-decisions.json");
  return isAbsolute(override) ? override : join2(homedir(), override);
}
function loadInstallDecisions() {
  const path = getInstallDecisionsPath();
  if (!existsSync2(path))
    return {};
  try {
    const parsed = JSON.parse(readFileSync2(path, "utf8"));
    return isInstallDecisions(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function loadInstallDecision(serverId) {
  return loadInstallDecisions()[serverId];
}
function recordInstallDecision(serverId, decision, decidedAt = new Date().toISOString()) {
  const decisions = loadInstallDecisions();
  decisions[serverId] = { decision, decidedAt };
  writeInstallDecisions(decisions);
}
function isInstallDecision(value) {
  return value === "declined" || value === "allowed";
}
function writeInstallDecisions(decisions) {
  const path = getInstallDecisionsPath();
  mkdirSync(dirname(path), { recursive: true });
  const tmpPath = `${path}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(decisions, null, 2)}
`, "utf8");
  renameSync(tmpPath, path);
}
function isInstallDecisions(value) {
  return isRecord2(value) && Object.values(value).every(isInstallDecisionRecord);
}
function isInstallDecisionRecord(value) {
  if (!isRecord2(value))
    return false;
  return isInstallDecision(value["decision"]) && typeof value["decidedAt"] === "string";
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ../lsp-core/src/lsp/config-loader.ts
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { delimiter as delimiter2, isAbsolute as isAbsolute2, join as join3 } from "node:path";

// ../lsp-core/src/lsp/server-definitions.ts
var LSP_INSTALL_HINTS = {
  typescript: "npm install -g typescript-language-server typescript",
  deno: "Install Deno from https://deno.land",
  vue: "npm install -g @vue/language-server",
  eslint: "npm install -g vscode-langservers-extracted",
  oxlint: "npm install -g oxlint",
  biome: "npm install -g @biomejs/biome",
  gopls: "go install golang.org/x/tools/gopls@latest",
  "ruby-lsp": "gem install ruby-lsp",
  basedpyright: "pip install basedpyright",
  pyright: "pip install pyright",
  ty: "pip install ty",
  ruff: "pip install ruff",
  "elixir-ls": "See https://github.com/elixir-lsp/elixir-ls",
  zls: "See https://github.com/zigtools/zls",
  csharp: "dotnet tool install -g csharp-ls",
  fsharp: "dotnet tool install -g fsautocomplete",
  "sourcekit-lsp": "Included with Xcode or Swift toolchain",
  rust: "Install rust-analyzer and ensure it is in PATH. If using rustup: rustup component add rust-analyzer. " + "If rust-analyzer exits while loading rust-src: rustup component remove rust-src && rustup component add rust-src.",
  clangd: "See https://clangd.llvm.org/installation",
  svelte: "npm install -g svelte-language-server",
  astro: "npm install -g @astrojs/language-server",
  "bash-ls": "npm install -g bash-language-server",
  jdtls: "See https://github.com/eclipse-jdtls/eclipse.jdt.ls",
  "yaml-ls": "npm install -g yaml-language-server",
  "lua-ls": "See https://github.com/LuaLS/lua-language-server",
  php: "npm install -g intelephense",
  dart: "Included with Dart SDK",
  "terraform-ls": "See https://github.com/hashicorp/terraform-ls",
  terraform: "See https://github.com/hashicorp/terraform-ls",
  prisma: "npm install -g prisma",
  "ocaml-lsp": "opam install ocaml-lsp-server",
  texlab: "See https://github.com/latex-lsp/texlab",
  dockerfile: "npm install -g dockerfile-language-server-nodejs",
  gleam: "See https://gleam.run/getting-started/installing/",
  "clojure-lsp": "See https://clojure-lsp.io/installation/",
  nixd: "nix profile install nixpkgs#nixd",
  tinymist: "See https://github.com/Myriad-Dreamin/tinymist",
  "haskell-language-server": "ghcup install hls",
  bash: "npm install -g bash-language-server",
  "kotlin-ls": "See https://github.com/Kotlin/kotlin-lsp",
  julials: `julia -e 'using Pkg; Pkg.add("LanguageServer")'`,
  razor: "Razor runs through the Roslyn language server (cohosting). " + "Install: dotnet tool install -g roslyn-language-server --prerelease (requires v5.8.0+). See https://github.com/dotnet/razor"
};
var BUILTIN_SERVERS = {
  typescript: {
    command: ["typescript-language-server", "--stdio"],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]
  },
  deno: { command: ["deno", "lsp"], extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs"] },
  vue: { command: ["vue-language-server", "--stdio"], extensions: [".vue"] },
  eslint: {
    command: ["vscode-eslint-language-server", "--stdio"],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".vue"]
  },
  oxlint: {
    command: ["oxlint", "--lsp"],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".vue", ".astro", ".svelte"]
  },
  biome: {
    command: ["biome", "lsp-proxy", "--stdio"],
    extensions: [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mjs",
      ".cjs",
      ".mts",
      ".cts",
      ".json",
      ".jsonc",
      ".vue",
      ".astro",
      ".svelte",
      ".css",
      ".graphql",
      ".gql",
      ".html"
    ]
  },
  gopls: { command: ["gopls"], extensions: [".go"] },
  "ruby-lsp": {
    command: ["rubocop", "--lsp"],
    extensions: [".rb", ".rake", ".gemspec", ".ru"]
  },
  basedpyright: {
    command: ["basedpyright-langserver", "--stdio"],
    extensions: [".py", ".pyi"]
  },
  pyright: { command: ["pyright-langserver", "--stdio"], extensions: [".py", ".pyi"] },
  ty: { command: ["ty", "server"], extensions: [".py", ".pyi"] },
  ruff: { command: ["ruff", "server"], extensions: [".py", ".pyi"] },
  "elixir-ls": { command: ["elixir-ls"], extensions: [".ex", ".exs"] },
  zls: { command: ["zls"], extensions: [".zig", ".zon"] },
  csharp: { command: ["csharp-ls"], extensions: [".cs"] },
  fsharp: { command: ["fsautocomplete"], extensions: [".fs", ".fsi", ".fsx", ".fsscript"] },
  "sourcekit-lsp": { command: ["sourcekit-lsp"], extensions: [".swift", ".m", ".mm"] },
  rust: { command: ["rust-analyzer"], extensions: [".rs"] },
  clangd: {
    command: ["clangd", "--background-index", "--clang-tidy"],
    extensions: [".c", ".cpp", ".cc", ".cxx", ".c++", ".h", ".hpp", ".hh", ".hxx", ".h++"]
  },
  svelte: { command: ["svelteserver", "--stdio"], extensions: [".svelte"] },
  astro: { command: ["astro-ls", "--stdio"], extensions: [".astro"] },
  bash: {
    command: ["bash-language-server", "start"],
    extensions: [".sh", ".bash", ".zsh", ".ksh"]
  },
  "bash-ls": {
    command: ["bash-language-server", "start"],
    extensions: [".sh", ".bash", ".zsh", ".ksh"]
  },
  jdtls: { command: ["jdtls"], extensions: [".java"] },
  "yaml-ls": { command: ["yaml-language-server", "--stdio"], extensions: [".yaml", ".yml"] },
  "lua-ls": { command: ["lua-language-server"], extensions: [".lua"] },
  php: { command: ["intelephense", "--stdio"], extensions: [".php"] },
  dart: { command: ["dart", "language-server", "--lsp"], extensions: [".dart"] },
  terraform: { command: ["terraform-ls", "serve"], extensions: [".tf", ".tfvars"] },
  "terraform-ls": { command: ["terraform-ls", "serve"], extensions: [".tf", ".tfvars"] },
  prisma: { command: ["prisma", "language-server"], extensions: [".prisma"] },
  "ocaml-lsp": { command: ["ocamllsp"], extensions: [".ml", ".mli"] },
  texlab: { command: ["texlab"], extensions: [".tex", ".bib"] },
  dockerfile: { command: ["docker-langserver", "--stdio"], extensions: [".dockerfile"] },
  gleam: { command: ["gleam", "lsp"], extensions: [".gleam"] },
  "clojure-lsp": {
    command: ["clojure-lsp", "listen"],
    extensions: [".clj", ".cljs", ".cljc", ".edn"]
  },
  nixd: { command: ["nixd"], extensions: [".nix"] },
  tinymist: { command: ["tinymist"], extensions: [".typ", ".typc"] },
  "haskell-language-server": {
    command: ["haskell-language-server-wrapper", "--lsp"],
    extensions: [".hs", ".lhs"]
  },
  "kotlin-ls": { command: ["kotlin-lsp", "--stdio"], extensions: [".kt", ".kts"] },
  julials: {
    command: ["julia", "--startup-file=no", "--history-file=no", "-e", "using LanguageServer; runserver()"],
    extensions: [".jl"]
  },
  razor: {
    command: ["roslyn-language-server", "--stdio"],
    extensions: [".razor", ".cshtml"]
  }
};

// ../lsp-core/src/lsp/config-loader.ts
function resolveProjectConfigPath(path) {
  return isAbsolute2(path) ? path : join3(contextCwd(), path);
}
function getProjectConfigPaths() {
  const projectOverride = contextEnv("LSP_TOOLS_MCP_PROJECT_CONFIG");
  if (projectOverride) {
    return projectOverride.split(delimiter2).filter(Boolean).map(resolveProjectConfigPath);
  }
  return [join3(contextCwd(), ".codex", "lsp-client.json")];
}
function getUserConfigPath() {
  const userOverride = contextEnv("LSP_TOOLS_MCP_USER_CONFIG");
  if (!userOverride)
    return join3(homedir2(), ".codex", "lsp-client.json");
  return isAbsolute2(userOverride) ? userOverride : join3(homedir2(), userOverride);
}
function loadJsonFile(path) {
  if (!existsSync3(path))
    return null;
  try {
    const parsed = JSON.parse(readFileSync3(path, "utf-8"));
    return isConfigJson(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function loadAllConfigs() {
  const configs = new Map;
  const project = loadFirstJsonFile(getProjectConfigPaths());
  if (project)
    configs.set("project", project);
  const user = loadJsonFile(getUserConfigPath());
  if (user)
    configs.set("user", user);
  return configs;
}
function loadFirstJsonFile(paths) {
  for (const path of paths) {
    const config = loadJsonFile(path);
    if (config)
      return config;
  }
  return null;
}
function getMergedServers() {
  const configs = loadAllConfigs();
  const servers = [];
  const disabled = new Set;
  const seen = new Set;
  const sources = ["project", "user"];
  for (const source of sources) {
    const config = configs.get(source);
    if (!config?.lsp)
      continue;
    for (const [id, rawEntry] of Object.entries(config.lsp)) {
      const entry = parseLspEntry(rawEntry);
      if (!entry)
        continue;
      if (entry.disabled) {
        disabled.add(id);
        continue;
      }
      if (seen.has(id))
        continue;
      const server2 = createServerFromEntry(id, entry, source);
      if (!server2)
        continue;
      servers.push(server2);
      seen.add(id);
    }
  }
  for (const [id, config] of Object.entries(BUILTIN_SERVERS)) {
    if (disabled.has(id) || seen.has(id))
      continue;
    servers.push({
      id,
      command: config.command,
      extensions: config.extensions,
      priority: -100,
      source: "builtin"
    });
  }
  return servers.sort((a, b) => {
    if (a.source !== b.source) {
      const order = {
        project: 0,
        user: 1,
        builtin: 2
      };
      return order[a.source] - order[b.source];
    }
    return b.priority - a.priority;
  });
}
function createServerFromEntry(id, entry, source) {
  const builtin = BUILTIN_SERVERS[id];
  if (source === "project") {
    if (!builtin)
      return null;
    const server3 = createServer({
      id,
      command: builtin.command,
      extensions: entry.extensions ?? builtin.extensions,
      priority: entry.priority ?? 0,
      source
    });
    if (entry.initialization !== undefined) {
      server3.initialization = entry.initialization;
    }
    return server3;
  }
  if (entry.command && entry.extensions) {
    const server3 = createServer({
      id,
      command: entry.command,
      extensions: entry.extensions,
      priority: entry.priority ?? 0,
      source
    });
    applyOptionalServerFields(server3, entry);
    return server3;
  }
  if (!builtin)
    return null;
  const server2 = createServer({
    id,
    command: entry.command ?? builtin.command,
    extensions: entry.extensions ?? builtin.extensions,
    priority: entry.priority ?? 0,
    source
  });
  applyOptionalServerFields(server2, entry);
  return server2;
}
function createServer(input) {
  const server2 = {
    id: input.id,
    command: input.command,
    extensions: input.extensions,
    priority: input.priority,
    source: input.source
  };
  if (input.env !== undefined) {
    server2.env = input.env;
  }
  if (input.initialization !== undefined) {
    server2.initialization = input.initialization;
  }
  return server2;
}
function applyOptionalServerFields(server2, entry) {
  if (entry.env !== undefined) {
    server2.env = entry.env;
  }
  if (entry.initialization !== undefined) {
    server2.initialization = entry.initialization;
  }
}
function isConfigJson(value) {
  if (!isRecord3(value))
    return false;
  const lsp = value["lsp"];
  return lsp === undefined || isRecord3(lsp);
}
function parseLspEntry(value) {
  return isLspEntry(value) ? value : null;
}
function isLspEntry(value) {
  if (!isRecord3(value))
    return false;
  const disabled = value["disabled"];
  const command = value["command"];
  const extensions = value["extensions"];
  const priority = value["priority"];
  const env = value["env"];
  const initialization = value["initialization"];
  return (disabled === undefined || typeof disabled === "boolean") && (command === undefined || isStringArray(command)) && (extensions === undefined || isStringArray(extensions)) && (priority === undefined || typeof priority === "number") && (env === undefined || isStringRecord(env)) && (initialization === undefined || isRecord3(initialization));
}
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isStringRecord(value) {
  return isRecord3(value) && Object.values(value).every((item) => typeof item === "string");
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getDisabledServerIds() {
  const configs = loadAllConfigs();
  const disabled = new Set;
  for (const config of configs.values()) {
    if (!config.lsp)
      continue;
    for (const [id, rawEntry] of Object.entries(config.lsp)) {
      const entry = parseLspEntry(rawEntry);
      if (!entry)
        continue;
      if (entry.disabled)
        disabled.add(id);
    }
  }
  return disabled;
}

// ../lsp-core/src/lsp/server-installation.ts
import { existsSync as existsSync4 } from "node:fs";
import { delimiter as delimiter3, join as join4 } from "node:path";
function isServerInstalled(command, _workingDirectory) {
  if (command.length === 0)
    return false;
  const [cmd] = command;
  if (!cmd)
    return false;
  if (cmd.includes("/") || cmd.includes("\\")) {
    if (existsSync4(cmd))
      return true;
  }
  const isWindows = process.platform === "win32";
  let exts = [""];
  if (isWindows) {
    const pathExt = process.env["PATHEXT"] ?? "";
    if (pathExt) {
      const systemExts = pathExt.split(";").filter(Boolean);
      exts = [...new Set([...exts, ...systemExts, ".exe", ".cmd", ".bat", ".ps1"])];
    } else {
      exts = ["", ".exe", ".cmd", ".bat", ".ps1"];
    }
  }
  let pathEnv = process.env["PATH"] ?? "";
  if (isWindows && !pathEnv) {
    pathEnv = process.env["Path"] ?? "";
  }
  const paths = pathEnv.split(delimiter3);
  for (const p of paths) {
    for (const suffix of exts) {
      if (existsSync4(join4(p, cmd + suffix))) {
        return true;
      }
    }
  }
  if (cmd === "node")
    return true;
  return false;
}

// ../lsp-core/src/lsp/server-resolution.ts
function findServerForExtension(ext) {
  const servers = getMergedServers();
  for (const server2 of servers) {
    if (server2.extensions.includes(ext) && isServerInstalled(server2.command)) {
      const resolvedServer = {
        id: server2.id,
        command: server2.command,
        extensions: server2.extensions,
        priority: server2.priority
      };
      if (server2.env !== undefined) {
        return {
          status: "found",
          server: {
            ...resolvedServer,
            env: server2.env,
            ...server2.initialization === undefined ? {} : { initialization: server2.initialization }
          }
        };
      }
      return {
        status: "found",
        server: {
          ...resolvedServer,
          ...server2.initialization === undefined ? {} : { initialization: server2.initialization }
        }
      };
    }
  }
  for (const server2 of servers) {
    if (server2.extensions.includes(ext)) {
      const installHint = LSP_INSTALL_HINTS[server2.id] ?? `Install '${server2.command[0]}' and ensure it's in your PATH`;
      return {
        status: "not_installed",
        server: {
          id: server2.id,
          command: server2.command,
          extensions: server2.extensions
        },
        installHint
      };
    }
  }
  const availableServers = [...new Set(servers.map((s) => s.id))];
  return {
    status: "not_configured",
    extension: ext,
    availableServers
  };
}
function getAllServers() {
  const servers = getMergedServers();
  const disabled = getDisabledServerIds();
  const result = [];
  const seen = new Set;
  for (const server2 of servers) {
    if (seen.has(server2.id))
      continue;
    result.push({
      id: server2.id,
      installed: isServerInstalled(server2.command),
      extensions: server2.extensions,
      disabled: false,
      source: server2.source,
      priority: server2.priority
    });
    seen.add(server2.id);
  }
  for (const id of disabled) {
    if (seen.has(id))
      continue;
    const builtin = BUILTIN_SERVERS[id];
    result.push({
      id,
      installed: builtin ? isServerInstalled(builtin.command) : false,
      extensions: builtin?.extensions ?? [],
      disabled: true,
      source: "disabled",
      priority: 0
    });
  }
  return result;
}

// ../lsp-core/src/lsp/client-wrapper.ts
var WORKSPACE_MARKERS = [".git", "package.json", "pyproject.toml", "Cargo.toml", "go.mod", "pom.xml", "build.gradle"];
function isDirectoryPath(filePath) {
  try {
    return statSync2(filePath).isDirectory();
  } catch {
    return false;
  }
}
function findWorkspaceRoot(filePath) {
  const abs = resolve2(contextCwd(), filePath);
  let dir = abs;
  if (!isDirectoryPath(dir)) {
    dir = dirname2(dir);
  }
  let prevDir = "";
  while (dir !== prevDir) {
    for (const marker of WORKSPACE_MARKERS) {
      if (existsSync5(join5(dir, marker))) {
        return dir;
      }
    }
    prevDir = dir;
    dir = dirname2(dir);
  }
  return dirname2(abs);
}
function formatServerLookupError(result) {
  if (result.status === "not_installed") {
    return formatNotInstalled(result);
  }
  return [
    `No LSP server configured for extension: ${result.extension}`,
    "",
    `Available servers: ${result.availableServers.slice(0, 10).join(", ")}${result.availableServers.length > 10 ? "..." : ""}`,
    "",
    "Configure a custom server in '.codex/lsp-client.json':",
    "  {",
    '    "lsp": {',
    '      "my-server": {',
    '        "command": ["my-lsp", "--stdio"],',
    `        "extensions": ["${result.extension}"]`,
    "      }",
    "    }",
    "  }"
  ].join(`
`);
}
function formatNotInstalled(result) {
  const { server: server2, installHint } = result;
  const extensions = server2.extensions.join(", ");
  const decision = loadInstallDecision(server2.id)?.decision;
  if (decision === "declined") {
    return `LSP server '${server2.id}' (${extensions}) is NOT INSTALLED; user previously declined installation — proceed without LSP.`;
  }
  const header = [
    `LSP server '${server2.id}' for ${extensions} is NOT INSTALLED.`,
    "",
    `Command not found: ${server2.command[0]}`,
    ""
  ];
  if (decision === "allowed") {
    return [
      ...header,
      "The user has pre-authorized LSP installation. Run the install command, then retry this tool:",
      `  ${installHint}`
    ].join(`
`);
  }
  return [
    ...header,
    "To install, run:",
    `  ${installHint}`,
    "",
    "ACTION REQUIRED — ASK THE USER whether to install this LSP server.",
    "- If the user agrees: run the install command above, then retry this tool.",
    "- If the user declines, OR has NOT explicitly asked for LSP installation:",
    `    call lsp_install_decision { server_id: "${server2.id}", decision: "declined" },`,
    "    then ignore this message and proceed WITHOUT LSP."
  ].join(`
`);
}
var READ_ONLY_RETRY_TOOLS = new Set([
  "diagnostics",
  "definition",
  "references",
  "documentSymbols",
  "workspaceSymbols",
  "prepareRename"
]);
async function withLspClient(filePath, fn, toolName, options = {}) {
  const absPath = resolve2(contextCwd(), filePath);
  if (isDirectoryPath(absPath)) {
    throw new LspInvalidPathError("Directory paths are not supported by this LSP tool. " + "Use lsp.diagnostics with a directory path for directory diagnostics.");
  }
  const ext = effectiveExtension(absPath);
  const result = findServerForExtension(ext);
  if (result.status !== "found") {
    throw new LspServerLookupError(formatServerLookupError(result));
  }
  const server2 = result.server;
  const root = findWorkspaceRoot(absPath);
  const manager = options.manager ?? getLspManager();
  const acquireAndCall = async (allowRetry) => {
    const client = await manager.getClient(root, server2, options.signal);
    try {
      return await fn(client, root);
    } catch (err) {
      if (allowRetry && READ_ONLY_RETRY_TOOLS.has(toolName) && isLspDeadConnectionError(err)) {
        manager.invalidateClient(root, server2.id, client);
        return acquireAndCall(false);
      }
      if (err instanceof LspRequestTimeoutError) {
        if (manager.isServerInitializing(root, server2.id)) {
          throw new LspServerInitializingError(err);
        }
      }
      throw err;
    } finally {
      manager.releaseClient(root, server2.id);
    }
  };
  return acquireAndCall(true);
}

// ../lsp-core/src/lsp/directory-diagnostics.ts
import { existsSync as existsSync6, lstatSync, readdirSync } from "node:fs";
import { join as join6, resolve as resolve3 } from "node:path";

// ../lsp-core/src/lsp/formatters.ts
import { fileURLToPath } from "node:url";
var DIAGNOSTIC_SEVERITY_FILTERS = {
  error: 1,
  warning: 2,
  information: 3,
  hint: 4
};
function uriToPath(uri) {
  return fileURLToPath(uri);
}
function formatLocation(loc) {
  if ("targetUri" in loc) {
    const uri2 = uriToPath(loc.targetUri);
    const line2 = loc.targetRange.start.line + 1;
    const char2 = loc.targetRange.start.character;
    return `${uri2}:${line2}:${char2}`;
  }
  const uri = uriToPath(loc.uri);
  const line = loc.range.start.line + 1;
  const char = loc.range.start.character;
  return `${uri}:${line}:${char}`;
}
function formatSymbolKind(kind) {
  return SYMBOL_KIND_MAP[kind] ?? `Unknown(${kind})`;
}
function formatSeverity(severity) {
  if (!severity)
    return "unknown";
  return SEVERITY_MAP[severity] ?? `unknown(${severity})`;
}
function formatDocumentSymbol(symbol, indent = 0) {
  const prefix = "  ".repeat(indent);
  const kind = formatSymbolKind(symbol.kind);
  const line = symbol.range.start.line + 1;
  let result = `${prefix}${symbol.name} (${kind}) - line ${line}`;
  if (symbol.children && symbol.children.length > 0) {
    for (const child of symbol.children) {
      result += `
${formatDocumentSymbol(child, indent + 1)}`;
    }
  }
  return result;
}
function formatSymbolInfo(symbol) {
  const kind = formatSymbolKind(symbol.kind);
  const loc = formatLocation(symbol.location);
  const container = symbol.containerName ? ` (in ${symbol.containerName})` : "";
  return `${symbol.name} (${kind})${container} - ${loc}`;
}
function formatDiagnostic(diag) {
  const severity = formatSeverity(diag.severity);
  const line = diag.range.start.line + 1;
  const char = diag.range.start.character;
  const source = diag.source ? `[${diag.source}]` : "";
  const code = diag.code ? ` (${diag.code})` : "";
  return `${severity}${source}${code} at ${line}:${char}: ${diag.message}`;
}
function filterDiagnosticsBySeverity(diagnostics, severityFilter) {
  if (!severityFilter || severityFilter === "all") {
    return diagnostics;
  }
  const targetSeverity = DIAGNOSTIC_SEVERITY_FILTERS[severityFilter];
  return diagnostics.filter((d) => d.severity === targetSeverity);
}
function formatPrepareRenameResult(result) {
  if (!result)
    return "Cannot rename at this position";
  if ("defaultBehavior" in result) {
    return result.defaultBehavior ? "Rename supported (using default behavior)" : "Cannot rename at this position";
  }
  if ("range" in result && result.range) {
    const startLine = result.range.start.line + 1;
    const startChar = result.range.start.character;
    const endLine = result.range.end.line + 1;
    const endChar = result.range.end.character;
    const placeholder = result.placeholder ? ` (current: "${result.placeholder}")` : "";
    return `Rename available at ${startLine}:${startChar}-${endLine}:${endChar}${placeholder}`;
  }
  if ("start" in result && "end" in result) {
    const startLine = result.start.line + 1;
    const startChar = result.start.character;
    const endLine = result.end.line + 1;
    const endChar = result.end.character;
    return `Rename available at ${startLine}:${startChar}-${endLine}:${endChar}`;
  }
  return "Cannot rename at this position";
}
function formatApplyResult(result) {
  const lines = [];
  if (result.success) {
    lines.push(`Applied ${result.totalEdits} edit(s) to ${result.filesModified.length} file(s):`);
    for (const file of result.filesModified) {
      lines.push(`  - ${file}`);
    }
  } else {
    lines.push("Failed to apply some changes:");
    for (const err of result.errors) {
      lines.push(`  Error: ${err}`);
    }
    if (result.filesModified.length > 0) {
      lines.push(`Successfully modified: ${result.filesModified.join(", ")}`);
    }
  }
  return lines.join(`
`);
}

// ../lsp-core/src/lsp/directory-diagnostics.ts
var SKIP_DIRECTORIES = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);
function collectFilesWithExtension(dir, extension, maxFiles) {
  const files = [];
  function walk(currentDir) {
    if (files.length >= maxFiles)
      return;
    let entries = [];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles)
        return;
      const fullPath = join6(currentDir, entry);
      let stat;
      try {
        stat = lstatSync(fullPath);
      } catch {
        continue;
      }
      if (!stat || stat.isSymbolicLink())
        continue;
      if (stat.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry)) {
          walk(fullPath);
        }
      } else if (stat.isFile() && effectiveExtension(fullPath) === extension) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}
async function aggregateDiagnosticsForDirectory(directory, extension, severity, maxFiles = DEFAULT_MAX_DIRECTORY_FILES) {
  if (!extension.startsWith(".")) {
    throw new LspInvalidPathError(`Extension must start with a dot (e.g., ".ts", not "${extension}"). Use ".${extension}" instead.`);
  }
  const absDir = resolve3(contextCwd(), directory);
  if (!existsSync6(absDir)) {
    throw new LspInvalidPathError(`Directory does not exist: ${absDir}`);
  }
  const serverResult = findServerForExtension(extension);
  if (serverResult.status !== "found") {
    throw new LspServerLookupError(formatServerLookupError(serverResult));
  }
  const server2 = serverResult.server;
  const allFiles = collectFilesWithExtension(absDir, extension, maxFiles + 1);
  const wasCapped = allFiles.length > maxFiles;
  const filesToProcess = allFiles.slice(0, maxFiles);
  if (filesToProcess.length === 0) {
    return [
      `Directory: ${absDir}`,
      `Extension: ${extension}`,
      "Files scanned: 0",
      `No files found with extension "${extension}".`
    ].join(`
`);
  }
  const root = findWorkspaceRoot(absDir);
  const manager = getLspManager();
  const allDiagnostics = [];
  const fileErrors = [];
  const client = await manager.getClient(root, server2);
  try {
    for (const file of filesToProcess) {
      try {
        const result = await client.diagnostics(file);
        const filtered = filterDiagnosticsBySeverity(result.items, severity);
        allDiagnostics.push(...filtered.map((diagnostic) => ({
          filePath: file,
          diagnostic
        })));
      } catch (e) {
        fileErrors.push({
          file,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
  } finally {
    manager.releaseClient(root, server2.id);
  }
  const displayDiagnostics = allDiagnostics.slice(0, DEFAULT_MAX_DIAGNOSTICS);
  const wasDiagCapped = allDiagnostics.length > DEFAULT_MAX_DIAGNOSTICS;
  const lines = [
    `Directory: ${absDir}`,
    `Extension: ${extension}`,
    `Files scanned: ${filesToProcess.length}${wasCapped ? ` (capped at ${maxFiles})` : ""}`,
    `Files with errors: ${fileErrors.length}`,
    `Total diagnostics: ${allDiagnostics.length}`
  ];
  if (fileErrors.length > 0) {
    lines.push("", "File processing errors:");
    for (const { file, error } of fileErrors) {
      lines.push(`  ${file}: ${error}`);
    }
  }
  if (displayDiagnostics.length > 0) {
    lines.push("");
    for (const { filePath, diagnostic } of displayDiagnostics) {
      lines.push(`${filePath}: ${formatDiagnostic(diagnostic)}`);
    }
    if (wasDiagCapped) {
      lines.push("", `... (${allDiagnostics.length - DEFAULT_MAX_DIAGNOSTICS} more diagnostics not shown)`);
    }
  }
  return lines.join(`
`);
}

// ../lsp-core/src/lsp/infer-extension.ts
import { lstatSync as lstatSync2, readdirSync as readdirSync2 } from "node:fs";
import { join as join7 } from "node:path";
var SKIP_DIRECTORIES2 = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);
var MAX_SCAN_ENTRIES = 500;
function inferExtensionFromDirectory(directory) {
  const extensionCounts = new Map;
  let scanned = 0;
  function walk(dir) {
    if (scanned >= MAX_SCAN_ENTRIES)
      return;
    let entries;
    try {
      entries = readdirSync2(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (scanned >= MAX_SCAN_ENTRIES)
        return;
      const fullPath = join7(dir, entry);
      let stat;
      try {
        stat = lstatSync2(fullPath);
      } catch {
        continue;
      }
      if (stat.isSymbolicLink())
        continue;
      scanned++;
      if (stat.isDirectory()) {
        if (!SKIP_DIRECTORIES2.has(entry)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = effectiveExtension(fullPath);
        if (ext && ext in EXT_TO_LANG) {
          extensionCounts.set(ext, (extensionCounts.get(ext) ?? 0) + 1);
        }
      }
    }
  }
  walk(directory);
  if (extensionCounts.size === 0)
    return null;
  let maxExt = "";
  let maxCount = 0;
  for (const [ext, count] of extensionCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxExt = ext;
    }
  }
  return maxExt || null;
}

// ../lsp-core/src/lsp/utils.ts
var RUST_SRC_REPAIR_MESSAGE = [
  "rust-analyzer exited while loading Rust standard library sources.",
  "",
  "Repair rust-src for the active toolchain:",
  "  rustup component remove rust-src",
  "  rustup component add rust-src"
];
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function formatKnownLspStartupFailure(error) {
  if (!(error instanceof LspProcessExitedError))
    return null;
  if (error.serverId !== "rust")
    return null;
  const details = error.stderrTail ?? error.message;
  const lowerDetails = details.toLowerCase();
  const isRustSrcFailure = lowerDetails.includes("rust-src") && (lowerDetails.includes("failed to install component") || lowerDetails.includes("detected conflict") || lowerDetails.includes("can't load standard library") || lowerDetails.includes("try installing") || lowerDetails.includes("sysroot"));
  if (!isRustSrcFailure)
    return null;
  return [...RUST_SRC_REPAIR_MESSAGE, "", "Original stderr tail:", details].join(`
`);
}
function handleMissingDependencyError(error) {
  const knownStartupFailure = formatKnownLspStartupFailure(error);
  if (knownStartupFailure)
    return knownStartupFailure;
  const message = errorMessage(error);
  return message.includes("NOT INSTALLED") || message.includes("No LSP server configured") ? message : null;
}
// ../lsp-core/src/missing-dependency-result.ts
function missingDependencyResult(error, details) {
  const message = handleMissingDependencyError(error);
  if (!message)
    return null;
  return {
    content: [{ type: "text", text: message }],
    details: {
      ...details,
      error: message,
      errorKind: "missing_dependency"
    }
  };
}

// ../lsp-core/src/tools/parameters.ts
function isRecord4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function requireString(params, key) {
  const value = params[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required string parameter '${key}'`);
  }
  return value;
}
function optionalString(params, key) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}
function requireNumber(params, key) {
  const value = params[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Missing required number parameter '${key}'`);
  }
  return value;
}
function optionalNumber(params, key) {
  const value = params[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function optionalBoolean(params, key) {
  const value = params[key];
  return typeof value === "boolean" ? value : undefined;
}
function severityFilter(params) {
  const value = params["severity"];
  if (value === "error" || value === "warning" || value === "information" || value === "hint" || value === "all") {
    return value;
  }
  return "all";
}
function clientOptions(signal) {
  return signal === undefined ? {} : { signal };
}

// ../lsp-core/src/tools/result.ts
function text(text2, details, isError = false) {
  return { content: [{ type: "text", text: text2 }], details, isError };
}

// ../lsp-core/src/tools/diagnostics.ts
function asDiagnosticArray(result) {
  if (!result)
    return [];
  if (Array.isArray(result))
    return result;
  return result.items ?? [];
}
async function executeLspDiagnostics(params, signal) {
  const filePath = requireString(params, "filePath");
  const severity = severityFilter(params);
  try {
    const absPath = resolve4(contextCwd(), filePath);
    if (isDirectoryPath(absPath)) {
      const extension = inferExtensionFromDirectory(absPath);
      if (!extension) {
        const message = `No supported source files found in directory: ${absPath}`;
        const details3 = {
          filePath,
          severity,
          mode: "directory",
          diagnostics: [],
          totalDiagnostics: 0,
          truncated: false,
          error: message,
          errorKind: "no_files"
        };
        return text(message, details3);
      }
      const output2 = await aggregateDiagnosticsForDirectory(absPath, extension, severity);
      const details2 = {
        filePath,
        severity,
        mode: "directory",
        diagnostics: [],
        totalDiagnostics: 0,
        truncated: false
      };
      return text(output2, details2);
    }
    const result = await withLspClient(filePath, async (client) => client.diagnostics(filePath), "diagnostics", clientOptions(signal));
    const diagnostics = filterDiagnosticsBySeverity(asDiagnosticArray(result), severity);
    const total = diagnostics.length;
    const truncated = total > DEFAULT_MAX_DIAGNOSTICS;
    const limited = truncated ? diagnostics.slice(0, DEFAULT_MAX_DIAGNOSTICS) : diagnostics;
    const output = total === 0 ? "No diagnostics found" : [
      ...truncated ? [`Found ${total} diagnostics (showing first ${DEFAULT_MAX_DIAGNOSTICS}):`] : [],
      ...limited.map(formatDiagnostic)
    ].join(`
`);
    const details = {
      filePath,
      severity,
      mode: "file",
      diagnostics: diagnostics.map((diagnostic) => ({ file: absPath, diagnostic })),
      totalDiagnostics: total,
      truncated
    };
    return text(output, details);
  } catch (error) {
    const missingDependency = missingDependencyResult(error, {
      filePath,
      severity,
      mode: "file",
      diagnostics: [],
      totalDiagnostics: 0,
      truncated: false
    });
    if (missingDependency)
      return missingDependency;
    throw error;
  }
}
// ../lsp-core/src/tools/install-decision.ts
async function executeLspInstallDecision(params) {
  const serverId = requireString(params, "server_id");
  const decision = params["decision"];
  if (!isInstallDecision(decision)) {
    return text(`Invalid decision '${String(decision)}'. Expected "declined" or "allowed".`, { serverId, errorKind: "invalid_decision" }, true);
  }
  const serverIds = [...new Set(getMergedServers().map((server2) => server2.id))];
  if (!serverIds.includes(serverId)) {
    const preview = serverIds.slice(0, 20).join(", ");
    return text(`Unknown LSP server '${serverId}'. Known servers: ${preview}${serverIds.length > 20 ? "..." : ""}`, { serverId, errorKind: "unknown_server" }, true);
  }
  recordInstallDecision(serverId, decision);
  return text(`Recorded install decision for '${serverId}': ${decision}. ${decisionFollowUp(decision)}`, {
    serverId,
    decision
  });
}
function decisionFollowUp(decision) {
  return decision === "declined" ? "Future LSP lookups for this server stay quiet; proceed without LSP." : "Future LSP lookups keep install instructions without asking the user.";
}

// ../lsp-core/src/tools/navigation.ts
async function executeLspGotoDefinition(params, signal) {
  const filePath = requireString(params, "filePath");
  const line = requireNumber(params, "line");
  const character = requireNumber(params, "character");
  try {
    const result = await withLspClient(filePath, async (client) => client.definition(filePath, line, character), "definition", clientOptions(signal));
    const locations = !result ? [] : Array.isArray(result) ? result : [result];
    const details = { filePath, line, character, locations };
    if (locations.length === 0)
      return text("No definition found", details);
    return text(locations.map(formatLocation).join(`
`), details);
  } catch (error) {
    const missingDependency = missingDependencyResult(error, {
      filePath,
      line,
      character,
      locations: []
    });
    if (missingDependency)
      return missingDependency;
    throw error;
  }
}
async function executeLspFindReferences(params, signal) {
  const filePath = requireString(params, "filePath");
  const line = requireNumber(params, "line");
  const character = requireNumber(params, "character");
  const includeDeclaration = optionalBoolean(params, "includeDeclaration") ?? true;
  try {
    const result = await withLspClient(filePath, async (client) => client.references(filePath, line, character, includeDeclaration), "references", clientOptions(signal));
    const references = Array.isArray(result) ? result : [];
    const total = references.length;
    const truncated = total > DEFAULT_MAX_REFERENCES;
    const limited = truncated ? references.slice(0, DEFAULT_MAX_REFERENCES) : references;
    const details = {
      filePath,
      line,
      character,
      references,
      totalReferences: total,
      truncated
    };
    if (total === 0)
      return text("No references found", details);
    const output = [
      ...truncated ? [`Found ${total} references (showing first ${DEFAULT_MAX_REFERENCES}):`] : [],
      ...limited.map(formatLocation)
    ].join(`
`);
    return text(output, details);
  } catch (error) {
    const missingDependency = missingDependencyResult(error, {
      filePath,
      line,
      character,
      references: [],
      totalReferences: 0,
      truncated: false
    });
    if (missingDependency)
      return missingDependency;
    throw error;
  }
}

// ../lsp-core/src/lsp/workspace-edit.ts
import { existsSync as existsSync7, readFileSync as readFileSync4, realpathSync, unlinkSync, writeFileSync as writeFileSync2 } from "node:fs";
import { dirname as dirname3, isAbsolute as isAbsolute3, relative, resolve as resolve5 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function errorMessage2(error) {
  return error instanceof Error ? error.message : String(error);
}
function isPathInsideWorkspace(filePath, workspaceRoot) {
  const relativePath = relative(workspaceRoot, filePath);
  return relativePath === "" || !relativePath.startsWith("..") && !isAbsolute3(relativePath);
}
function realpathForValidation(filePath) {
  if (existsSync7(filePath))
    return realpathSync(filePath);
  const parent = dirname3(filePath);
  return resolve5(realpathSync(parent), relative(parent, filePath));
}
function uriToWorkspacePath(uri, workspaceRoot) {
  let filePath;
  try {
    filePath = fileURLToPath2(uri);
  } catch (error) {
    return { success: false, error: `non-file URI ${uri}: ${errorMessage2(error)}` };
  }
  let validatedPath;
  try {
    validatedPath = realpathForValidation(filePath);
  } catch (error) {
    return { success: false, error: `${filePath}: ${errorMessage2(error)}` };
  }
  if (!isPathInsideWorkspace(validatedPath, workspaceRoot)) {
    return { success: false, error: `${filePath}: outside workspace ${workspaceRoot}` };
  }
  return { success: true, path: filePath };
}
function applyTextEditsToFile(filePath, edits) {
  try {
    const content = readFileSync4(filePath, "utf-8");
    const lines = content.split(`
`);
    const sortedEdits = [...edits].sort((a, b) => {
      if (b.range.start.line !== a.range.start.line) {
        return b.range.start.line - a.range.start.line;
      }
      return b.range.start.character - a.range.start.character;
    });
    for (const edit of sortedEdits) {
      const startLine = edit.range.start.line;
      const startChar = edit.range.start.character;
      const endLine = edit.range.end.line;
      const endChar = edit.range.end.character;
      if (startLine === endLine) {
        const line = lines[startLine] ?? "";
        lines[startLine] = line.substring(0, startChar) + edit.newText + line.substring(endChar);
      } else {
        const firstLine = lines[startLine] ?? "";
        const lastLine = lines[endLine] ?? "";
        const newContent = firstLine.substring(0, startChar) + edit.newText + lastLine.substring(endChar);
        lines.splice(startLine, endLine - startLine + 1, ...newContent.split(`
`));
      }
    }
    writeFileSync2(filePath, lines.join(`
`), "utf-8");
    return { success: true, editCount: edits.length };
  } catch (err) {
    return {
      success: false,
      editCount: 0,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function applyWorkspaceEdit(edit, options = {}) {
  if (!edit) {
    return { success: false, filesModified: [], totalEdits: 0, errors: ["No edit provided"] };
  }
  const result = { success: true, filesModified: [], totalEdits: 0, errors: [] };
  const workspaceRoot = realpathSync(options.workspaceRoot ?? contextCwd());
  if (edit.changes) {
    for (const [uri, edits] of Object.entries(edit.changes)) {
      const validatedPath = uriToWorkspacePath(uri, workspaceRoot);
      if (!validatedPath.success) {
        result.success = false;
        result.errors.push(validatedPath.error);
        continue;
      }
      const applyResult = applyTextEditsToFile(validatedPath.path, edits);
      if (applyResult.success) {
        result.filesModified.push(validatedPath.path);
        result.totalEdits += applyResult.editCount;
      } else {
        result.success = false;
        result.errors.push(`${validatedPath.path}: ${applyResult.error}`);
      }
    }
  }
  if (edit.documentChanges) {
    for (const change of edit.documentChanges) {
      if (!("kind" in change)) {
        const validatedPath = uriToWorkspacePath(change.textDocument.uri, workspaceRoot);
        if (!validatedPath.success) {
          result.success = false;
          result.errors.push(validatedPath.error);
          continue;
        }
        const applyResult = applyTextEditsToFile(validatedPath.path, change.edits);
        if (applyResult.success) {
          result.filesModified.push(validatedPath.path);
          result.totalEdits += applyResult.editCount;
        } else {
          result.success = false;
          result.errors.push(`${validatedPath.path}: ${applyResult.error}`);
        }
        continue;
      }
      if (change.kind === "create") {
        try {
          const validatedPath = uriToWorkspacePath(change.uri, workspaceRoot);
          if (!validatedPath.success) {
            result.success = false;
            result.errors.push(`Create ${change.uri}: ${validatedPath.error}`);
            continue;
          }
          writeFileSync2(validatedPath.path, "", "utf-8");
          result.filesModified.push(validatedPath.path);
        } catch (err) {
          result.success = false;
          result.errors.push(`Create ${change.uri}: ${String(err)}`);
        }
      } else if (change.kind === "rename") {
        try {
          const oldPath = uriToWorkspacePath(change.oldUri, workspaceRoot);
          const newPath = uriToWorkspacePath(change.newUri, workspaceRoot);
          if (!oldPath.success || !newPath.success) {
            const error = oldPath.success ? newPath.success ? "invalid URI" : newPath.error : oldPath.error;
            result.success = false;
            result.errors.push(`Rename ${change.oldUri}: ${error}`);
            continue;
          }
          const content = readFileSync4(oldPath.path, "utf-8");
          writeFileSync2(newPath.path, content, "utf-8");
          unlinkSync(oldPath.path);
          result.filesModified.push(newPath.path);
        } catch (err) {
          result.success = false;
          result.errors.push(`Rename ${change.oldUri}: ${String(err)}`);
        }
      } else if (change.kind === "delete") {
        try {
          const validatedPath = uriToWorkspacePath(change.uri, workspaceRoot);
          if (!validatedPath.success) {
            result.success = false;
            result.errors.push(`Delete ${change.uri}: ${validatedPath.error}`);
            continue;
          }
          unlinkSync(validatedPath.path);
          result.filesModified.push(validatedPath.path);
        } catch (err) {
          result.success = false;
          result.errors.push(`Delete ${change.uri}: ${String(err)}`);
        }
      }
    }
  }
  return result;
}

// ../lsp-core/src/tools/rename.ts
async function executeLspPrepareRename(params, signal) {
  const filePath = requireString(params, "filePath");
  const line = requireNumber(params, "line");
  const character = requireNumber(params, "character");
  try {
    const result = await withLspClient(filePath, async (client) => client.prepareRename(filePath, line, character), "prepareRename", clientOptions(signal));
    const details = { filePath, line, character, result };
    return text(formatPrepareRenameResult(result), details);
  } catch (error) {
    const missingDependency = missingDependencyResult(error, {
      filePath,
      line,
      character,
      result: null
    });
    if (missingDependency)
      return missingDependency;
    throw error;
  }
}
async function executeLspRename(params, signal) {
  const filePath = requireString(params, "filePath");
  const line = requireNumber(params, "line");
  const character = requireNumber(params, "character");
  const newName = requireString(params, "newName");
  try {
    const edit = await withLspClient(filePath, async (client, workspaceRoot) => ({
      edit: await client.rename(filePath, line, character, newName),
      workspaceRoot
    }), "rename", clientOptions(signal));
    const apply = applyWorkspaceEdit(edit.edit, { workspaceRoot: edit.workspaceRoot });
    const details = { filePath, line, character, newName, apply, edit: edit.edit };
    return text(formatApplyResult(apply), details, !apply.success);
  } catch (error) {
    const missingDependency = missingDependencyResult(error, {
      filePath,
      line,
      character,
      newName,
      apply: null,
      edit: null
    });
    if (missingDependency)
      return missingDependency;
    throw error;
  }
}

// ../lsp-core/src/tools/schema.ts
function objectSchema(properties, required = []) {
  return {
    type: "object",
    properties,
    required
  };
}

// ../lsp-core/src/tools/status.ts
async function executeLspStatus() {
  const servers = getAllServers();
  const snapshots = getLspManager().getSnapshot();
  const installed = servers.filter((server2) => server2.installed && !server2.disabled);
  const configuredLines = servers.map((server2) => {
    const state = server2.disabled ? "disabled" : server2.installed ? "installed" : "missing";
    return `- ${server2.id}: ${state}; source=${server2.source}; extensions=${server2.extensions.join(", ")}`;
  });
  const activeLines = snapshots.map((snapshot) => {
    const state = snapshot.alive ? snapshot.isInitializing ? "initializing" : "alive" : "dead";
    return `- ${snapshot.serverId}: ${state}; root=${snapshot.root}; refs=${snapshot.refCount}`;
  });
  const lines = [
    `Configured LSP servers: ${servers.length}`,
    `Installed LSP servers: ${installed.length}`,
    "",
    ...configuredLines,
    "",
    `Active LSP clients: ${snapshots.length}`,
    ...activeLines
  ];
  return text(lines.join(`
`), { servers, snapshots });
}

// ../lsp-core/src/tools/symbols.ts
function isDocumentSymbol(symbol) {
  return "range" in symbol;
}
async function executeLspSymbols(params, signal) {
  const filePath = requireString(params, "filePath");
  const rawScope = optionalString(params, "scope") ?? "document";
  const scope = rawScope === "workspace" ? "workspace" : "document";
  const limit = Math.min(optionalNumber(params, "limit") ?? DEFAULT_MAX_SYMBOLS, DEFAULT_MAX_SYMBOLS);
  try {
    if (scope === "workspace") {
      const query = optionalString(params, "query");
      if (!query) {
        const message = "Error: 'query' is required for workspace scope";
        return text(message, {
          filePath,
          scope,
          symbols: [],
          totalSymbols: 0,
          truncated: false,
          error: message,
          errorKind: "missing_query"
        });
      }
      const symbols2 = await withLspClient(filePath, async (client) => client.workspaceSymbols(query), "workspaceSymbols", clientOptions(signal));
      return formatSymbolsResult(filePath, scope, symbols2, limit, query);
    }
    const symbols = await withLspClient(filePath, async (client) => client.documentSymbols(filePath), "documentSymbols", clientOptions(signal));
    return formatSymbolsResult(filePath, scope, symbols, limit);
  } catch (error) {
    const query = optionalString(params, "query");
    const missingDependency = missingDependencyResult(error, {
      filePath,
      scope,
      symbols: [],
      totalSymbols: 0,
      truncated: false,
      ...query === undefined ? {} : { query }
    });
    if (missingDependency)
      return missingDependency;
    throw error;
  }
}
function formatSymbolsResult(filePath, scope, symbols, limit, query) {
  const total = symbols.length;
  const truncated = total > limit;
  const limited = truncated ? symbols.slice(0, limit) : symbols;
  const details = {
    filePath,
    scope,
    symbols,
    totalSymbols: total,
    truncated,
    ...query === undefined ? {} : { query }
  };
  if (total === 0)
    return text("No symbols found", details);
  const lines = [];
  if (truncated)
    lines.push(`Found ${total} symbols (showing first ${limit}):`);
  const documentSymbols = limited.filter(isDocumentSymbol);
  if (documentSymbols.length === limited.length) {
    lines.push(...documentSymbols.map((symbol) => formatDocumentSymbol(symbol)));
  } else {
    lines.push(...limited.filter((symbol) => !isDocumentSymbol(symbol)).map(formatSymbolInfo));
  }
  return text(lines.join(`
`), details);
}

// ../lsp-core/src/tools/definitions.ts
var LSP_MCP_TOOLS = [
  {
    name: "status",
    aliases: ["lsp_status"],
    title: "LSP Status",
    description: "List configured and active LSP servers without starting a new language server.",
    inputSchema: objectSchema({}),
    execute: executeLspStatus
  },
  {
    name: "diagnostics",
    aliases: ["lsp_diagnostics"],
    title: "LSP Diagnostics",
    description: "Get errors, warnings, and hints for a source file or directory.",
    inputSchema: objectSchema({
      filePath: { type: "string", description: "File or directory path to check." },
      severity: {
        type: "string",
        enum: ["error", "warning", "information", "hint", "all"],
        description: "Severity filter. Defaults to all."
      }
    }, ["filePath"]),
    execute: executeLspDiagnostics
  },
  {
    name: "goto_definition",
    aliases: ["lsp_goto_definition"],
    title: "LSP Goto Definition",
    description: "Find where a symbol is defined.",
    inputSchema: objectSchema({
      filePath: { type: "string", description: "Source file containing the symbol." },
      line: { type: "number", description: "1-based line number." },
      character: { type: "number", description: "0-based column." }
    }, ["filePath", "line", "character"]),
    execute: executeLspGotoDefinition
  },
  {
    name: "find_references",
    aliases: ["lsp_find_references"],
    title: "LSP Find References",
    description: "Find references of a symbol across the workspace.",
    inputSchema: objectSchema({
      filePath: { type: "string", description: "Source file containing the symbol." },
      line: { type: "number", description: "1-based line number." },
      character: { type: "number", description: "0-based column." },
      includeDeclaration: { type: "boolean", description: "Include the declaration. Defaults to true." }
    }, ["filePath", "line", "character"]),
    execute: executeLspFindReferences
  },
  {
    name: "symbols",
    aliases: ["lsp_symbols"],
    title: "LSP Symbols",
    description: "List document symbols or search workspace symbols.",
    inputSchema: objectSchema({
      filePath: { type: "string", description: "File path used as LSP context." },
      scope: {
        type: "string",
        enum: ["document", "workspace"],
        description: "Use document for file outline or workspace for project-wide search."
      },
      query: { type: "string", description: "Workspace symbol query." },
      limit: { type: "number", description: "Maximum number of symbols to return." }
    }, ["filePath", "scope"]),
    execute: executeLspSymbols
  },
  {
    name: "prepare_rename",
    aliases: ["lsp_prepare_rename"],
    title: "LSP Prepare Rename",
    description: "Check whether a symbol can be renamed at a position.",
    inputSchema: objectSchema({
      filePath: { type: "string", description: "Source file path." },
      line: { type: "number", description: "1-based line number." },
      character: { type: "number", description: "0-based column." }
    }, ["filePath", "line", "character"]),
    execute: executeLspPrepareRename
  },
  {
    name: "rename",
    aliases: ["lsp_rename"],
    title: "LSP Rename",
    description: "Rename a symbol across the workspace and apply the returned workspace edit.",
    inputSchema: objectSchema({
      filePath: { type: "string", description: "Source file path." },
      line: { type: "number", description: "1-based line number." },
      character: { type: "number", description: "0-based column." },
      newName: { type: "string", description: "New symbol name." }
    }, ["filePath", "line", "character", "newName"]),
    execute: executeLspRename
  },
  {
    name: "install_decision",
    aliases: ["lsp_install_decision"],
    title: "LSP Install Decision",
    description: "Record whether the user allowed or declined installing a missing LSP server. Record 'declined' when the user declines, or has not explicitly asked for LSP installation, to silence future prompts.",
    inputSchema: objectSchema({
      server_id: {
        type: "string",
        description: "The LSP server id from the not-installed message (e.g. 'rust')."
      },
      decision: {
        type: "string",
        enum: ["declined", "allowed"],
        description: "'declined' silences future prompts; 'allowed' pre-authorizes installation."
      }
    }, ["server_id", "decision"]),
    execute: executeLspInstallDecision
  }
];
// ../lsp-core/src/tools/runtime.ts
async function executeLspTool(name, params, signal) {
  const tool = LSP_MCP_TOOLS.find((candidate) => matchesToolName(candidate, name));
  if (!tool)
    throw new Error(`Unknown LSP tool: ${name}`);
  return tool.execute(params, signal);
}
function matchesToolName(tool, name) {
  return tool.name === name || (tool.aliases?.includes(name) ?? false);
}
function coerceToolArguments(value) {
  return isRecord4(value) ? value : {};
}
// ../lsp-core/src/mcp.ts
var SERVER_NAME = "lsp";
var SERVER_VERSION = "0.1.0";
async function handleLspMcpRequest(input) {
  if (!isPlainRecord(input)) {
    return errorResponse(null, -32600, "Invalid Request");
  }
  const id = jsonRpcId(input["id"]);
  const method = input["method"];
  if (method === "notifications/initialized")
    return;
  if (method === "ping")
    return successResponse(id, {});
  if (method === "initialize") {
    const protocolVersion = requestedProtocolVersion(input["params"]);
    return successResponse(id, {
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      protocolVersion
    });
  }
  if (method === "tools/list") {
    return successResponse(id, { tools: LSP_MCP_TOOLS.map(describeTool) });
  }
  if (method === "tools/call") {
    return handleToolCall(id, input["params"]);
  }
  return errorResponse(id, -32601, `Method not found: ${String(method)}`);
}
async function handleToolCall(id, params) {
  if (!isPlainRecord(params) || typeof params["name"] !== "string") {
    return errorResponse(id, -32602, "tools/call requires params.name");
  }
  try {
    const result = await executeLspTool(params["name"], coerceToolArguments(params["arguments"]));
    return successResponse(id, {
      content: result.content,
      isError: result.isError ?? false,
      details: result.details
    });
  } catch (error) {
    return successResponse(id, {
      content: [{ type: "text", text: messageFromError(error) }],
      isError: true
    });
  }
}
function describeTool(tool) {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema
  };
}
function requestedProtocolVersion(params) {
  if (!isPlainRecord(params) || typeof params["protocolVersion"] !== "string")
    return "2024-11-05";
  return params["protocolVersion"];
}

// src/daemon-client.ts
import { connect as connect2 } from "node:net";

// src/ensure-daemon.ts
import { spawn as spawn2 } from "node:child_process";
import { closeSync as closeSync2, existsSync as existsSync8, mkdirSync as mkdirSync3, openSync as openSync2 } from "node:fs";
import { connect } from "node:net";
import { dirname as dirname5 } from "node:path";
import { execPath } from "node:process";
import { fileURLToPath as fileURLToPath3 } from "node:url";

// src/lock.ts
import { closeSync, mkdirSync as mkdirSync2, openSync, readFileSync as readFileSync5, unlinkSync as unlinkSync2, writeSync } from "node:fs";
import { dirname as dirname4 } from "node:path";
function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}
function readLockPid(lockPath) {
  try {
    const pid = Number.parseInt(readFileSync5(lockPath, "utf8").trim(), 10);
    return Number.isInteger(pid) ? pid : null;
  } catch {
    return null;
  }
}
function tryAcquireLock(lockPath, ownerPid = process.pid) {
  mkdirSync2(dirname4(lockPath), { recursive: true });
  for (let attempt = 0;attempt < 2; attempt += 1) {
    const handle = writeLockFile(lockPath, ownerPid);
    if (handle)
      return handle;
    if (!reapStaleLock(lockPath))
      return null;
  }
  return null;
}
function writeLockFile(lockPath, ownerPid) {
  try {
    const fd = openSync(lockPath, "wx");
    writeSync(fd, `${ownerPid}
`);
    closeSync(fd);
    return { release: () => unlinkQuietly(lockPath) };
  } catch (error) {
    if (error.code === "EEXIST")
      return null;
    throw error;
  }
}
function reapStaleLock(lockPath) {
  const pid = readLockPid(lockPath);
  if (pid !== null && isProcessAlive(pid))
    return false;
  unlinkQuietly(lockPath);
  return true;
}
function unlinkQuietly(path) {
  try {
    unlinkSync2(path);
  } catch (error) {}
}

// src/ensure-daemon.ts
var PROBE_TIMEOUT_MS = 500;
var DEFAULT_READY_TIMEOUT_MS = 5000;
var DEFAULT_POLL_INTERVAL_MS = 100;
var CODEX_LSP_DAEMON_CLI_ENV = "CODEX_LSP_DAEMON_CLI";

class DaemonUnreachableError extends Error {
  constructor(socketPath) {
    super(`LSP daemon did not become reachable at ${socketPath}`);
    this.name = "DaemonUnreachableError";
  }
}
async function ensureDaemonRunning(paths, deps = defaultEnsureDaemonDeps(), options = {}) {
  const readyTimeoutMs = options.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  if (await deps.probe(paths.socket))
    return;
  const lock = deps.acquireLock(paths.lock);
  if (!lock) {
    await waitUntilReachable(paths.socket, deps, readyTimeoutMs, pollIntervalMs);
    return;
  }
  try {
    if (await deps.probe(paths.socket))
      return;
    deps.cleanupStaleSocket(paths.socket);
    deps.spawnDaemon(paths);
    await waitUntilReachable(paths.socket, deps, readyTimeoutMs, pollIntervalMs);
  } finally {
    lock.release();
  }
}
async function waitUntilReachable(socketPath, deps, readyTimeoutMs, pollIntervalMs) {
  const deadline = deps.now() + readyTimeoutMs;
  for (;; ) {
    if (await deps.probe(socketPath))
      return;
    if (deps.now() >= deadline)
      throw new DaemonUnreachableError(socketPath);
    await deps.sleep(pollIntervalMs);
  }
}
function probeSocket(socketPath, timeoutMs = PROBE_TIMEOUT_MS) {
  return new Promise((resolve6) => {
    const socket = connect(socketPath);
    const finish = (ok) => {
      socket.destroy();
      resolve6(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    timer.unref?.();
    socket.once("connect", () => {
      clearTimeout(timer);
      finish(true);
    });
    socket.once("error", () => {
      clearTimeout(timer);
      finish(false);
    });
  });
}
function spawnDaemonProcess(paths) {
  mkdirSync3(dirname5(paths.log), { recursive: true });
  const logFd = openSync2(paths.log, "a");
  try {
    const cliPath = resolveDaemonCliPath();
    const child = spawn2(execPath, [cliPath, "daemon"], {
      detached: true,
      stdio: ["ignore", logFd, logFd]
    });
    child.unref();
  } finally {
    closeSync2(logFd);
  }
}
function resolveDaemonCliPath(env = process.env) {
  const override = env[CODEX_LSP_DAEMON_CLI_ENV]?.trim();
  if (override)
    return override;
  return fileURLToPath3(new URL("./cli.js", import.meta.url));
}
function defaultEnsureDaemonDeps() {
  return {
    probe: (socketPath) => probeSocket(socketPath),
    acquireLock: (lockPath) => tryAcquireLock(lockPath),
    cleanupStaleSocket: (socketPath) => {
      if (existsSync8(socketPath))
        unlinkQuietly(socketPath);
    },
    spawnDaemon: (paths) => spawnDaemonProcess(paths),
    sleep: (ms) => new Promise((resolve6) => {
      setTimeout(resolve6, ms);
    }),
    now: () => Date.now()
  };
}

// src/paths.ts
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { homedir as homedir3, tmpdir } from "node:os";
import { join as join8 } from "node:path";
var requireFromHere = createRequire(import.meta.url);
var MAX_SOCKET_PATH_LENGTH = 100;
var CODEX_LSP_DAEMON_VERSION_ENV = "CODEX_LSP_DAEMON_VERSION";
function resolveDaemonVersion(requireFn = requireFromHere) {
  for (const candidate of ["./package.json", "../package.json"]) {
    try {
      const pkg = requireFn(candidate);
      if (typeof pkg.version === "string" && pkg.version.length > 0)
        return pkg.version;
    } catch {}
  }
  return "0";
}
function daemonBaseDir(env = process.env) {
  const explicit = env["CODEX_LSP_DAEMON_DIR"]?.trim();
  if (explicit)
    return explicit;
  const pluginData = env["PLUGIN_DATA"]?.trim();
  if (pluginData)
    return join8(pluginData, "daemon");
  const codexHome = env["CODEX_HOME"]?.trim();
  const home = codexHome && codexHome.length > 0 ? codexHome : join8(homedir3(), ".codex");
  return join8(home, "codex-lsp", "daemon");
}
function daemonPaths(env = process.env, version = resolveDaemonVersionFromEnv(env) ?? resolveDaemonVersion()) {
  const dir = join8(daemonBaseDir(env), `v${version}`);
  return {
    version,
    dir,
    socket: resolveSocketPath(dir, version),
    lock: join8(dir, "daemon.lock"),
    pid: join8(dir, "daemon.pid"),
    log: join8(dir, "daemon.log")
  };
}
function resolveDaemonVersionFromEnv(env = process.env) {
  const version = env[CODEX_LSP_DAEMON_VERSION_ENV]?.trim();
  return version && version.length > 0 ? version : null;
}
function resolveSocketPath(dir, version) {
  const digest = createHash("sha256").update(dir).digest("hex").slice(0, 16);
  if (process.platform === "win32") {
    return `\\\\.\\pipe\\omo-lsp-${version}-${digest}`;
  }
  const natural = join8(dir, "daemon.sock");
  if (natural.length < MAX_SOCKET_PATH_LENGTH)
    return natural;
  return join8(tmpdir(), `omo-lsp-${version}-${digest}.sock`);
}

// src/request-routing.ts
var CONTEXT_KEY = "_context";
function extractRequestContext(raw) {
  if (!isRecord5(raw) || raw["method"] !== "tools/call")
    return { input: raw, context: undefined };
  const params = raw["params"];
  if (!isRecord5(params))
    return { input: raw, context: undefined };
  const args = params["arguments"];
  if (!isRecord5(args))
    return { input: raw, context: undefined };
  const context = parseContext(args[CONTEXT_KEY]);
  if (!context)
    return { input: raw, context: undefined };
  const cleanedArgs = { ...args };
  delete cleanedArgs[CONTEXT_KEY];
  const cleaned = { ...raw, params: { ...params, arguments: cleanedArgs } };
  return { input: cleaned, context };
}
function handleDaemonMessage(raw) {
  const { input, context } = extractRequestContext(raw);
  if (context)
    return runWithRequestContext(context, () => handleLspMcpRequest(input));
  return handleLspMcpRequest(input);
}
function parseContext(value) {
  if (!isRecord5(value))
    return;
  const context = {};
  const cwd = value["cwd"];
  if (typeof cwd === "string")
    context.cwd = cwd;
  const env = value["env"];
  if (isStringRecord2(env))
    context.env = env;
  return context.cwd === undefined && context.env === undefined ? undefined : context;
}
function isRecord5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringRecord2(value) {
  return isRecord5(value) && Object.values(value).every((item) => typeof item === "string");
}

// src/socket-jsonrpc.ts
function encodeJsonLine(message) {
  return `${JSON.stringify(message)}
`;
}
function createLineDecoder(onMessage, onParseError) {
  let buffer = "";
  return {
    push(chunk) {
      buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");
      let index = buffer.indexOf(`
`);
      while (index !== -1) {
        const raw = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (raw.length > 0) {
          try {
            onMessage(JSON.parse(raw));
          } catch (error) {
            onParseError?.(raw, error);
          }
        }
        index = buffer.indexOf(`
`);
      }
    }
  };
}

// src/daemon-client.ts
var DEFAULT_REQUEST_TIMEOUT_MS = 30000;
var REQUEST_ID = 1;

class DaemonRequestError extends Error {
  requestWritten;
  constructor(message, requestWritten) {
    super(message);
    this.name = "DaemonRequestError";
    this.requestWritten = requestWritten;
  }
}
async function callToolViaDaemon(name, args, options = {}) {
  const paths = options.paths ?? daemonPaths();
  const ensure = options.ensure ?? ensureDaemonRunning;
  const timeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const requestArgs = withContext(args, options.context);
  let lastError;
  for (let attempt = 0;attempt < 2; attempt += 1) {
    try {
      await ensure(paths);
      return await sendToolCall(paths.socket, name, requestArgs, timeoutMs);
    } catch (error) {
      lastError = error;
      if (error instanceof DaemonRequestError && error.requestWritten)
        break;
    }
  }
  return daemonUnreachableResult(paths, lastError);
}
function callDiagnosticsViaDaemon(filePath, options = {}) {
  return callToolViaDaemon("diagnostics", { filePath, severity: "error" }, options);
}
var FORWARDED_ENV_KEYS = [
  "LSP_TOOLS_MCP_PROJECT_CONFIG",
  "LSP_TOOLS_MCP_USER_CONFIG",
  "LSP_TOOLS_MCP_INSTALL_DECISIONS"
];
function currentRequestContext(env = process.env) {
  const forwarded = {};
  for (const key of FORWARDED_ENV_KEYS) {
    const value = env[key];
    if (value !== undefined)
      forwarded[key] = value;
  }
  return { cwd: process.cwd(), env: forwarded };
}
function withContext(args, context) {
  if (!context || context.cwd === undefined && context.env === undefined)
    return args;
  return { ...args, [CONTEXT_KEY]: context };
}
function daemonUnreachableResult(paths, error) {
  const text2 = [
    `LSP daemon unreachable: ${errorText(error)}.`,
    "The MCP server is a thin proxy and never runs language servers in-process.",
    `Socket: ${paths.socket}`,
    `Logs: ${paths.log}`,
    "The daemon is auto-started on demand and will be retried on the next request."
  ].join(`
`);
  return { content: [{ type: "text", text: text2 }], isError: true };
}
function sendToolCall(socketPath, name, args, timeoutMs) {
  return new Promise((resolve6, reject) => {
    const socket = connect2(socketPath);
    let settled = false;
    let requestWritten = false;
    const finish = (run) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      run();
    };
    const timer = setTimeout(() => finish(() => reject(new DaemonRequestError("daemon request timed out", requestWritten))), timeoutMs);
    timer.unref();
    const decoder = createLineDecoder((message) => {
      const result = toToolResult(message);
      if (result)
        finish(() => resolve6(result));
      else
        finish(() => reject(new DaemonRequestError("invalid daemon response", requestWritten)));
    });
    socket.once("connect", () => {
      requestWritten = true;
      socket.write(encodeJsonLine({ jsonrpc: "2.0", id: REQUEST_ID, method: "tools/call", params: { name, arguments: args } }));
    });
    socket.on("data", (chunk) => decoder.push(chunk));
    socket.once("error", (error) => finish(() => reject(new DaemonRequestError(error.message, requestWritten))));
    socket.once("close", () => finish(() => reject(new DaemonRequestError("daemon connection closed", requestWritten))));
  });
}
function toToolResult(message) {
  if (!isRecord6(message) || message["id"] !== REQUEST_ID)
    return null;
  const result = message["result"];
  if (!isRecord6(result) || !Array.isArray(result["content"]))
    return null;
  return {
    content: result["content"],
    isError: result["isError"] === true,
    details: result["details"]
  };
}
function isRecord6(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/proxy.ts
async function runMcpStdioProxy(options = {}) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const paths = options.paths ?? daemonPaths();
  const context = options.context ?? currentRequestContext();
  const callOptions = { paths, context, ...options.ensure ? { ensure: options.ensure } : {} };
  await runJsonRpcStdioServer({
    input,
    output,
    idleTimeoutMs: 0,
    handler: handleProxyRequest,
    handlerOptions: callOptions,
    onHandlerError: (error) => {
      process.stderr.write(`[lsp-daemon] proxy error: ${error instanceof Error ? error.message : String(error)}
`);
    }
  });
}
async function handleProxyRequest(parsed, callOptions) {
  const toolCall = asToolCall(parsed);
  if (!toolCall)
    return handleLspMcpRequest(parsed);
  const result = await callToolViaDaemon(toolCall.name, toolCall.args, callOptions);
  return successResponse(toolCall.id, { content: result.content, isError: result.isError ?? false, details: result.details });
}
function asToolCall(parsed) {
  if (!isPlainRecord(parsed) || parsed["method"] !== "tools/call")
    return null;
  const params = parsed["params"];
  if (!isPlainRecord(params) || typeof params["name"] !== "string")
    return null;
  const args = params["arguments"];
  return { id: jsonRpcId(parsed["id"]), name: params["name"], args: isPlainRecord(args) ? args : {} };
}

// src/daemon-server.ts
import { mkdirSync as mkdirSync4, writeFileSync as writeFileSync3 } from "node:fs";
import { createServer as createServer2 } from "node:net";
import { join as join9 } from "node:path";
var DEFAULT_IDLE_SHUTDOWN_MS = 30 * 60000;
var DEFAULT_IDLE_CHECK_INTERVAL_MS = 60000;
async function startDaemonServer(paths, options = {}) {
  const idleShutdownMs = options.idleShutdownMs ?? DEFAULT_IDLE_SHUTDOWN_MS;
  const idleCheckIntervalMs = options.idleCheckIntervalMs ?? DEFAULT_IDLE_CHECK_INTERVAL_MS;
  mkdirSync4(paths.dir, { recursive: true });
  unlinkQuietly(paths.socket);
  const connections = new Set;
  let lastActiveAt = Date.now();
  const touch = () => {
    lastActiveAt = Date.now();
  };
  const server2 = createServer2((socket) => {
    connections.add(socket);
    touch();
    const decoder = createLineDecoder((message) => {
      touch();
      respond(socket, message);
    });
    socket.on("data", (chunk) => decoder.push(chunk));
    socket.on("error", () => socket.destroy());
    socket.on("close", () => {
      connections.delete(socket);
      touch();
    });
  });
  server2.on("error", (error) => logServerError(error));
  const endpointPath = join9(paths.dir, "daemon.endpoint");
  await listen(server2, paths.socket);
  writeFileSync3(paths.pid, `${process.pid}
`);
  writeFileSync3(endpointPath, paths.socket);
  let closed = false;
  const close = async () => {
    if (closed)
      return;
    closed = true;
    clearInterval(idleTimer);
    for (const socket of connections)
      socket.destroy();
    connections.clear();
    await closeServer(server2);
    unlinkQuietly(paths.socket);
    unlinkQuietly(paths.pid);
    unlinkQuietly(endpointPath);
    await disposeDefaultLspManager();
  };
  const idleTimer = setInterval(() => {
    if (connections.size > 0)
      return;
    if (getLspManager().clientCount() > 0) {
      touch();
      return;
    }
    if (Date.now() - lastActiveAt < idleShutdownMs)
      return;
    if (options.onIdleShutdown) {
      options.onIdleShutdown();
      return;
    }
    close().then(() => process.exit(0));
  }, idleCheckIntervalMs);
  idleTimer.unref();
  installSignalHandlers(close);
  return { server: server2, close };
}
async function respond(socket, message) {
  try {
    const response = await handleDaemonMessage(message);
    if (response && socket.writable)
      socket.write(encodeJsonLine(response));
  } catch (error) {
    logServerError(error);
  }
}
function listen(server2, socketPath) {
  return new Promise((resolve6, reject) => {
    const onError = (error) => reject(error);
    server2.once("error", onError);
    server2.listen(socketPath, () => {
      server2.removeListener("error", onError);
      resolve6();
    });
  });
}
function closeServer(server2) {
  return new Promise((resolve6) => server2.close(() => resolve6()));
}
function installSignalHandlers(close) {
  const handler = () => {
    close().then(() => process.exit(0));
  };
  process.once("SIGTERM", handler);
  process.once("SIGINT", handler);
}
function logServerError(error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`[lsp-daemon] ${message}
`);
}

// src/run-daemon.ts
async function runDaemon() {
  process.on("uncaughtException", (error) => logNonFatal("uncaughtException", error));
  process.on("unhandledRejection", (reason) => logNonFatal("unhandledRejection", reason));
  await startDaemonServer(daemonPaths());
}
function logNonFatal(kind, error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`[lsp-daemon] ${kind}: ${message}
`);
}

// src/cli.ts
async function main() {
  const [command = "mcp"] = argv.slice(2);
  if (command === "daemon") {
    await runDaemon();
    return;
  }
  if (command === "mcp") {
    await runMcpStdioProxy();
    return;
  }
  stderr.write(`Usage: omo-lsp-daemon [mcp | daemon]
`);
  process.exitCode = 2;
}
main().catch((error) => {
  stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}
`);
  process.exitCode = 1;
});

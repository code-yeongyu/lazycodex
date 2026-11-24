// ../lsp-core/src/lsp/cleanup-errors.ts
function writeCleanupError(message) {
  process.stderr.write(`${message}
`);
}
function reportBestEffortCleanupError(operation, error, logger = writeCleanupError) {
  const message = error instanceof Error ? error.message : String(error);
  logger(`[lsp] ignored ${operation} failure during cleanup: ${message}`);
}

// ../lsp-core/src/lsp/client.ts
import { resolve as resolve5 } from "node:path";
import { pathToFileURL as pathToFileURL3 } from "node:url";

// ../lsp-core/src/lsp/connection.ts
import { pathToFileURL } from "node:url";

// ../lsp-core/src/lsp/timer-provider.ts
var realTimerProvider = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle)
};
function repeatEvery(timers, intervalMs, tick) {
  let handle = null;
  const arm = () => {
    handle = timers.setTimeout(() => {
      tick();
      if (handle !== null)
        arm();
    }, intervalMs);
    if (typeof handle.unref === "function")
      handle.unref();
  };
  arm();
  return () => {
    if (handle !== null)
      timers.clearTimeout(handle);
    handle = null;
  };
}

// ../lsp-core/src/lsp/constants.ts
var DEFAULT_MAX_REFERENCES = 200;
var DEFAULT_MAX_SYMBOLS = 200;
var DEFAULT_MAX_DIAGNOSTICS = 200;
var DEFAULT_MAX_DIRECTORY_FILES = 50;
var REQUEST_TIMEOUT_MS = 15000;
var INIT_TIMEOUT_MS = 60000;
var IDLE_TIMEOUT_MS = 5 * 60000;
var MAX_RESIDENT_CLIENTS = 6;
var REAPER_INTERVAL_MS = 60000;
var STOP_HARD_KILL_TIMEOUT_MS = 5000;
var STOP_SIGKILL_GRACE_MS = 1000;
var CLIENT_RESPAWN_RETRY_LIMIT = 2;
var CLIENT_RESPAWN_COOLDOWN_MS = 60000;

// ../lsp-core/src/lsp/errors.ts
class LspConnectionClosedError extends Error {
  constructor(serverId, root, message) {
    super(message ?? `LSP connection closed for ${serverId} at ${root}`);
    this.serverId = serverId;
    this.root = root;
    this.name = "LspConnectionClosedError";
  }
}

class LspProcessExitedError extends Error {
  constructor(serverId, root, exitCode, stderrTail) {
    const stderrSuffix = stderrTail ? `
stderr tail: ${stderrTail}` : "";
    super(`LSP server ${serverId} at ${root} exited with code ${exitCode ?? "null"}${stderrSuffix}`);
    this.serverId = serverId;
    this.root = root;
    this.exitCode = exitCode;
    this.stderrTail = stderrTail;
    this.name = "LspProcessExitedError";
  }
}

class LspRequestTimeoutError extends Error {
  constructor(method, stderrTail) {
    const stderrSuffix = stderrTail ? `
recent stderr: ${stderrTail}` : "";
    super(`LSP request timeout (method: ${method})${stderrSuffix}`);
    this.method = method;
    this.stderrTail = stderrTail;
    this.name = "LspRequestTimeoutError";
  }
}

class LspInvalidPathError extends Error {
  constructor() {
    super(...arguments);
    this.name = "LspInvalidPathError";
  }
}

class LspServerLookupError extends Error {
  constructor(message, lookup) {
    super(message);
    this.lookup = lookup;
    this.name = "LspServerLookupError";
  }
}

class LspServerInitializingError extends Error {
  constructor(originalError) {
    super(`LSP server is still initializing. Please retry in a few seconds. Original error: ${originalError.message}`);
    this.originalError = originalError;
    this.name = "LspServerInitializingError";
  }
}

class LspProcessSpawnError extends Error {
  constructor() {
    super(...arguments);
    this.name = "LspProcessSpawnError";
  }
}

class LspClientRespawnBudgetExceededError extends Error {
  constructor(serverId, root, retryLimit) {
    super(`LSP server ${serverId} at ${root} failed to stay alive; respawn budget exhausted ` + `(${retryLimit} consecutive dead generations). Retrying after the cooldown may succeed.`);
    this.serverId = serverId;
    this.root = root;
    this.retryLimit = retryLimit;
    this.name = "LspClientRespawnBudgetExceededError";
  }
}
function isLspDeadConnectionError(err) {
  return err instanceof LspConnectionClosedError || err instanceof LspProcessExitedError;
}

// ../lsp-core/src/lsp/json-rpc-connection.ts
var HEADER_SEPARATOR = `\r
\r
`;
var PARSE_ERROR = -32700;
var INVALID_REQUEST = -32600;
var METHOD_NOT_FOUND = -32601;
var INTERNAL_ERROR = -32603;

class JsonRpcConnection {
  constructor(reader, writer) {
    this.reader = reader;
    this.writer = writer;
    this.pendingRequests = new Map;
    this.notificationHandlers = new Map;
    this.requestHandlers = new Map;
    this.closeHandlers = [];
    this.errorHandlers = [];
    this.inputBuffer = Buffer.alloc(0);
    this.nextRequestId = 1;
    this.listening = false;
    this.disposed = false;
    this.handleData = (chunk) => {
      const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf8");
      this.inputBuffer = Buffer.concat([this.inputBuffer, chunkBuffer]);
      this.drainInputBuffer();
    };
    this.handleClose = () => {
      for (const handler of this.closeHandlers) {
        handler();
      }
    };
    this.handleStreamError = (error) => {
      this.emitError(error);
    };
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
  async sendRequest(method, params, options = {}) {
    if (this.disposed)
      throw new Error("JSON-RPC connection is disposed");
    const id = this.nextRequestId;
    this.nextRequestId += 1;
    const key = String(id);
    const message = params === undefined ? { jsonrpc: "2.0", id, method } : { jsonrpc: "2.0", id, method, params };
    let requestWritten = false;
    let cancelAfterWrite = false;
    let settled = false;
    const writeCancel = () => this.writeMessage({ jsonrpc: "2.0", method: "$/cancelRequest", params: { id } });
    let rejectAfterCancelWrite;
    const responsePromise = new Promise((resolve, reject) => {
      const cleanup = () => {
        options.signal?.removeEventListener("abort", onAbort);
      };
      const settleCancel = () => {
        if (settled)
          return;
        settled = true;
        this.pendingRequests.delete(key);
        cleanup();
        const rejectCancelled = () => reject(abortError(options.signal));
        rejectAfterCancelWrite = async () => {
          try {
            await writeCancel();
          } catch (error) {
            this.emitError(toError(error));
          }
          rejectCancelled();
        };
        if (!requestWritten) {
          cancelAfterWrite = true;
          return;
        }
        rejectAfterCancelWrite();
      };
      const onAbort = () => settleCancel();
      this.pendingRequests.set(key, {
        resolve(result) {
          settled = true;
          cleanup();
          resolve(result);
        },
        reject(error) {
          settled = true;
          cleanup();
          reject(error);
        },
        cleanup
      });
      if (options.signal?.aborted) {
        settleCancel();
        return;
      }
      options.signal?.addEventListener("abort", onAbort, { once: true });
    });
    if (settled)
      return responsePromise;
    try {
      await this.writeMessage(message);
      requestWritten = true;
      if (cancelAfterWrite)
        await rejectAfterCancelWrite?.();
    } catch (error) {
      if (settled)
        return responsePromise;
      const pending = this.pendingRequests.get(key);
      if (pending) {
        pending.cleanup();
        this.pendingRequests.delete(key);
      }
      throw error;
    }
    return responsePromise;
  }
  pendingRequestCount() {
    return this.pendingRequests.size;
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
      pending.cleanup();
      pending.reject(new Error("JSON-RPC connection disposed"));
    }
    this.pendingRequests.clear();
    this.notificationHandlers.clear();
    this.requestHandlers.clear();
  }
  drainInputBuffer() {
    while (true) {
      const headerEnd = this.inputBuffer.indexOf(HEADER_SEPARATOR);
      if (headerEnd === -1)
        return;
      const headers = this.inputBuffer.subarray(0, headerEnd).toString("ascii");
      const contentLength = parseContentLength(headers);
      if (contentLength === null) {
        this.inputBuffer = Buffer.alloc(0);
        this.emitError(new Error("JSON-RPC message is missing Content-Length header"));
        return;
      }
      const bodyStart = headerEnd + Buffer.byteLength(HEADER_SEPARATOR);
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
    pending.cleanup();
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
      if (error instanceof Error) {
        this.emitError(error);
        return;
      }
      this.emitError(new Error(String(error)));
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
function abortError(signal) {
  const reason = signal?.reason;
  if (reason instanceof Error)
    return reason;
  const error = new Error(typeof reason === "string" ? reason : "LSP request cancelled");
  error.name = "AbortError";
  return error;
}
function parseContentLength(headers) {
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
function guardPipeErrors(stream, pipe) {
  stream.on("error", (error) => {
    if (stream.listenerCount("error") > 1)
      return;
    reportBestEffortCleanupError(`server ${pipe}`, error);
  });
}
function wrap(proc) {
  const exitedPromise = new Promise((resolve) => {
    proc.once("close", (code) => resolve(code ?? 0));
    proc.once("error", () => resolve(1));
  });
  if (!proc.stdin || !proc.stdout || !proc.stderr) {
    throw new LspProcessSpawnError("Spawned process is missing one of stdin/stdout/stderr pipes");
  }
  guardPipeErrors(proc.stdin, "stdin");
  guardPipeErrors(proc.stdout, "stdout");
  guardPipeErrors(proc.stderr, "stderr");
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

// ../lsp-core/src/lsp/transport-protocol.ts
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
  const version = typeof params["version"] === "number" ? params["version"] : undefined;
  return { uri: params["uri"], diagnostics, ...version === undefined ? {} : { version } };
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

// ../lsp-core/src/lsp/transport.ts
class LspClientNotStartedError extends Error {
  constructor(serverId, root) {
    super("LSP client not started");
    this.serverId = serverId;
    this.root = root;
    this.name = "LspClientNotStartedError";
  }
}

class LspClientTransport {
  constructor(root, server, timeouts = {}) {
    this.root = root;
    this.server = server;
    this.proc = null;
    this.connection = null;
    this.stderrBuffer = [];
    this.processExited = false;
    this.diagnosticsStore = new Map;
    this.workspaceApplyEditHandler = null;
    this.diagnosticPullSupported = false;
    this.documentFormattingSupported = false;
    this.requestTimeoutMs = timeouts.requestTimeoutMs ?? REQUEST_TIMEOUT_MS;
    this.initializeTimeoutMs = timeouts.initializeTimeoutMs ?? INIT_TIMEOUT_MS;
    this.timerProvider = timeouts.timerProvider ?? realTimerProvider;
  }
  pid() {
    return this.proc?.pid;
  }
  command() {
    return [...this.server.command];
  }
  setWorkspaceApplyEditHandler(handler) {
    this.workspaceApplyEditHandler = handler;
  }
  hasWorkspaceApplyEditHandler() {
    return this.workspaceApplyEditHandler !== null;
  }
  setDiagnosticPullSupported(supported) {
    this.diagnosticPullSupported = supported;
  }
  isDiagnosticPullSupported() {
    return this.diagnosticPullSupported;
  }
  setDocumentFormattingSupported(supported) {
    this.documentFormattingSupported = supported;
  }
  isDocumentFormattingSupported() {
    return this.documentFormattingSupported;
  }
  handlePublishDiagnostics(params) {
    this.diagnosticsStore.set(params.uri, [...params.diagnostics]);
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
    if (this.proc.exitCode !== null) {
      const stderr = this.stderrBuffer.join(`
`);
      throw new LspProcessExitedError(this.server.id, this.root, this.proc.exitCode, stderr.slice(-2000));
    }
    this.connection = new JsonRpcConnection(this.proc.stdout, this.proc.stdin);
    this.connection.onNotification("textDocument/publishDiagnostics", (params) => {
      const diagnosticsParams = parseDiagnosticsParams(params);
      if (diagnosticsParams?.uri) {
        this.handlePublishDiagnostics(diagnosticsParams);
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
    if (this.workspaceApplyEditHandler) {
      this.connection.onRequest("workspace/applyEdit", this.workspaceApplyEditHandler);
    }
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
      throw new LspClientNotStartedError(this.server.id, this.root);
    if (this.processExited || this.proc && this.proc.exitCode !== null) {
      const stderrTail = this.stderrBuffer.slice(-10).join(`
`);
      throw new LspProcessExitedError(this.server.id, this.root, this.proc?.exitCode ?? null, stderrTail || undefined);
    }
    const options = args[1];
    const timeoutMs = options?.timeoutMs ?? this.requestTimeoutMs;
    const timeoutController = new AbortController;
    const timeoutHandle = this.timerProvider.setTimeout(() => {
      const stderrTail = this.stderrBuffer.slice(-5).join(`
`);
      timeoutController.abort(new LspRequestTimeoutError(method, stderrTail || undefined));
    }, timeoutMs);
    const combinedSignal = combineAbortSignals(options?.signal, timeoutController.signal);
    try {
      const result = args.length === 0 ? await this.connection.sendRequest(method, undefined, { signal: combinedSignal.signal }) : await this.connection.sendRequest(method, args[0], { signal: combinedSignal.signal });
      return result;
    } catch (error) {
      if (this.processExited || this.proc && this.proc.exitCode !== null) {
        throw new LspProcessExitedError(this.server.id, this.root, this.proc?.exitCode ?? null, this.stderrBuffer.slice(-10).join(`
`) || undefined);
      }
      if (this.isConnectionClosedError(error)) {
        throw new LspConnectionClosedError(this.server.id, this.root, error.message);
      }
      throw error;
    } finally {
      this.timerProvider.clearTimeout(timeoutHandle);
      combinedSignal.dispose();
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
        reportBestEffortCleanupError("shutdown request", error instanceof Error ? error : String(error));
      }
      try {
        await this.sendNotification("exit");
      } catch (error) {
        reportBestEffortCleanupError("exit notification", error instanceof Error ? error : String(error));
      }
      try {
        this.connection.dispose();
      } catch (error) {
        reportBestEffortCleanupError("connection dispose", error instanceof Error ? error : String(error));
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
            reportBestEffortCleanupError("hard process kill", error instanceof Error ? error : String(error));
          }
        }
      } catch (error) {
        reportBestEffortCleanupError("process stop", error instanceof Error ? error : String(error));
      }
    }
    this.processExited = true;
    this.diagnosticsStore.clear();
  }
  getStoredDiagnostics(uri) {
    return this.diagnosticsStore.get(uri) ?? [];
  }
}
function combineAbortSignals(primary, secondary) {
  const controller = new AbortController;
  const abortFrom = (signal) => {
    if (!controller.signal.aborted)
      controller.abort(signal.reason);
  };
  const onPrimaryAbort = () => {
    if (primary)
      abortFrom(primary);
  };
  const onSecondaryAbort = () => abortFrom(secondary);
  if (primary?.aborted)
    abortFrom(primary);
  else
    primary?.addEventListener("abort", onPrimaryAbort, { once: true });
  if (secondary.aborted)
    abortFrom(secondary);
  else
    secondary.addEventListener("abort", onSecondaryAbort, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      primary?.removeEventListener("abort", onPrimaryAbort);
      secondary.removeEventListener("abort", onSecondaryAbort);
    }
  };
}

// ../lsp-core/src/lsp/connection.ts
function supportsDiagnosticPull(capabilities) {
  if (capabilities === undefined)
    return false;
  return Object.hasOwn(capabilities, "diagnosticProvider");
}
function supportsDocumentFormatting(capabilities) {
  if (capabilities === undefined)
    return false;
  const provider = capabilities.documentFormattingProvider;
  if (provider === undefined || provider === null || provider === false)
    return false;
  return provider === true || typeof provider === "object";
}

class LspClientConnection extends LspClientTransport {
  async initialize() {
    const rootUri = pathToFileURL(this.root).href;
    const result = await this.sendRequest("initialize", {
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
          formatting: { dynamicRegistration: false },
          rename: {
            prepareSupport: true,
            prepareSupportDefaultBehavior: 1
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
          ...this.hasWorkspaceApplyEditHandler() ? { applyEdit: true } : {},
          workspaceEdit: {
            documentChanges: true,
            resourceOperations: ["create", "rename", "delete"]
          }
        }
      },
      initializationOptions: this.server.initialization
    }, { timeoutMs: this.initializeTimeoutMs });
    this.setDiagnosticPullSupported(supportsDiagnosticPull(result?.capabilities));
    this.setDocumentFormattingSupported(supportsDocumentFormatting(result?.capabilities));
    await this.sendNotification("initialized", {});
    await this.sendNotification("workspace/didChangeConfiguration", {
      settings: { json: { validate: { enable: true } } }
    });
  }
}

// ../lsp-core/src/lsp/workspace-document-state.ts
import { readFileSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL as pathToFileURL2 } from "node:url";

// ../lsp-core/src/lsp/effective-extension.ts
import { basename, extname } from "node:path";
var BASENAME_EXTENSIONS = {
  Dockerfile: ".dockerfile",
  Containerfile: ".dockerfile"
};
function effectiveExtension(filePath) {
  return BASENAME_EXTENSIONS[basename(filePath)] ?? extname(filePath);
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

// ../lsp-core/src/lsp/workspace-document-state.ts
var WATCHED_FILE_BATCH_SIZE = 128;
var DEFAULT_VERSIONLESS_PUBLISH_QUIESCENCE_MS = 250;
function canonicalPath(filePath) {
  const absolute = resolve(filePath);
  try {
    return realpathSync(absolute);
  } catch {
    return absolute;
  }
}
function normalizeDocumentUri(uri) {
  let decoded = uri;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    decoded = uri;
  }
  if (process.platform !== "win32")
    return decoded;
  return decoded.replace(/^(file:\/\/\/)([a-z]):/, (_match, prefix, drive) => `${prefix}${drive.toUpperCase()}:`);
}
function isSameOrDescendant(candidate, parent) {
  const suffix = relative(parent, candidate);
  return suffix === "" || !suffix.startsWith("..") && suffix !== "..";
}
function movedPath(candidate, oldPath, newPath) {
  const suffix = relative(oldPath, candidate);
  return suffix === "" ? newPath : resolve(newPath, suffix);
}

class WorkspaceDocumentState {
  constructor(sendNotification, clearDiagnostics, options = {}) {
    this.sendNotification = sendNotification;
    this.clearDiagnostics = clearDiagnostics;
    this.openDocuments = new Map;
    this.openByUri = new Map;
    this.openPromises = new Map;
    this.timerProvider = options.timerProvider ?? {
      now: options.now ?? (() => Date.now()),
      setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
      clearTimeout: (handle) => clearTimeout(handle)
    };
    this.now = () => this.timerProvider.now();
    this.versionlessPublishQuiescenceMs = options.versionlessPublishQuiescenceMs ?? DEFAULT_VERSIONLESS_PUBLISH_QUIESCENCE_MS;
  }
  async openFile(filePath) {
    const path = canonicalPath(filePath);
    const existingOpen = this.openPromises.get(path);
    if (existingOpen) {
      await existingOpen;
      return this.openFile(path);
    }
    const text = readFileSync(path, "utf-8");
    const existing = this.openDocuments.get(path);
    if (!existing)
      return this.openDocumentSingleFlight(path, text);
    if (existing.text === text)
      return;
    await this.changeDocument(existing, text);
  }
  getVersion(filePath) {
    return this.openDocuments.get(canonicalPath(filePath))?.version;
  }
  getStoredDiagnostics(uri) {
    const state = this.openByUri.get(normalizeDocumentUri(uri));
    if (!state)
      return [];
    return state.lastPublish?.diagnostics ?? state.pullCache?.diagnostics ?? [];
  }
  captureDiagnosticSnapshot(filePath) {
    const state = this.openDocuments.get(canonicalPath(filePath));
    if (!state)
      return null;
    return {
      path: state.path,
      uri: state.uri,
      version: state.version,
      documentGeneration: state.generation,
      publishGeneration: state.publishGeneration
    };
  }
  isCurrentSnapshot(snapshot) {
    const state = this.openDocuments.get(snapshot.path);
    return state !== undefined && state.uri === snapshot.uri && state.version === snapshot.version && state.generation === snapshot.documentGeneration;
  }
  getPullCache(snapshot) {
    const state = this.openByUri.get(normalizeDocumentUri(snapshot.uri));
    if (!state?.pullCache || state.pullCache.documentVersion !== snapshot.version)
      return null;
    return state.pullCache;
  }
  recordPullDiagnostics(snapshot, report) {
    const state = this.openByUri.get(normalizeDocumentUri(snapshot.uri));
    if (!state)
      return;
    state.pullCache = {
      documentVersion: snapshot.version,
      diagnostics: [...report.diagnostics],
      ...report.resultId === undefined ? {} : { resultId: report.resultId }
    };
  }
  recordPublishedDiagnostics(params) {
    const state = this.openByUri.get(normalizeDocumentUri(params.uri));
    if (!state)
      return;
    state.publishGeneration += 1;
    state.lastPublish = {
      diagnostics: [...params.diagnostics],
      publishGeneration: state.publishGeneration,
      documentGenerationAtArrival: state.generation,
      arrivedAt: this.now(),
      ...params.version === undefined ? {} : { version: params.version }
    };
    this.notifyWaiters(state);
  }
  resolvePushDiagnostics(snapshot) {
    const state = this.openByUri.get(normalizeDocumentUri(snapshot.uri));
    if (!state?.lastPublish)
      return { status: "missing" };
    const publish = state.lastPublish;
    if (publish.version !== undefined) {
      return publish.version === snapshot.version ? { status: "ready", diagnostics: publish.diagnostics } : { status: "missing" };
    }
    if (publish.documentGenerationAtArrival < snapshot.documentGeneration)
      return { status: "missing" };
    const readyAt = publish.arrivedAt + this.versionlessPublishQuiescenceMs;
    const waitMs = Math.max(0, readyAt - this.now());
    return waitMs === 0 ? { status: "ready", diagnostics: publish.diagnostics } : { status: "wait", waitMs };
  }
  waitForDiagnosticsActivity(snapshot, timeoutMs) {
    const state = this.openByUri.get(normalizeDocumentUri(snapshot.uri));
    if (!state || timeoutMs <= 0)
      return Promise.resolve();
    if (state.publishGeneration !== snapshot.publishGeneration)
      return Promise.resolve();
    return new Promise((resolveActivity) => {
      let settled = false;
      const finish = () => {
        if (settled)
          return;
        settled = true;
        this.timerProvider.clearTimeout(timer);
        state.waiters.delete(finish);
        resolveActivity();
      };
      const timer = this.timerProvider.setTimeout(finish, timeoutMs);
      if (typeof timer.unref === "function")
        timer.unref();
      state.waiters.add(finish);
    });
  }
  validateVersions(operations) {
    const versions = new Map([...this.openDocuments].map(([path, state]) => [path, state.version]));
    for (const operation of operations) {
      if (operation.kind === "text") {
        const current = versions.get(operation.path);
        if (operation.documentVersion !== null && current !== operation.documentVersion) {
          const observed = current === undefined ? "closed document" : `open document version ${current}`;
          return {
            changeIndex: operation.changeIndex,
            message: `document version ${operation.documentVersion} does not match ${observed} for ${operation.path}`
          };
        }
        if (current !== undefined)
          versions.set(operation.path, current + 1);
        continue;
      }
      if (operation.kind === "rename") {
        const moved = [...versions].filter(([path]) => isSameOrDescendant(path, operation.oldPath));
        for (const [path] of moved)
          versions.delete(path);
        for (const [path] of moved)
          versions.set(movedPath(path, operation.oldPath, operation.newPath), 1);
        continue;
      }
      if (operation.kind === "delete") {
        for (const path of [...versions.keys()]) {
          if (isSameOrDescendant(path, operation.path))
            versions.delete(path);
        }
        continue;
      }
      if (operation.kind === "create" && operation.replaced && versions.has(operation.path)) {
        versions.set(operation.path, 1);
      }
    }
    return null;
  }
  async synchronize(delta) {
    const watched = [];
    for (const mutation of delta.operations)
      await this.synchronizeMutation(mutation, watched);
    for (let index = 0;index < watched.length; index += WATCHED_FILE_BATCH_SIZE) {
      await this.sendNotification("workspace/didChangeWatchedFiles", {
        changes: watched.slice(index, index + WATCHED_FILE_BATCH_SIZE)
      });
    }
  }
  async synchronizeMutation(mutation, watched) {
    if (mutation.kind === "text") {
      const state = this.openDocuments.get(mutation.path);
      if (state)
        await this.changeDocument(state, mutation.afterText);
      else
        watched.push({ uri: pathToFileURL2(mutation.path).href, type: 2 });
      return;
    }
    if (mutation.kind === "create") {
      const state = this.openDocuments.get(mutation.path);
      if (state) {
        await this.closeDocument(state);
        await this.openDocumentSingleFlight(mutation.path, readFileSync(mutation.path, "utf-8"));
      } else {
        watched.push({ uri: pathToFileURL2(mutation.path).href, type: mutation.replaced ? 2 : 1 });
      }
      return;
    }
    if (mutation.kind === "rename") {
      const moved = [...this.openDocuments.values()].filter((state) => isSameOrDescendant(state.path, mutation.oldPath));
      for (const state of moved)
        await this.closeDocument(state);
      for (const state of moved) {
        const path = movedPath(state.path, mutation.oldPath, mutation.newPath);
        await this.openDocumentSingleFlight(path, readFileSync(path, "utf-8"));
      }
      if (moved.length === 0) {
        watched.push({ uri: pathToFileURL2(mutation.oldPath).href, type: 3 });
        watched.push({ uri: pathToFileURL2(mutation.newPath).href, type: 1 });
      }
      return;
    }
    const removed = [...this.openDocuments.values()].filter((state) => isSameOrDescendant(state.path, mutation.path));
    for (const state of removed)
      await this.closeDocument(state);
    if (removed.length === 0)
      watched.push({ uri: pathToFileURL2(mutation.path).href, type: 3 });
  }
  async openDocumentSingleFlight(path, text) {
    const existing = this.openPromises.get(path);
    if (existing)
      return existing;
    const open = (async () => {
      const state = {
        path,
        uri: pathToFileURL2(path).href,
        languageId: getLanguageId(effectiveExtension(path)),
        text,
        version: 1,
        generation: 1,
        publishGeneration: 0,
        waiters: new Set
      };
      this.openDocuments.set(path, state);
      this.openByUri.set(normalizeDocumentUri(state.uri), state);
      this.notifyWaiters(state);
      await this.sendNotification("textDocument/didOpen", {
        textDocument: { uri: state.uri, languageId: state.languageId, version: state.version, text }
      });
    })().finally(() => {
      this.openPromises.delete(path);
    });
    this.openPromises.set(path, open);
    return open;
  }
  async changeDocument(state, text) {
    state.text = text;
    state.version += 1;
    state.generation += 1;
    this.clearDiagnostics(state.uri);
    this.notifyWaiters(state);
    await this.sendNotification("textDocument/didChange", {
      textDocument: { uri: state.uri, version: state.version },
      contentChanges: [{ text }]
    });
    await this.sendNotification("textDocument/didSave", { textDocument: { uri: state.uri }, text });
  }
  async closeDocument(state) {
    this.openDocuments.delete(state.path);
    this.openByUri.delete(normalizeDocumentUri(state.uri));
    this.clearDiagnostics(state.uri);
    this.notifyWaiters(state);
    await this.sendNotification("textDocument/didClose", { textDocument: { uri: state.uri } });
  }
  notifyWaiters(state) {
    for (const waiter of [...state.waiters])
      waiter();
  }
}

// ../lsp-core/src/lsp/workspace-apply-edit-failure.ts
var CONCURRENT_FAILURE_REASON_BY_PHASE = {
  applying: "workspace/applyEdit is already in progress for this workspace mutation",
  settled: "workspace/applyEdit was already handled for this workspace mutation"
};
function workspaceApplyEditConcurrentFailureReason(phase) {
  return CONCURRENT_FAILURE_REASON_BY_PHASE[phase];
}

// ../lsp-core/src/lsp/workspace-edit-commit.ts
import { existsSync as existsSync3, lstatSync as lstatSync2, renameSync, rmSync, writeFileSync } from "node:fs";

// ../lsp-core/src/lsp/workspace-edit-path.ts
import { existsSync as existsSync2, lstatSync, readFileSync as readFileSync2, readdirSync, realpathSync as realpathSync2 } from "node:fs";
import { dirname, isAbsolute, relative as relative2, resolve as resolve2 } from "node:path";
import { fileURLToPath } from "node:url";

class WorkspaceEditPathError extends Error {
  constructor(path, detail) {
    super(`${detail}: ${path}`);
    this.path = path;
    this.detail = detail;
    this.name = "WorkspaceEditPathError";
  }
}
function isPathInsideWorkspace(filePath, workspaceRoot) {
  const relativePath = relative2(workspaceRoot, filePath);
  return relativePath === "" || !relativePath.startsWith("..") && !isAbsolute(relativePath);
}
function canonicalizeMissingPath(filePath) {
  let ancestor = filePath;
  while (!existsSync2(ancestor)) {
    const parent = dirname(ancestor);
    if (parent === ancestor)
      throw new WorkspaceEditPathError(filePath, "no existing ancestor");
    ancestor = parent;
  }
  return resolve2(realpathSync2(ancestor), relative2(ancestor, filePath));
}
function canonicalWorkspaceRoot(workspaceRoot) {
  try {
    const canonical = realpathSync2(resolve2(workspaceRoot));
    if (!lstatSync(canonical).isDirectory()) {
      return { success: false, error: `workspace root is not a directory: ${workspaceRoot}` };
    }
    return {
      success: true,
      path: canonical,
      requestedPath: resolve2(workspaceRoot),
      followedSymbolicLink: existsSync2(resolve2(workspaceRoot)) && lstatSync(resolve2(workspaceRoot)).isSymbolicLink()
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { success: false, error: `workspace root ${workspaceRoot}: ${detail}` };
  }
}
function uriToCanonicalWorkspacePath(uri, workspaceRoot) {
  let requestedPath;
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "file:" || parsed.search !== "" || parsed.hash !== "") {
      return { success: false, error: `non-file URI ${uri}` };
    }
    requestedPath = resolve2(fileURLToPath(parsed));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { success: false, error: `non-file URI ${uri}: ${detail}` };
  }
  try {
    const canonical = existsSync2(requestedPath) ? realpathSync2(requestedPath) : canonicalizeMissingPath(requestedPath);
    if (!isPathInsideWorkspace(canonical, workspaceRoot)) {
      return { success: false, error: `${requestedPath}: outside workspace ${workspaceRoot}` };
    }
    return {
      success: true,
      path: canonical,
      requestedPath,
      followedSymbolicLink: existsSync2(requestedPath) && lstatSync(requestedPath).isSymbolicLink()
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { success: false, error: `${requestedPath}: ${detail}` };
  }
}
function snapshotPath(path, includeChildren) {
  if (!existsSync2(path))
    return { kind: "missing" };
  const stats = lstatSync(path);
  if (stats.isFile())
    return { kind: "file", content: readFileSync2(path, "utf-8") };
  if (stats.isDirectory()) {
    return includeChildren ? { kind: "directory", children: readdirSync(path).sort() } : { kind: "directory" };
  }
  throw new WorkspaceEditPathError(path, "unsupported filesystem entry");
}

// ../lsp-core/src/lsp/workspace-edit-commit.ts
var DEFAULT_IO = {
  writeFile(path, content) {
    writeFileSync(path, content, "utf-8");
  },
  rename(oldPath, newPath) {
    renameSync(oldPath, newPath);
  },
  remove(path, recursive) {
    rmSync(path, { recursive, force: false });
  }
};
function snapshotsEqual(expected, actual) {
  if (expected.kind !== actual.kind)
    return false;
  if (expected.kind === "file" && actual.kind === "file")
    return expected.content === actual.content;
  if (expected.kind === "directory" && actual.kind === "directory" && expected.children !== undefined) {
    return JSON.stringify(expected.children) === JSON.stringify(actual.children);
  }
  return true;
}
function liveSnapshot(path, expected) {
  return snapshotPath(path, expected.kind === "directory" && expected.children !== undefined);
}
function firstOperationIndex(plan) {
  return plan.operations[0]?.changeIndex ?? 0;
}
function failedCommit(plan, failure) {
  const { message, changeIndex, mutations = [], filesModified = [], totalEdits = 0, lateAbort = false } = failure;
  return {
    result: {
      success: false,
      filesModified,
      totalEdits,
      errors: [`change ${changeIndex}: ${message}`],
      failedChange: changeIndex,
      ...lateAbort ? { lateAbort: true } : {}
    },
    delta: mutationDelta(mutations),
    fingerprint: plan.fingerprint
  };
}
function verifySnapshots(plan) {
  for (const [path, expected] of plan.snapshots) {
    let actual;
    try {
      actual = liveSnapshot(path, expected);
    } catch (error) {
      const changeIndex = plan.firstChangeByPath.get(path) ?? firstOperationIndex(plan);
      const detail = error instanceof Error ? error.message : String(error);
      return failedCommit(plan, { message: `cannot verify snapshot for ${path}: ${detail}`, changeIndex });
    }
    if (!snapshotsEqual(expected, actual)) {
      const changeIndex = plan.firstChangeByPath.get(path) ?? firstOperationIndex(plan);
      return failedCommit(plan, { message: `workspace state changed before commit: ${path}`, changeIndex });
    }
  }
  return null;
}
function addModifiedPath(paths, path) {
  if (!paths.includes(path))
    paths.push(path);
}
function reportedPath(plan, path) {
  return plan.reportedPathByCanonical.get(path) ?? path;
}
function changedPathsForMutation(mutation) {
  return mutation.kind === "rename" ? [mutation.oldPath, mutation.newPath] : [mutation.path];
}
function mutationDelta(operations) {
  const changedPaths = new Set;
  for (const operation of operations) {
    for (const path of changedPathsForMutation(operation))
      changedPaths.add(path);
  }
  return { operations, changedPaths: [...changedPaths].sort() };
}
function resolveIo(overrides) {
  return {
    writeFile: overrides?.writeFile ?? DEFAULT_IO.writeFile,
    rename: overrides?.rename ?? DEFAULT_IO.rename,
    remove: overrides?.remove ?? DEFAULT_IO.remove
  };
}
function commitOperation(context, operation) {
  const { plan, io, accumulator } = context;
  if (operation.kind === "noop")
    return;
  if (operation.kind === "text") {
    io.writeFile(operation.path, operation.afterText);
    accumulator.mutations.push({
      kind: "text",
      path: operation.path,
      beforeText: operation.beforeText,
      afterText: operation.afterText
    });
    addModifiedPath(accumulator.filesModified, reportedPath(plan, operation.path));
    accumulator.totalEdits += operation.editCount;
    return;
  }
  if (operation.kind === "create") {
    io.writeFile(operation.path, "");
    accumulator.mutations.push({ kind: "create", path: operation.path, replaced: operation.replaced });
    addModifiedPath(accumulator.filesModified, reportedPath(plan, operation.path));
    return;
  }
  if (operation.kind === "rename") {
    if (operation.replaceDestination) {
      const targetKind = existsSync3(operation.newPath) && lstatSync2(operation.newPath).isDirectory() ? "directory" : "file";
      io.remove(operation.newPath, targetKind === "directory");
      accumulator.mutations.push({ kind: "delete", path: operation.newPath, targetKind });
      addModifiedPath(accumulator.filesModified, reportedPath(plan, operation.newPath));
    }
    io.rename(operation.oldPath, operation.newPath);
    accumulator.mutations.push({
      kind: "rename",
      oldPath: operation.oldPath,
      newPath: operation.newPath,
      sourceKind: operation.sourceKind
    });
    addModifiedPath(accumulator.filesModified, reportedPath(plan, operation.newPath));
    return;
  }
  io.remove(operation.path, operation.recursive);
  accumulator.mutations.push({
    kind: "delete",
    path: operation.path,
    targetKind: operation.targetKind
  });
  addModifiedPath(accumulator.filesModified, reportedPath(plan, operation.path));
}
function commitWorkspaceEditPlan(plan, options = {}) {
  if (options.signal?.aborted) {
    return failedCommit(plan, { message: "cancelled before commit", changeIndex: firstOperationIndex(plan) });
  }
  const stale = verifySnapshots(plan);
  if (stale)
    return stale;
  if (options.signal?.aborted) {
    return failedCommit(plan, { message: "cancelled before commit", changeIndex: firstOperationIndex(plan) });
  }
  const io = resolveIo(options.io);
  const accumulator = { mutations: [], filesModified: [], totalEdits: 0 };
  const context = { plan, io, accumulator };
  let lateAbort = false;
  for (const operation of plan.operations) {
    try {
      commitOperation(context, operation);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return failedCommit(plan, {
        message: `I/O failure during ${operation.kind}: ${detail}`,
        changeIndex: operation.changeIndex,
        mutations: accumulator.mutations,
        filesModified: accumulator.filesModified,
        totalEdits: accumulator.totalEdits,
        lateAbort: lateAbort || options.signal?.aborted === true
      });
    }
    if (options.signal?.aborted)
      lateAbort = true;
  }
  const result = {
    success: true,
    filesModified: accumulator.filesModified,
    totalEdits: accumulator.totalEdits,
    errors: [],
    ...lateAbort ? { lateAbort: true } : {}
  };
  return { result, delta: mutationDelta(accumulator.mutations), fingerprint: plan.fingerprint };
}

// ../lsp-core/src/lsp/workspace-edit-fingerprint.ts
import { createHash } from "node:crypto";
function canonicalFingerprint(operations) {
  const canonical = operations.map((operation) => {
    switch (operation.kind) {
      case "text":
        return {
          kind: operation.kind,
          changeIndex: operation.changeIndex,
          path: operation.path,
          edits: operation.edits,
          version: operation.version
        };
      case "rename":
        return {
          kind: operation.kind,
          changeIndex: operation.changeIndex,
          oldPath: operation.oldPath,
          newPath: operation.newPath,
          overwrite: operation.overwrite,
          ignoreIfExists: operation.ignoreIfExists
        };
      case "create":
        return {
          kind: operation.kind,
          changeIndex: operation.changeIndex,
          path: operation.path,
          overwrite: operation.overwrite,
          ignoreIfExists: operation.ignoreIfExists
        };
      case "delete":
        return {
          kind: operation.kind,
          changeIndex: operation.changeIndex,
          path: operation.path,
          recursive: operation.recursive,
          ignoreIfNotExists: operation.ignoreIfNotExists
        };
    }
  });
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

// ../lsp-core/src/lsp/workspace-edit-types.ts
class WorkspaceEditValidationError extends Error {
  constructor(changeIndex, detail) {
    super(`change ${changeIndex}: ${detail}`);
    this.changeIndex = changeIndex;
    this.detail = detail;
    this.name = "WorkspaceEditValidationError";
  }
}

// ../lsp-core/src/lsp/workspace-edit-parse-helpers.ts
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parsePosition(value) {
  if (!isRecord2(value) || typeof value["line"] !== "number" || typeof value["character"] !== "number") {
    return null;
  }
  return { line: value["line"], character: value["character"] };
}
function parseRange(value) {
  if (!isRecord2(value))
    return null;
  const start = parsePosition(value["start"]);
  const end = parsePosition(value["end"]);
  return start && end ? { start, end } : null;
}
function parseTextEdits(value, changeIndex) {
  if (!Array.isArray(value)) {
    throw new WorkspaceEditValidationError(changeIndex, "text edits must be an array");
  }
  const edits = [];
  for (const candidate of value) {
    if (!isRecord2(candidate) || typeof candidate["newText"] !== "string") {
      throw new WorkspaceEditValidationError(changeIndex, "text edit requires range and newText");
    }
    if ("annotationId" in candidate) {
      throw new WorkspaceEditValidationError(changeIndex, "annotated text edits are unsupported");
    }
    const range = parseRange(candidate["range"]);
    if (!range)
      throw new WorkspaceEditValidationError(changeIndex, "text edit range is malformed");
    edits.push({ range, newText: candidate["newText"] });
  }
  return edits;
}
function parseBooleanOption(options, key, changeIndex) {
  const value = options[key];
  if (value === undefined)
    return false;
  if (typeof value !== "boolean") {
    throw new WorkspaceEditValidationError(changeIndex, `${key} must be boolean`);
  }
  return value;
}
function parseOptions(value, allowed, changeIndex) {
  if (value === undefined)
    return {};
  if (!isRecord2(value))
    throw new WorkspaceEditValidationError(changeIndex, "resource options must be an object");
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key))
      throw new WorkspaceEditValidationError(changeIndex, `unsupported resource option ${key}`);
  }
  const parsed = {};
  for (const key of allowed)
    parsed[key] = parseBooleanOption(value, key, changeIndex);
  return parsed;
}

// ../lsp-core/src/lsp/workspace-edit-resource-parser.ts
function parseResourceChange(input) {
  const kind = input.change["kind"];
  if (kind === "create" || kind === "delete") {
    parseSinglePathResource(input, kind);
    return;
  }
  if (kind !== "rename") {
    throw new WorkspaceEditValidationError(input.changeIndex, `unsupported resource operation ${String(kind)}`);
  }
  parseRename(input);
}
function parseSinglePathResource(input, kind) {
  const { change, changeIndex, workspaceRoot, target } = input;
  if (typeof change["uri"] !== "string")
    throw new WorkspaceEditValidationError(changeIndex, `${kind}.uri is required`);
  const resolvedPath = uriToCanonicalWorkspacePath(change["uri"], workspaceRoot);
  if (!resolvedPath.success) {
    target.failures.push({ changeIndex, message: resolvedPath.error });
    return;
  }
  if (kind === "create") {
    const options = parseOptions(change["options"], ["overwrite", "ignoreIfExists"], changeIndex);
    target.operations.push({
      kind,
      changeIndex,
      path: resolvedPath.path,
      reportedPath: resolvedPath.requestedPath,
      overwrite: options["overwrite"] ?? false,
      ignoreIfExists: options["ignoreIfExists"] ?? false,
      followedSymbolicLink: resolvedPath.followedSymbolicLink
    });
    return;
  }
  const options = parseOptions(change["options"], ["recursive", "ignoreIfNotExists"], changeIndex);
  target.operations.push({
    kind,
    changeIndex,
    path: resolvedPath.path,
    reportedPath: resolvedPath.requestedPath,
    recursive: options["recursive"] ?? false,
    ignoreIfNotExists: options["ignoreIfNotExists"] ?? false,
    followedSymbolicLink: resolvedPath.followedSymbolicLink
  });
}
function parseRename(input) {
  const { change, changeIndex, workspaceRoot, target } = input;
  if (typeof change["oldUri"] !== "string" || typeof change["newUri"] !== "string") {
    throw new WorkspaceEditValidationError(changeIndex, "rename requires oldUri and newUri");
  }
  const oldPath = uriToCanonicalWorkspacePath(change["oldUri"], workspaceRoot);
  const newPath = uriToCanonicalWorkspacePath(change["newUri"], workspaceRoot);
  if (!oldPath.success || !newPath.success) {
    target.failures.push({
      changeIndex,
      message: !oldPath.success ? oldPath.error : !newPath.success ? newPath.error : "invalid rename path"
    });
    return;
  }
  const options = parseOptions(change["options"], ["overwrite", "ignoreIfExists"], changeIndex);
  target.operations.push({
    kind: "rename",
    changeIndex,
    oldPath: oldPath.path,
    newPath: newPath.path,
    reportedOldPath: oldPath.requestedPath,
    reportedNewPath: newPath.requestedPath,
    overwrite: options["overwrite"] ?? false,
    ignoreIfExists: options["ignoreIfExists"] ?? false,
    followedSymbolicLink: oldPath.followedSymbolicLink || newPath.followedSymbolicLink
  });
}

// ../lsp-core/src/lsp/workspace-edit-parser.ts
function failureResult(failures) {
  const sorted = [...failures].sort((left, right) => left.changeIndex - right.changeIndex);
  const first = sorted[0];
  return {
    success: false,
    filesModified: [],
    totalEdits: 0,
    errors: sorted.map((failure) => `change ${failure.changeIndex}: ${failure.message}`),
    ...first ? { failedChange: first.changeIndex } : {}
  };
}
function parseWorkspaceEdit(edit, workspaceRoot) {
  if (!isRecord2(edit))
    return { operations: [], failures: [{ changeIndex: 0, message: "No edit provided" }] };
  if (edit["changeAnnotations"] !== undefined) {
    return { operations: [], failures: [{ changeIndex: 0, message: "change annotations are unsupported" }] };
  }
  const hasChanges = edit["changes"] !== undefined;
  const hasDocumentChanges = edit["documentChanges"] !== undefined;
  if (hasChanges && hasDocumentChanges) {
    return {
      operations: [],
      failures: [{ changeIndex: 0, message: "changes and documentChanges cannot be combined" }]
    };
  }
  const target = { operations: [], failures: [] };
  if (hasChanges)
    return parseChanges(edit["changes"], workspaceRoot, target);
  return parseDocumentChanges(edit["documentChanges"], workspaceRoot, target);
}
function parseChanges(value, workspaceRoot, target) {
  if (!isRecord2(value))
    return { ...target, failures: [{ changeIndex: 0, message: "changes must be an object" }] };
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  for (const [changeIndex, [uri, rawEdits]] of entries.entries()) {
    const resolvedPath = uriToCanonicalWorkspacePath(uri, workspaceRoot);
    if (!resolvedPath.success) {
      target.failures.push({ changeIndex, message: resolvedPath.error });
      continue;
    }
    try {
      target.operations.push({
        kind: "text",
        changeIndex,
        path: resolvedPath.path,
        reportedPath: resolvedPath.requestedPath,
        edits: parseTextEdits(rawEdits, changeIndex),
        version: null
      });
    } catch (error) {
      if (error instanceof WorkspaceEditValidationError) {
        target.failures.push({ changeIndex, message: error.detail });
        continue;
      }
      throw error;
    }
  }
  return target;
}
function parseDocumentChanges(value, workspaceRoot, target) {
  if (value === undefined)
    return target;
  if (!Array.isArray(value)) {
    return { ...target, failures: [{ changeIndex: 0, message: "documentChanges must be an array" }] };
  }
  for (const [changeIndex, change] of value.entries()) {
    try {
      parseDocumentChange({ change, changeIndex, workspaceRoot, target });
    } catch (error) {
      if (error instanceof WorkspaceEditValidationError) {
        target.failures.push({ changeIndex, message: error.detail });
        continue;
      }
      throw error;
    }
  }
  return target;
}
function parseDocumentChange(input) {
  const { change, changeIndex, workspaceRoot, target } = input;
  if (!isRecord2(change))
    throw new WorkspaceEditValidationError(changeIndex, "document change must be an object");
  if ("annotationId" in change) {
    throw new WorkspaceEditValidationError(changeIndex, "annotated resource operations are unsupported");
  }
  if (typeof change["kind"] === "string") {
    parseResourceChange({ change, changeIndex, workspaceRoot, target });
    return;
  }
  const identifier = change["textDocument"];
  if (!isRecord2(identifier) || typeof identifier["uri"] !== "string") {
    throw new WorkspaceEditValidationError(changeIndex, "textDocument.uri is required");
  }
  const version = identifier["version"];
  if (version !== null && (!Number.isInteger(version) || typeof version !== "number" || version < 0)) {
    throw new WorkspaceEditValidationError(changeIndex, "document version must be null or a non-negative integer");
  }
  const resolvedPath = uriToCanonicalWorkspacePath(identifier["uri"], workspaceRoot);
  if (!resolvedPath.success) {
    target.failures.push({ changeIndex, message: resolvedPath.error });
    return;
  }
  target.operations.push({
    kind: "text",
    changeIndex,
    path: resolvedPath.path,
    reportedPath: resolvedPath.requestedPath,
    edits: parseTextEdits(change["edits"], changeIndex),
    version
  });
}

// ../lsp-core/src/lsp/workspace-edit-simulation.ts
import { dirname as dirname2, relative as relative3, resolve as resolve3 } from "node:path";

// ../lsp-core/src/lsp/workspace-edit-text.ts
function comparePosition(left, right) {
  return left.line === right.line ? left.character - right.character : left.line - right.line;
}
function positionsEqual(left, right) {
  return left.line === right.line && left.character === right.character;
}
function rangesEqual(left, right) {
  return positionsEqual(left.start, right.start) && positionsEqual(left.end, right.end);
}
function isEmptyRange(range) {
  return positionsEqual(range.start, range.end);
}
function formatRange(range) {
  return `${range.start.line + 1}:${range.start.character + 1}-${range.end.line + 1}:${range.end.character + 1}`;
}
function validatePosition(position, label, context) {
  const { lines, changeIndex } = context;
  if (!Number.isInteger(position.line) || !Number.isInteger(position.character)) {
    throw new WorkspaceEditValidationError(changeIndex, `${label} position must use integer line and character`);
  }
  if (position.line < 0 || position.character < 0) {
    throw new WorkspaceEditValidationError(changeIndex, `${label} position cannot be negative`);
  }
  const line = lines[position.line];
  if (line === undefined) {
    throw new WorkspaceEditValidationError(changeIndex, `${label} line ${position.line} is outside the document`);
  }
  if (position.character > line.length) {
    throw new WorkspaceEditValidationError(changeIndex, `${label} character ${position.character} is outside line ${position.line}`);
  }
}
function validateRange(range, lines, changeIndex) {
  const context = { lines, changeIndex };
  validatePosition(range.start, "start", context);
  validatePosition(range.end, "end", context);
  if (comparePosition(range.start, range.end) > 0) {
    throw new WorkspaceEditValidationError(changeIndex, `range ${formatRange(range)} ends before it starts`);
  }
}
function sortAndDeduplicate(edits) {
  const sorted = edits.map((edit, index) => ({ edit, index })).sort((left, right) => {
    const positionOrder = comparePosition(right.edit.range.start, left.edit.range.start);
    return positionOrder === 0 ? right.index - left.index : positionOrder;
  });
  const unique = [];
  for (const entry of sorted) {
    const previous = unique.at(-1);
    if (previous !== undefined && !isEmptyRange(entry.edit.range) && rangesEqual(previous.range, entry.edit.range) && previous.newText === entry.edit.newText) {
      continue;
    }
    unique.push(entry.edit);
  }
  return unique;
}
function validateNoOverlap(edits, changeIndex) {
  for (let index = 0;index < edits.length - 1; index += 1) {
    const later = edits[index];
    const earlier = edits[index + 1];
    if (later === undefined || earlier === undefined)
      continue;
    if (comparePosition(earlier.range.end, later.range.start) > 0) {
      throw new WorkspaceEditValidationError(changeIndex, `overlapping edits ${formatRange(earlier.range)} and ${formatRange(later.range)}`);
    }
  }
}
function applyNormalizedTextEdits(content, edits) {
  const lines = content.split(`
`);
  for (const edit of edits) {
    const { start, end } = edit.range;
    const startLine = lines[start.line];
    const endLine = lines[end.line];
    if (startLine === undefined || endLine === undefined)
      continue;
    const replacement = startLine.slice(0, start.character) + edit.newText + endLine.slice(end.character);
    lines.splice(start.line, end.line - start.line + 1, ...replacement.split(`
`));
  }
  return lines.join(`
`);
}
function normalizeTextEdits(content, edits, changeIndex) {
  const lines = content.split(`
`);
  for (const edit of edits) {
    validateRange(edit.range, lines, changeIndex);
  }
  const normalized = sortAndDeduplicate(edits);
  validateNoOverlap(normalized, changeIndex);
  return { edits: normalized, text: applyNormalizedTextEdits(content, normalized) };
}

// ../lsp-core/src/lsp/workspace-edit-simulation.ts
function isSameOrDescendant2(candidate, parent) {
  const relativePath = relative3(parent, candidate);
  return relativePath === "" || !relativePath.startsWith("..") && relativePath !== "..";
}
function removeVirtualSubtree(virtual, path) {
  for (const candidate of [...virtual.keys()]) {
    if (isSameOrDescendant2(candidate, path))
      virtual.delete(candidate);
  }
  virtual.set(path, { kind: "missing" });
}
function moveVirtualSubtree(virtual, oldPath, newPath) {
  const moved = [...virtual.entries()].filter(([candidate]) => isSameOrDescendant2(candidate, oldPath));
  removeVirtualSubtree(virtual, oldPath);
  removeVirtualSubtree(virtual, newPath);
  for (const [candidate, entry] of moved) {
    const suffix = relative3(oldPath, candidate);
    virtual.set(suffix === "" ? newPath : resolve3(newPath, suffix), entry);
  }
}
function virtualDirectoryHasChildren(virtual, path) {
  for (const [candidate, entry] of virtual) {
    if (candidate !== path && entry.kind !== "missing" && isSameOrDescendant2(candidate, path))
      return true;
  }
  return false;
}
function requireVirtualParent(virtual, path, changeIndex) {
  if (virtual.get(dirname2(path))?.kind !== "directory") {
    throw new WorkspaceEditValidationError(changeIndex, `parent directory does not exist for ${path}`);
  }
}
function simulateOperations(parsed, snapshots) {
  const virtual = new Map(snapshots);
  const planned = [];
  const failures = [];
  for (const operation of parsed) {
    try {
      planned.push(simulateOperation(operation, virtual));
    } catch (error) {
      if (error instanceof WorkspaceEditValidationError) {
        failures.push({ changeIndex: operation.changeIndex, message: error.detail });
        continue;
      }
      throw error;
    }
  }
  return { operations: planned, failures };
}
function simulateOperation(operation, virtual) {
  switch (operation.kind) {
    case "text":
      return simulateText(operation, virtual);
    case "create":
      return simulateCreate(operation, virtual);
    case "rename":
      return simulateRename(operation, virtual);
    case "delete":
      return simulateDelete(operation, virtual);
  }
}
function rejectSymbolicLink(operation) {
  if (operation.followedSymbolicLink) {
    throw new WorkspaceEditValidationError(operation.changeIndex, "resource operations through symbolic links are unsupported");
  }
}
function simulateText(operation, virtual) {
  const entry = virtual.get(operation.path);
  if (entry?.kind !== "file")
    throw new WorkspaceEditValidationError(operation.changeIndex, `${operation.path} is not a file`);
  const normalized = normalizeTextEdits(entry.content, operation.edits, operation.changeIndex);
  virtual.set(operation.path, { kind: "file", content: normalized.text });
  return {
    kind: "text",
    changeIndex: operation.changeIndex,
    path: operation.path,
    beforeText: entry.content,
    afterText: normalized.text,
    editCount: normalized.edits.length,
    documentVersion: operation.version
  };
}
function simulateCreate(operation, virtual) {
  rejectSymbolicLink(operation);
  requireVirtualParent(virtual, operation.path, operation.changeIndex);
  const target = virtual.get(operation.path) ?? { kind: "missing" };
  if (target.kind !== "missing") {
    if (operation.overwrite && target.kind === "file") {
      virtual.set(operation.path, { kind: "file", content: "" });
      return { kind: "create", changeIndex: operation.changeIndex, path: operation.path, replaced: true };
    }
    if (operation.ignoreIfExists)
      return { kind: "noop", changeIndex: operation.changeIndex };
    throw new WorkspaceEditValidationError(operation.changeIndex, `create target already exists: ${operation.path}`);
  }
  virtual.set(operation.path, { kind: "file", content: "" });
  return { kind: "create", changeIndex: operation.changeIndex, path: operation.path, replaced: false };
}
function simulateRename(operation, virtual) {
  rejectSymbolicLink(operation);
  const source = virtual.get(operation.oldPath) ?? { kind: "missing" };
  if (source.kind === "missing") {
    throw new WorkspaceEditValidationError(operation.changeIndex, `rename source does not exist: ${operation.oldPath}`);
  }
  if (operation.oldPath === operation.newPath)
    return { kind: "noop", changeIndex: operation.changeIndex };
  if (isSameOrDescendant2(operation.newPath, operation.oldPath)) {
    throw new WorkspaceEditValidationError(operation.changeIndex, "cannot rename a path into its own subtree");
  }
  requireVirtualParent(virtual, operation.newPath, operation.changeIndex);
  const destination = virtual.get(operation.newPath) ?? { kind: "missing" };
  if (destination.kind !== "missing" && !operation.overwrite) {
    if (operation.ignoreIfExists)
      return { kind: "noop", changeIndex: operation.changeIndex };
    throw new WorkspaceEditValidationError(operation.changeIndex, `rename target already exists: ${operation.newPath}`);
  }
  moveVirtualSubtree(virtual, operation.oldPath, operation.newPath);
  return {
    kind: "rename",
    changeIndex: operation.changeIndex,
    oldPath: operation.oldPath,
    newPath: operation.newPath,
    sourceKind: source.kind,
    replaceDestination: destination.kind !== "missing"
  };
}
function simulateDelete(operation, virtual) {
  rejectSymbolicLink(operation);
  const target = virtual.get(operation.path) ?? { kind: "missing" };
  if (target.kind === "missing") {
    if (operation.ignoreIfNotExists)
      return { kind: "noop", changeIndex: operation.changeIndex };
    throw new WorkspaceEditValidationError(operation.changeIndex, `delete target does not exist: ${operation.path}`);
  }
  if (target.kind === "directory" && !operation.recursive && virtualDirectoryHasChildren(virtual, operation.path)) {
    throw new WorkspaceEditValidationError(operation.changeIndex, `directory is not empty: ${operation.path}`);
  }
  removeVirtualSubtree(virtual, operation.path);
  return {
    kind: "delete",
    changeIndex: operation.changeIndex,
    path: operation.path,
    targetKind: target.kind,
    recursive: operation.recursive
  };
}

// ../lsp-core/src/lsp/workspace-edit-snapshot.ts
import { existsSync as existsSync4, lstatSync as lstatSync3, readdirSync as readdirSync2 } from "node:fs";
import { dirname as dirname3, resolve as resolve4 } from "node:path";
class WorkspaceSnapshotBuilder {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.snapshots = new Map;
  }
  build(operations) {
    this.add(this.workspaceRoot, false);
    for (const operation of operations) {
      switch (operation.kind) {
        case "rename":
          this.add(operation.oldPath, true);
          this.add(operation.newPath, true);
          break;
        case "delete":
          this.add(operation.path, true);
          break;
        case "text":
        case "create":
          this.add(operation.path, false);
          break;
      }
    }
    return this.snapshots;
  }
  add(path, includeChildren) {
    let candidate = path;
    while (true) {
      const existing = this.snapshots.get(candidate);
      if (existing === undefined || includeChildren && existing.kind === "directory" && existing.children === undefined) {
        this.snapshots.set(candidate, snapshotPath(candidate, includeChildren && candidate === path));
      }
      if (candidate === this.workspaceRoot)
        break;
      candidate = dirname3(candidate);
    }
    if (!includeChildren || !existsSync4(path) || !lstatSync3(path).isDirectory())
      return;
    for (const child of readdirSync2(path))
      this.add(resolve4(path, child), true);
  }
}
function snapshotOperations(operations, workspaceRoot) {
  return new WorkspaceSnapshotBuilder(workspaceRoot).build(operations);
}

// ../lsp-core/src/lsp/workspace-edit-plan.ts
class PlanPathIndex {
  constructor() {
    this.firstChangeByPath = new Map;
    this.reportedPathByCanonical = new Map;
  }
  build(operations) {
    for (const operation of operations) {
      switch (operation.kind) {
        case "rename":
          this.add(operation.oldPath, operation.reportedOldPath, operation.changeIndex);
          this.add(operation.newPath, operation.reportedNewPath, operation.changeIndex);
          break;
        case "text":
        case "create":
        case "delete":
          this.add(operation.path, operation.reportedPath, operation.changeIndex);
          break;
      }
    }
  }
  add(path, reportedPath, changeIndex) {
    if (!this.firstChangeByPath.has(path))
      this.firstChangeByPath.set(path, changeIndex);
    if (!this.reportedPathByCanonical.has(path))
      this.reportedPathByCanonical.set(path, reportedPath);
  }
}
function fingerprintWorkspaceEdit(edit, workspaceRoot) {
  const root = canonicalWorkspaceRoot(workspaceRoot);
  if (!root.success)
    return { success: false, result: failureResult([{ changeIndex: 0, message: root.error }]) };
  const parsed = parseWorkspaceEdit(edit, root.path);
  if (parsed.failures.length > 0)
    return { success: false, result: failureResult(parsed.failures) };
  return { success: true, fingerprint: canonicalFingerprint(parsed.operations) };
}
function planWorkspaceEdit(edit, workspaceRoot) {
  const root = canonicalWorkspaceRoot(workspaceRoot);
  if (!root.success)
    return { success: false, result: failureResult([{ changeIndex: 0, message: root.error }]) };
  const parsed = parseWorkspaceEdit(edit, root.path);
  if (parsed.failures.length > 0)
    return { success: false, result: failureResult(parsed.failures) };
  let snapshots;
  try {
    snapshots = snapshotOperations(parsed.operations, root.path);
  } catch (error) {
    return {
      success: false,
      result: failureResult([{ changeIndex: 0, message: error instanceof Error ? error.message : String(error) }])
    };
  }
  const simulated = simulateOperations(parsed.operations, snapshots);
  if (simulated.failures.length > 0)
    return { success: false, result: failureResult(simulated.failures) };
  const paths = new PlanPathIndex;
  paths.build(parsed.operations);
  const plan = {
    workspaceRoot: root.path,
    operations: simulated.operations,
    snapshots,
    firstChangeByPath: paths.firstChangeByPath,
    reportedPathByCanonical: paths.reportedPathByCanonical,
    fingerprint: canonicalFingerprint(parsed.operations)
  };
  return { success: true, plan };
}

// ../lsp-core/src/lsp/workspace-mutation-controller.ts
function failure(message, failedChange, base) {
  return {
    success: false,
    filesModified: base?.filesModified ?? [],
    totalEdits: base?.totalEdits ?? 0,
    errors: [message],
    ...failedChange === undefined ? {} : { failedChange },
    ...base?.lateAbort ? { lateAbort: true } : {}
  };
}
function responseFor(result) {
  if (result.success)
    return { applied: true };
  return {
    applied: false,
    failureReason: result.errors[0] ?? "workspace edit failed",
    ...result.failedChange === undefined ? {} : { failedChange: result.failedChange }
  };
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class WorkspaceMutationController {
  constructor(workspaceRoot, documents) {
    this.workspaceRoot = workspaceRoot;
    this.documents = documents;
    this.activeLease = null;
    this.nextLeaseId = 1;
  }
  setIo(io) {
    this.io = io;
  }
  acquire(signal) {
    if (this.activeLease)
      return { success: false, result: failure("workspace mutation is already in progress") };
    if (signal?.aborted)
      return { success: false, result: failure("cancelled before mutating request") };
    const lease = {
      id: this.nextLeaseId,
      phase: "idle",
      ...signal === undefined ? {} : { signal }
    };
    this.nextLeaseId += 1;
    this.activeLease = lease;
    return { success: true, lease };
  }
  release(lease) {
    if (this.activeLease?.id !== lease.id)
      return;
    this.activeLease.phase = "sealed";
    this.activeLease = null;
  }
  isBeforeCommit(lease) {
    return this.activeLease?.id === lease.id && this.activeLease.phase === "idle";
  }
  async handleApplyEdit(params) {
    const lease = this.activeLease;
    if (!lease)
      return { applied: false, failureReason: "workspace/applyEdit requires an active workspace mutation" };
    if (lease.phase !== "idle") {
      return {
        applied: false,
        failureReason: workspaceApplyEditConcurrentFailureReason(lease.phase === "applying" ? "applying" : "settled")
      };
    }
    lease.phase = "applying";
    lease.applyCompletion = new Promise((resolve) => {
      lease.resolveApply = resolve;
    });
    const edit = isRecord3(params) ? params["edit"] : undefined;
    const record = edit === undefined ? { fingerprint: null, result: failure("workspace/applyEdit params.edit is required", 0) } : await this.applyEdit(edit, lease);
    lease.serverApply = record;
    lease.phase = "settled";
    lease.resolveApply?.();
    return responseFor(record.result);
  }
  async reconcileRename(leaseToken, edit) {
    const lease = this.requireActiveLease(leaseToken);
    if (!lease)
      return { edit, apply: failure("workspace mutation lease ended before rename reconciliation") };
    if (lease.phase === "applying")
      await lease.applyCompletion;
    if (lease.serverApply)
      return this.reconcileServerApply(lease.serverApply, edit);
    lease.phase = "sealed";
    if (!edit)
      return { edit, apply: failure("No edit provided") };
    const applied = await this.applyEdit(edit, lease);
    return { edit, apply: applied.result };
  }
  reconcileServerApply(record, edit) {
    if (!edit)
      return { edit, apply: record.result };
    const fingerprint = fingerprintWorkspaceEdit(edit, this.workspaceRoot);
    if (fingerprint.success && record.fingerprint !== null && fingerprint.fingerprint === record.fingerprint) {
      return { edit, apply: record.result };
    }
    return {
      edit,
      apply: failure("rename result conflicts with server-applied workspace edit", 0, record.result)
    };
  }
  async applyEdit(edit, lease) {
    const planned = planWorkspaceEdit(edit, this.workspaceRoot);
    if (!planned.success)
      return { fingerprint: null, result: planned.result };
    const versionFailure = this.documents.validateVersions(planned.plan.operations);
    if (versionFailure) {
      return {
        fingerprint: planned.plan.fingerprint,
        result: failure(versionFailure.message, versionFailure.changeIndex)
      };
    }
    const commit = commitWorkspaceEditPlan(planned.plan, {
      ...lease.signal === undefined ? {} : { signal: lease.signal },
      ...this.io === undefined ? {} : { io: this.io }
    });
    let result = commit.result;
    if (commit.delta.operations.length > 0) {
      try {
        await this.documents.synchronize(commit.delta);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result = failure(`document synchronization failed after filesystem commit: ${message}`, undefined, result);
      }
    }
    if (lease.signal?.aborted && !result.lateAbort)
      result = { ...result, lateAbort: true };
    return { fingerprint: planned.plan.fingerprint, result };
  }
  requireActiveLease(lease) {
    return this.activeLease?.id === lease.id ? this.activeLease : null;
  }
}

// ../lsp-core/src/lsp/client.ts
var DIAGNOSTICS_FRESHNESS_TIMEOUT_MS = 3000;
var VERSIONLESS_PUBLISH_QUIESCENCE_MS = 250;

class LspClient extends LspClientConnection {
  constructor(root, server, options = {}) {
    super(root, server, options);
    this.diagnosticPullErrors = [];
    this.diagnosticsFreshnessTimeoutMs = options.diagnosticsFreshnessTimeoutMs ?? DIAGNOSTICS_FRESHNESS_TIMEOUT_MS;
    this.documents = new WorkspaceDocumentState((method, params) => this.sendNotification(method, params), (uri) => this.diagnosticsStore.delete(uri), {
      timerProvider: this.timerProvider,
      versionlessPublishQuiescenceMs: options.versionlessPublishQuiescenceMs ?? VERSIONLESS_PUBLISH_QUIESCENCE_MS
    });
    this.workspaceMutations = new WorkspaceMutationController(root, this.documents);
    this.setWorkspaceApplyEditHandler((params) => this.workspaceMutations.handleApplyEdit(params));
  }
  getDiagnosticPullErrors() {
    return this.diagnosticPullErrors;
  }
  async openFile(filePath) {
    const absPath = this.resolveWorkspacePath(filePath);
    await this.documents.openFile(absPath);
  }
  getOpenDocumentVersion(filePath) {
    return this.documents.getVersion(this.resolveWorkspacePath(filePath));
  }
  getStoredDiagnostics(uri) {
    return [...this.documents.getStoredDiagnostics(uri)];
  }
  setWorkspaceEditIo(io) {
    this.workspaceMutations.setIo(io);
  }
  handlePublishDiagnostics(params) {
    super.handlePublishDiagnostics(params);
    this.documents.recordPublishedDiagnostics(params);
  }
  async definition(filePath, line, character, signal) {
    const absPath = this.resolveWorkspacePath(filePath);
    await this.openFile(absPath);
    const options = signal === undefined ? {} : { signal };
    return this.sendRequest("textDocument/definition", {
      textDocument: { uri: pathToFileURL3(absPath).href },
      position: { line: line - 1, character }
    }, options);
  }
  async references(filePath, line, character, includeDeclaration = true, signal) {
    const absPath = this.resolveWorkspacePath(filePath);
    await this.openFile(absPath);
    const options = signal === undefined ? {} : { signal };
    return this.sendRequest("textDocument/references", {
      textDocument: { uri: pathToFileURL3(absPath).href },
      position: { line: line - 1, character },
      context: { includeDeclaration }
    }, options);
  }
  async documentSymbols(filePath, signal) {
    const absPath = this.resolveWorkspacePath(filePath);
    await this.openFile(absPath);
    const options = signal === undefined ? {} : { signal };
    return this.sendRequest("textDocument/documentSymbol", {
      textDocument: { uri: pathToFileURL3(absPath).href }
    }, options);
  }
  async formatDocument(filePath, options, signal) {
    if (!this.isDocumentFormattingSupported())
      return null;
    const absPath = this.resolveWorkspacePath(filePath);
    await this.openFile(absPath);
    const requestOptions = signal === undefined ? {} : { signal };
    const edits = await this.sendRequest("textDocument/formatting", {
      textDocument: { uri: pathToFileURL3(absPath).href },
      options
    }, requestOptions);
    return edits ?? [];
  }
  async workspaceSymbols(query, signal) {
    const options = signal === undefined ? {} : { signal };
    return this.sendRequest("workspace/symbol", { query }, options);
  }
  isUnsupportedDiagnosticPullError(error) {
    if (!(error instanceof Error))
      return false;
    const code = "code" in error && typeof error.code === "number" ? error.code : undefined;
    if (code === -32601)
      return true;
    return /unsupported|not supported|method not found|unknown request/i.test(error.message);
  }
  freshnessTimeout(absPath) {
    return {
      items: [],
      transientError: {
        kind: "freshness_timeout",
        message: `Timed out waiting for fresh diagnostics for ${absPath} within ${this.diagnosticsFreshnessTimeoutMs}ms.`
      }
    };
  }
  parseDiagnosticPullReport(value) {
    if (value.kind === "unchanged") {
      return {
        type: "unchanged",
        ...value.resultId === undefined ? {} : { resultId: value.resultId }
      };
    }
    return {
      type: "full",
      diagnostics: value.items ?? [],
      ...value.resultId === undefined ? {} : { resultId: value.resultId }
    };
  }
  async diagnostics(filePath, signal) {
    signal?.throwIfAborted();
    const absPath = this.resolveWorkspacePath(filePath);
    const uri = pathToFileURL3(absPath).href;
    await this.openFile(absPath);
    const deadlineAt = this.timerProvider.now() + this.diagnosticsFreshnessTimeoutMs;
    for (;; ) {
      signal?.throwIfAborted();
      const snapshot = this.documents.captureDiagnosticSnapshot(absPath);
      if (!snapshot)
        return this.freshnessTimeout(absPath);
      const push = this.documents.resolvePushDiagnostics(snapshot);
      if (push.status === "ready")
        return { items: [...push.diagnostics] };
      let pushFallbackOnly = !this.isDiagnosticPullSupported();
      if (!pushFallbackOnly) {
        const cached = this.documents.getPullCache(snapshot);
        try {
          const remainingMs = deadlineAt - this.timerProvider.now();
          if (remainingMs <= 0)
            return this.freshnessTimeout(absPath);
          const result = await this.sendRequest("textDocument/diagnostic", {
            textDocument: { uri },
            ...cached?.resultId === undefined ? {} : { previousResultId: cached.resultId }
          }, { timeoutMs: remainingMs, ...signal === undefined ? {} : { signal } });
          if (!this.documents.isCurrentSnapshot(snapshot))
            continue;
          const report = this.parseDiagnosticPullReport(result);
          if (report.type === "full") {
            this.documents.recordPullDiagnostics(snapshot, {
              kind: "full",
              diagnostics: report.diagnostics,
              ...report.resultId === undefined ? {} : { resultId: report.resultId }
            });
            return { items: [...report.diagnostics] };
          }
          if (cached !== null && cached.documentVersion === snapshot.version && cached.resultId === report.resultId) {
            return { items: [...cached.diagnostics] };
          }
        } catch (error) {
          if (this.isUnsupportedDiagnosticPullError(error)) {
            this.setDiagnosticPullSupported(false);
            continue;
          } else if (error instanceof LspRequestTimeoutError) {
            pushFallbackOnly = true;
          } else {
            this.diagnosticPullErrors.push(error instanceof Error ? error : new Error(String(error)));
            throw error;
          }
        }
      }
      if (!pushFallbackOnly)
        continue;
      const remainingMs = deadlineAt - this.timerProvider.now();
      if (remainingMs <= 0) {
        if (!this.isDiagnosticPullSupported() && snapshot.publishGeneration === 0) {
          const cached = this.documents.getPullCache(snapshot);
          return { items: cached === null ? [] : [...cached.diagnostics] };
        }
        return this.freshnessTimeout(absPath);
      }
      const waitMs = push.status === "wait" ? Math.min(push.waitMs, remainingMs) : remainingMs;
      await waitForDiagnosticsActivity(this.documents.waitForDiagnosticsActivity(snapshot, waitMs), signal);
    }
  }
  async prepareRename(filePath, line, character, signal) {
    const absPath = this.resolveWorkspacePath(filePath);
    await this.openFile(absPath);
    const options = signal === undefined ? {} : { signal };
    return this.sendRequest("textDocument/prepareRename", {
      textDocument: { uri: pathToFileURL3(absPath).href },
      position: { line: line - 1, character }
    }, options);
  }
  async rename(filePath, line, character, newName, signal) {
    const absPath = this.resolveWorkspacePath(filePath);
    await this.openFile(absPath);
    const acquired = this.workspaceMutations.acquire(signal);
    if (!acquired.success)
      return { edit: null, apply: acquired.result };
    const preCommitSignal = createPreCommitAbortSignal(signal, () => this.workspaceMutations.isBeforeCommit(acquired.lease));
    try {
      const renameParams = {
        textDocument: { uri: pathToFileURL3(absPath).href },
        position: { line: line - 1, character },
        newName
      };
      const edit = preCommitSignal === undefined ? await this.sendRequest("textDocument/rename", renameParams) : await this.sendRequest("textDocument/rename", renameParams, {
        signal: preCommitSignal.signal
      });
      return await this.workspaceMutations.reconcileRename(acquired.lease, edit);
    } finally {
      preCommitSignal?.dispose();
      this.workspaceMutations.release(acquired.lease);
    }
  }
  resolveWorkspacePath(filePath) {
    return resolve5(this.root, filePath);
  }
}
function waitForDiagnosticsActivity(wait, signal) {
  if (!signal)
    return wait;
  if (signal.aborted)
    return Promise.reject(abortError2(signal));
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(abortError2(signal));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    wait.then(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, (error) => {
      signal.removeEventListener("abort", onAbort);
      reject(error);
    });
  });
}
function createPreCommitAbortSignal(source, isBeforeCommit) {
  if (!source)
    return;
  const controller = new AbortController;
  const onAbort = () => {
    if (isBeforeCommit() && !controller.signal.aborted)
      controller.abort(preCommitAbortReason(source));
  };
  if (source.aborted)
    onAbort();
  else
    source.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    dispose: () => source.removeEventListener("abort", onAbort)
  };
}
function preCommitAbortReason(source) {
  const reason = source.reason;
  if (reason instanceof Error && reason.name !== "AbortError")
    return reason;
  return new Error("LSP request cancelled before workspace edit commit");
}
function abortError2(signal) {
  const reason = signal.reason;
  if (reason instanceof Error)
    return reason;
  const error = new Error(typeof reason === "string" ? reason : "operation cancelled");
  error.name = "AbortError";
  return error;
}

// ../lsp-core/src/lsp/client-key.ts
function lspClientKey(root, server) {
  return JSON.stringify([root, server.id, server.command]);
}

// ../lsp-core/src/lsp/client-startup.ts
class ClientStartups {
  constructor(now, discard) {
    this.now = now;
    this.discard = discard;
  }
  begin(request) {
    const { client } = request;
    const startedAt = this.now();
    const initPromise = (async () => {
      await client.start();
      await client.initialize();
    })();
    const managed = {
      ...request,
      refCount: 0,
      pendingWaiters: 0,
      lastUsedAt: startedAt,
      initPromise,
      isInitializing: true,
      initializingSince: startedAt
    };
    initPromise.then(() => {
      managed.isInitializing = false;
      managed.initializingSince = null;
      managed.initPromise = null;
      managed.lastUsedAt = this.now();
    }, () => this.discard(managed));
    return managed;
  }
  async wait(managed, initPromise, signal) {
    managed.pendingWaiters++;
    try {
      await awaitWithSignal(initPromise, signal);
    } catch (error) {
      this.detach(managed);
      throw error;
    }
  }
  detach(managed) {
    managed.pendingWaiters--;
    if (managed.pendingWaiters === 0 && managed.refCount === 0 && managed.heldByWaiters)
      this.discard(managed);
  }
}
function awaitWithSignal(promise, signal) {
  if (!signal)
    return promise;
  return new Promise((resolve, reject) => {
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
      resolve(value);
    }, (err) => {
      if (settled)
        return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
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

class LspManager {
  constructor(options = {}) {
    this.clients = new Map;
    this.pendingStops = new Map;
    this.respawnBudgets = new Map;
    this.signalDisposer = null;
    this.disposed = false;
    this.idleTimeoutMs = options.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
    this.initTimeoutMs = options.initTimeoutMs ?? INIT_TIMEOUT_MS;
    this.maxResidentClients = options.maxResidentClients ?? MAX_RESIDENT_CLIENTS;
    this.clientFactory = options.clientFactory ?? ((root, server) => new LspClient(root, server));
    this.now = options.now ?? (() => Date.now());
    this.startups = new ClientStartups(this.now, (managed) => this.discard(managed));
    const reaperIntervalMs = options.reaperIntervalMs ?? REAPER_INTERVAL_MS;
    this.stopReaper = repeatEvery(options.timers ?? realTimerProvider, reaperIntervalMs, () => this.reapStale());
    this.signalDisposer = installProcessSignalCleanup(() => this.stopAll());
  }
  tombstoneStop(key, client) {
    const stop = stopClientBestEffort(client);
    this.pendingStops.set(key, stop);
    stop.finally(() => {
      if (this.pendingStops.get(key) === stop) {
        this.pendingStops.delete(key);
      }
    });
    return stop;
  }
  recordDeadGeneration(key) {
    let budget = this.respawnBudgets.get(key);
    if (budget === undefined) {
      budget = { deadGenerations: 0, exhaustedAt: null };
      this.respawnBudgets.set(key, budget);
    }
    budget.deadGenerations += 1;
  }
  markHealthyGeneration(key) {
    this.respawnBudgets.delete(key);
  }
  ensureRespawnAllowed(key, root, serverId) {
    const budget = this.respawnBudgets.get(key);
    if (budget === undefined || budget.deadGenerations < CLIENT_RESPAWN_RETRY_LIMIT)
      return;
    if (budget.exhaustedAt === null) {
      budget.exhaustedAt = this.now();
      throw new LspClientRespawnBudgetExceededError(serverId, root, CLIENT_RESPAWN_RETRY_LIMIT);
    }
    if (this.now() - budget.exhaustedAt < CLIENT_RESPAWN_COOLDOWN_MS) {
      throw new LspClientRespawnBudgetExceededError(serverId, root, CLIENT_RESPAWN_RETRY_LIMIT);
    }
    budget.deadGenerations = 0;
    budget.exhaustedAt = null;
  }
  startupExpired(managed, t) {
    return managed.isInitializing && managed.initializingSince !== null && t - managed.initializingSince > this.initTimeoutMs;
  }
  reapStale() {
    const t = this.now();
    for (const managed of [...this.clients.values()]) {
      const idle = !managed.isInitializing && managed.refCount === 0 && managed.pendingWaiters === 0 && t - managed.lastUsedAt > this.idleTimeoutMs;
      if (idle || this.startupExpired(managed, t))
        this.discard(managed);
    }
  }
  evictForAdmission() {
    while (this.clients.size >= this.maxResidentClients) {
      const victim = this.leastRecentlyUsedIdleClient();
      if (!victim)
        return;
      this.discard(victim);
    }
  }
  leastRecentlyUsedIdleClient() {
    let candidate = null;
    for (const managed of this.clients.values()) {
      if (managed.refCount > 0 || managed.pendingWaiters > 0 || managed.isInitializing)
        continue;
      if (candidate === null || managed.lastUsedAt < candidate.lastUsedAt)
        candidate = managed;
    }
    return candidate;
  }
  discard(managed) {
    if (this.clients.get(managed.key) !== managed)
      return;
    this.clients.delete(managed.key);
    this.tombstoneStop(managed.key, managed.client);
  }
  async getClient(root, server, signal) {
    const key = lspClientKey(root, server);
    for (;; ) {
      if (this.disposed) {
        throw new Error("LspManager has been disposed");
      }
      signal?.throwIfAborted();
      const pendingStop = this.pendingStops.get(key);
      if (pendingStop !== undefined) {
        await awaitWithSignal(pendingStop, signal);
        continue;
      }
      let managed = this.clients.get(key);
      if (managed !== undefined && this.startupExpired(managed, this.now())) {
        this.discard(managed);
        continue;
      }
      if (managed === undefined) {
        this.evictForAdmission();
        this.ensureRespawnAllowed(key, root, server.id);
        managed = this.startClient(key, root, server, true);
      }
      const { initPromise } = managed;
      if (initPromise !== null) {
        await this.startups.wait(managed, initPromise, signal);
        if (signal?.aborted) {
          this.startups.detach(managed);
          signal.throwIfAborted();
        }
        managed.pendingWaiters--;
      }
      if (this.clients.get(key) !== managed)
        continue;
      if (!managed.client.isAlive()) {
        this.recordDeadGeneration(key);
        this.discard(managed);
        continue;
      }
      this.markHealthyGeneration(key);
      managed.refCount++;
      managed.lastUsedAt = this.now();
      return managed.client;
    }
  }
  startClient(key, root, server, heldByWaiters) {
    const client = this.clientFactory(root, server);
    const managed = this.startups.begin({ key, root, serverId: server.id, client, heldByWaiters });
    this.clients.set(key, managed);
    return managed;
  }
  releaseClient(root, server, client) {
    const managed = this.clients.get(lspClientKey(root, server));
    if (client !== undefined && managed?.client !== client)
      return;
    if (managed && managed.refCount > 0) {
      managed.refCount--;
      managed.lastUsedAt = this.now();
    }
  }
  invalidateClient(root, server, client) {
    const managed = this.clients.get(lspClientKey(root, server));
    if (!managed)
      return;
    if (client && managed.client !== client)
      return;
    this.discard(managed);
  }
  warmupClient(root, server) {
    if (this.disposed)
      return;
    const key = lspClientKey(root, server);
    if (this.clients.has(key) || this.pendingStops.has(key))
      return;
    this.evictForAdmission();
    try {
      this.ensureRespawnAllowed(key, root, server.id);
    } catch {
      return;
    }
    this.startClient(key, root, server, false);
  }
  isServerInitializing(root, server) {
    const managed = this.clients.get(lspClientKey(root, server));
    return managed?.isInitializing ?? false;
  }
  getSnapshot() {
    const snapshots = [];
    for (const managed of this.clients.values()) {
      snapshots.push({
        root: managed.root,
        serverId: managed.serverId,
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
  hasClient(root, server) {
    return this.clients.has(lspClientKey(root, server));
  }
  clientCount() {
    return this.clients.size;
  }
  async stopAll() {
    this.disposed = true;
    this.stopReaper();
    if (this.signalDisposer) {
      this.signalDisposer();
      this.signalDisposer = null;
    }
    const stopPromises = [];
    for (const managed of this.clients.values()) {
      stopPromises.push(stopClientBestEffort(managed.client));
    }
    const tombstonedStops = [...this.pendingStops.values()];
    this.clients.clear();
    this.respawnBudgets.clear();
    await Promise.allSettled([...stopPromises, ...tombstonedStops]);
    this.pendingStops.clear();
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
export {
  LspManager,
  disposeDefaultLspManager,
  getLspManager
};

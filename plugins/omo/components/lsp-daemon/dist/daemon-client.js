import { connect } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseLspRequestContext } from "@oh-my-opencode/lsp-core/request-context";
import { isPlainRecord } from "@oh-my-opencode/mcp-stdio-core/record";
import { ensureDaemonRunning } from "./ensure-daemon.js";
import { authEnvelope, isAuthErrorResponse, readAuthToken } from "./ipc-protocol.js";
import { daemonPaths } from "./paths.js";
import { CONTEXT_KEY } from "./request-routing.js";
import { createLineDecoder, encodeJsonLine } from "./socket-jsonrpc.js";
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
let nextProxyRequestId = 1;
export class DaemonRequestError extends Error {
    constructor(message, requestWritten) {
        super(message);
        this.name = "DaemonRequestError";
        this.requestWritten = requestWritten;
    }
}
export class DaemonAuthenticationRejectedError extends DaemonRequestError {
    constructor() {
        super("daemon authentication failed before dispatch", true);
        this.name = "DaemonAuthenticationRejectedError";
    }
}
export class DaemonRequestCancelledError extends DaemonRequestError {
    constructor(requestWritten) {
        super("daemon request cancelled", requestWritten);
        this.name = "DaemonRequestCancelledError";
    }
}
export async function callToolViaDaemon(name, args, options) {
    const context = requireContext(options.context);
    const paths = options.paths ?? daemonPaths();
    const ensure = options.ensure ??
        ((ensurePaths, signal) => ensureDaemonRunning(ensurePaths, undefined, signal === undefined ? {} : { signal }));
    const timeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const requestArgs = withContext(args, context);
    let lastError;
    let authRefreshUsed = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await ensureDaemonAvailable(paths, ensure, options.signal);
            const token = readAuthToken(paths);
            if (!token)
                throw new DaemonRequestError("daemon auth token missing", false);
            const sendOptions = options.signal === undefined ? { timeoutMs } : { timeoutMs, signal: options.signal };
            return await sendToolCall(paths, token, name, requestArgs, sendOptions);
        }
        catch (error) {
            lastError = error;
            if (error instanceof DaemonAuthenticationRejectedError && !authRefreshUsed) {
                authRefreshUsed = true;
                continue;
            }
            if (error instanceof DaemonRequestCancelledError)
                break;
            if (error instanceof DaemonRequestError && (error.requestWritten || !isRetryableTool(name)))
                break;
        }
    }
    return daemonUnreachableResult(paths, lastError);
}
export function callDiagnosticsViaDaemon(filePath, options) {
    return callToolViaDaemon("diagnostics", { filePath, severity: "error" }, options);
}
export function currentRequestContext(env = process.env) {
    const cwd = process.cwd();
    const home = env["HOME"] ?? homedir();
    return parseLspRequestContext({
        cwd,
        projectConfigPaths: [join(cwd, ".codex", "lsp-client.json")],
        userConfigPath: join(home, ".codex", "lsp-client.json"),
        installDecisionsPath: join(home, ".codex", "lsp-install-decisions.json"),
        capabilities: { installDecisionTool: true },
    });
}
function requireContext(context) {
    if (!context)
        throw new DaemonRequestError("daemon tool context is required", false);
    return parseLspRequestContext(context);
}
function withContext(args, context) {
    return { ...args, [CONTEXT_KEY]: context };
}
function ensureDaemonAvailable(paths, ensure, signal) {
    if (!signal)
        return ensure(paths);
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (run) => {
            if (settled)
                return;
            settled = true;
            signal.removeEventListener("abort", onAbort);
            run();
        };
        const onAbort = () => finish(() => reject(new DaemonRequestCancelledError(false)));
        if (signal.aborted) {
            onAbort();
            return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
        Promise.resolve()
            .then(() => ensure(paths, signal))
            .then(() => finish(() => resolve()), (error) => finish(() => reject(signal.aborted ? new DaemonRequestCancelledError(false) : error)));
    });
}
function daemonUnreachableResult(paths, error) {
    const text = [
        `LSP daemon unreachable: ${errorText(error)}.`,
        "The MCP server is a thin proxy and never runs language servers in-process.",
        `Socket: ${paths.socket}`,
        `Logs: ${paths.log}`,
        "The daemon is auto-started on demand and will be retried on the next request.",
    ].join("\n");
    return { content: [{ type: "text", text }], isError: true };
}
function sendToolCall(paths, token, name, args, options) {
    return new Promise((resolve, reject) => {
        const socket = connect(paths.socket);
        const requestId = allocateProxyRequestId();
        let settled = false;
        let requestWritten = false;
        let cancelAfterWrite = false;
        const cancelPayload = () => encodeJsonLine({
            jsonrpc: "2.0",
            method: "$/cancelRequest",
            params: { _omo: authEnvelope(token), id: requestId },
        });
        const finish = (run) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            options.signal?.removeEventListener("abort", onAbort);
            destroyAfterCancel();
            run();
        };
        const sendCancel = () => {
            if (!requestWritten) {
                cancelAfterWrite = true;
                return;
            }
            if (!socket.writable)
                return;
            socket.write(cancelPayload());
        };
        const destroyAfterCancel = () => {
            socket.destroy();
        };
        const onAbort = () => {
            sendCancel();
            finish(() => reject(new DaemonRequestCancelledError(requestWritten)));
        };
        const timer = setTimeout(() => {
            sendCancel();
            finish(() => reject(new DaemonRequestError("daemon request timed out", requestWritten)));
        }, options.timeoutMs);
        timer.unref();
        if (options.signal?.aborted) {
            onAbort();
            return;
        }
        options.signal?.addEventListener("abort", onAbort, { once: true });
        const decoder = createLineDecoder((message) => {
            if (isAuthErrorResponse(message)) {
                finish(() => reject(new DaemonAuthenticationRejectedError()));
                return;
            }
            const result = toToolResult(message, requestId);
            if (result)
                finish(() => resolve(result));
            else
                finish(() => reject(new DaemonRequestError("invalid daemon response", requestWritten)));
        });
        socket.once("connect", () => {
            const payload = encodeJsonLine({
                jsonrpc: "2.0",
                id: requestId,
                method: "tools/call",
                params: { _omo: authEnvelope(token), name, arguments: args },
            });
            socket.write(payload, () => {
                requestWritten = true;
                if (cancelAfterWrite && socket.writable)
                    socket.write(cancelPayload());
            });
        });
        socket.on("data", (chunk) => decoder.push(chunk));
        socket.once("error", (error) => finish(() => reject(new DaemonRequestError(error.message, requestWritten))));
        socket.once("close", () => finish(() => reject(new DaemonRequestError("daemon connection closed", requestWritten))));
    });
}
function toToolResult(message, requestId) {
    if (!isPlainRecord(message) || message["id"] !== requestId)
        return null;
    const result = message["result"];
    if (!isPlainRecord(result) || !Array.isArray(result["content"]))
        return null;
    return {
        content: result["content"],
        isError: result["isError"] === true,
        details: result["details"],
    };
}
function allocateProxyRequestId() {
    const id = nextProxyRequestId;
    nextProxyRequestId += 1;
    if (nextProxyRequestId > Number.MAX_SAFE_INTEGER)
        nextProxyRequestId = 1;
    return id;
}
function isRetryableTool(name) {
    return name !== "rename" && name !== "lsp_rename";
}
function errorText(error) {
    return error instanceof Error ? error.message : String(error);
}

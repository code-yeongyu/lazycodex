import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { Socket } from "node:net";
import { dirname } from "node:path";
import { execPath } from "node:process";
import { authEnvelope, readAuthToken } from "./ipc-protocol.js";
import { packagedRuntimeDefaults } from "./paths.js";
import { resolveDaemonRuntime } from "./runtime-contract.js";
import { createLineDecoder, encodeJsonLine } from "./socket-jsonrpc.js";
export { InvalidRuntimeOverrideError, OMO_LSP_DAEMON_CLI, resolveDaemonRuntime } from "./runtime-contract.js";
const PROBE_TIMEOUT_MS = 500;
const DEFAULT_READY_TIMEOUT_MS = 5_000;
const DEFAULT_POLL_INTERVAL_MS = 100;
export class DaemonUnreachableError extends Error {
    constructor(socketPath) {
        super(`LSP daemon did not become reachable at ${socketPath}`);
        this.name = "DaemonUnreachableError";
    }
}
export async function ensureDaemonRunning(paths, deps = defaultEnsureDaemonDeps(), options = {}) {
    const readyTimeoutMs = options.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const signal = options.signal;
    throwIfAborted(signal);
    if (await awaitWithSignal(deps.probe(paths, signal), signal))
        return;
    throwIfAborted(signal);
    deps.spawnDaemon(paths);
    await waitUntilReachable(paths, deps, readyTimeoutMs, pollIntervalMs, signal);
}
async function waitUntilReachable(paths, deps, readyTimeoutMs, pollIntervalMs, signal) {
    const deadline = deps.now() + readyTimeoutMs;
    for (;;) {
        throwIfAborted(signal);
        if (await awaitWithSignal(deps.probe(paths, signal), signal))
            return;
        if (deps.now() >= deadline)
            throw new DaemonUnreachableError(paths.socket);
        await awaitWithSignal(deps.sleep(pollIntervalMs, signal), signal);
    }
}
export async function probeDaemon(paths, timeoutMs = PROBE_TIMEOUT_MS, signal) {
    const token = readAuthToken(paths);
    if (!token)
        return false;
    return (await pingDaemon(paths, token, timeoutMs, signal)) !== null;
}
export function pingDaemon(paths, token, timeoutMs = PROBE_TIMEOUT_MS, signal) {
    return new Promise((resolve) => {
        const socket = new Socket();
        let settled = false;
        let timer;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            if (timer !== undefined)
                clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
            socket.destroy();
            resolve(value);
        };
        const onAbort = () => finish(null);
        const decoder = createLineDecoder((message) => {
            finish(parsePingResponse(message));
        });
        socket.once("connect", () => {
            socket.write(encodeJsonLine({ jsonrpc: "2.0", id: 1, method: "omo/ping", params: { _omo: authEnvelope(token) } }));
        });
        socket.on("data", (chunk) => decoder.push(chunk));
        socket.once("error", () => {
            finish(null);
        });
        timer = setTimeout(() => finish(null), timeoutMs);
        timer.unref?.();
        if (signal?.aborted) {
            onAbort();
            return;
        }
        signal?.addEventListener("abort", onAbort, { once: true });
        socket.connect(paths.socket);
    });
}
export function spawnDaemonProcess(paths) {
    mkdirSync(dirname(paths.log), { recursive: true });
    const logFd = openSync(paths.log, "a");
    try {
        const child = spawn(execPath, [paths.cliPath, "daemon"], {
            detached: true,
            stdio: ["ignore", logFd, logFd],
        });
        child.unref();
    }
    finally {
        closeSync(logFd);
    }
}
export function resolveDaemonCliPath(env = process.env, defaults = packagedRuntimeDefaults()) {
    return resolveDaemonRuntime(env, defaults).cliPath;
}
export function defaultEnsureDaemonDeps() {
    return {
        probe: (paths, signal) => probeDaemon(paths, PROBE_TIMEOUT_MS, signal),
        spawnDaemon: (paths) => spawnDaemonProcess(paths),
        sleep: (ms, signal) => sleepWithSignal(ms, signal),
        now: () => Date.now(),
    };
}
function sleepWithSignal(ms, signal) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = () => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener("abort", finish);
            resolve();
        };
        const timer = setTimeout(finish, ms);
        if (signal?.aborted) {
            finish();
            return;
        }
        signal?.addEventListener("abort", finish, { once: true });
    });
}
function awaitWithSignal(promise, signal) {
    if (!signal)
        return promise;
    if (signal.aborted)
        return Promise.reject(abortError(signal));
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (run) => {
            if (settled)
                return;
            settled = true;
            signal.removeEventListener("abort", onAbort);
            run();
        };
        const onAbort = () => finish(() => reject(abortError(signal)));
        signal.addEventListener("abort", onAbort, { once: true });
        promise.then((value) => finish(() => resolve(value)), (error) => finish(() => reject(error)));
    });
}
function throwIfAborted(signal) {
    if (signal?.aborted)
        throw abortError(signal);
}
function abortError(signal) {
    const reason = signal.reason;
    if (reason instanceof Error)
        return reason;
    const error = new Error(typeof reason === "string" ? reason : "daemon startup cancelled");
    error.name = "AbortError";
    return error;
}
function parsePingResponse(message) {
    if (!message || typeof message !== "object" || Array.isArray(message))
        return null;
    const result = Reflect.get(message, "result");
    if (!result || typeof result !== "object" || Array.isArray(result))
        return null;
    const pid = Reflect.get(result, "pid");
    const nonce = Reflect.get(result, "nonce");
    const startedAt = Reflect.get(result, "startedAt");
    const endpoint = Reflect.get(result, "endpoint");
    if (typeof pid !== "number" || typeof nonce !== "string" || typeof startedAt !== "string")
        return null;
    if (!endpoint || typeof endpoint !== "object" || Array.isArray(endpoint))
        return null;
    const path = Reflect.get(endpoint, "path");
    const kind = Reflect.get(endpoint, "kind");
    if (typeof path !== "string")
        return null;
    if (kind === "windows")
        return { pid, nonce, startedAt, endpoint: { kind, path } };
    if (kind === "missing")
        return { pid, nonce, startedAt, endpoint: { kind, path } };
    const dev = Reflect.get(endpoint, "dev");
    const ino = Reflect.get(endpoint, "ino");
    if (kind === "unix" && typeof dev === "number" && typeof ino === "number") {
        return { pid, nonce, startedAt, endpoint: { kind, path, dev, ino } };
    }
    return null;
}

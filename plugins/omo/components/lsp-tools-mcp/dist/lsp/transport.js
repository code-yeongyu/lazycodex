import { delimiter } from "node:path";
import { reportBestEffortCleanupError } from "./cleanup-errors.js";
import { REQUEST_TIMEOUT_MS, STOP_HARD_KILL_TIMEOUT_MS, STOP_SIGKILL_GRACE_MS } from "./constants.js";
import { LspConnectionClosedError, LspProcessExitedError, LspRequestTimeoutError } from "./errors.js";
import { JsonRpcConnection } from "./json-rpc-connection.js";
import { spawnProcess } from "./process.js";
import { getAdditionalPathBases } from "./server-installation.js";
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
export class LspClientTransport {
    constructor(root, server) {
        this.root = root;
        this.server = server;
        this.proc = null;
        this.connection = null;
        this.stderrBuffer = [];
        this.processExited = false;
        this.diagnosticsStore = new Map();
    }
    pid() {
        return this.proc?.pid;
    }
    command() {
        return [...this.server.command];
    }
    async start() {
        const env = {
            ...process.env,
            ...this.server.env,
        };
        const pathValue = process.platform === "win32" ? (env["PATH"] ?? env["Path"] ?? "") : (env["PATH"] ?? "");
        const spawnPath = [pathValue, ...getAdditionalPathBases(this.root)].filter(Boolean).join(delimiter);
        if (process.platform === "win32" && env["Path"] !== undefined) {
            env["Path"] = spawnPath;
        }
        env["PATH"] = spawnPath;
        this.proc = spawnProcess(this.server.command, {
            cwd: this.root,
            env,
        });
        this.startStderrReading();
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (this.proc.exitCode !== null) {
            const stderr = this.stderrBuffer.join("\n");
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
        return (code === "ERR_STREAM_DESTROYED" ||
            /connection closed|connection is disposed|stream was destroyed/i.test(error.message));
    }
    async sendRequest(method, ...args) {
        if (!this.connection)
            throw new Error("LSP client not started");
        if (this.processExited || (this.proc && this.proc.exitCode !== null)) {
            const stderrTail = this.stderrBuffer.slice(-10).join("\n");
            throw new LspProcessExitedError(this.server.id, this.root, this.proc?.exitCode ?? null, stderrTail || undefined);
        }
        let timeoutHandle = null;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                const stderrTail = this.stderrBuffer.slice(-5).join("\n");
                reject(new LspRequestTimeoutError(method, stderrTail || undefined));
            }, REQUEST_TIMEOUT_MS);
        });
        try {
            const requestPromise = args.length === 0
                ? this.connection.sendRequest(method)
                : this.connection.sendRequest(method, args[0]);
            const result = await Promise.race([requestPromise, timeoutPromise]);
            if (timeoutHandle !== null)
                clearTimeout(timeoutHandle);
            return result;
        }
        catch (error) {
            if (timeoutHandle !== null)
                clearTimeout(timeoutHandle);
            if (this.processExited || (this.proc && this.proc.exitCode !== null)) {
                throw new LspProcessExitedError(this.server.id, this.root, this.proc?.exitCode ?? null, this.stderrBuffer.slice(-10).join("\n") || undefined);
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
        if (this.processExited || (this.proc && this.proc.exitCode !== null))
            return;
        try {
            if (args.length === 0) {
                await this.connection.sendNotification(method);
            }
            else {
                await this.connection.sendNotification(method, args[0]);
            }
        }
        catch (error) {
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
            }
            catch (error) {
                reportBestEffortCleanupError("shutdown request", error);
            }
            try {
                await this.sendNotification("exit");
            }
            catch (error) {
                reportBestEffortCleanupError("exit notification", error);
            }
            try {
                this.connection.dispose();
            }
            catch (error) {
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
                    proc.exited
                        .then(() => {
                        exitedBeforeTimeout = true;
                    })
                        .finally(() => {
                        if (timeoutId)
                            clearTimeout(timeoutId);
                    }),
                    timeoutPromise,
                ]);
                if (!exitedBeforeTimeout) {
                    try {
                        proc.kill("SIGKILL");
                        await Promise.race([
                            proc.exited,
                            new Promise((resolve) => setTimeout(resolve, STOP_SIGKILL_GRACE_MS)),
                        ]);
                    }
                    catch (error) {
                        reportBestEffortCleanupError("hard process kill", error);
                    }
                }
            }
            catch (error) {
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
function isDiagnostic(value) {
    return isRecord(value) && isRange(value["range"]) && typeof value["message"] === "string";
}
function isRange(value) {
    return isRecord(value) && isPosition(value["start"]) && isPosition(value["end"]);
}
function isPosition(value) {
    return isRecord(value) && typeof value["line"] === "number" && typeof value["character"] === "number";
}

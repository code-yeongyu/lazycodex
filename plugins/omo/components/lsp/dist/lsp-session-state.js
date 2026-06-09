import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join } from "node:path";
export function sessionIdFrom(input) {
    return typeof input.session_id === "string" && input.session_id.length > 0 ? input.session_id : undefined;
}
export function shouldSkipUnavailableLspDiagnostics(filePath, sessionId) {
    if (sessionId === undefined)
        return false;
    const state = readSessionState(sessionStatePath(sessionId));
    const extension = extensionKey(filePath);
    return (extension !== undefined &&
        state.postCompactProbePending !== true &&
        state.unavailableExtensions.includes(extension));
}
export function recordLspDiagnosticsObservations(sessionId, observations) {
    if (sessionId === undefined || observations.length === 0)
        return;
    const state = readSessionState(sessionStatePath(sessionId));
    const unavailableExtensions = new Set(state.unavailableExtensions);
    for (const observation of observations) {
        const extension = extensionKey(observation.filePath);
        if (extension === undefined)
            continue;
        if (observation.unavailable) {
            unavailableExtensions.add(extension);
        }
        else {
            unavailableExtensions.delete(extension);
        }
    }
    writeSessionState(sessionStatePath(sessionId), { unavailableExtensions: [...unavailableExtensions].sort() });
}
export function markLspSessionCompacted(sessionId) {
    if (sessionId === undefined)
        return;
    const state = readSessionState(sessionStatePath(sessionId));
    if (state.unavailableExtensions.length === 0)
        return;
    writeSessionState(sessionStatePath(sessionId), {
        unavailableExtensions: state.unavailableExtensions,
        postCompactProbePending: true,
    });
}
export function isUnavailableLspDiagnostics(diagnostics) {
    const normalized = diagnostics.trim();
    return (normalized.includes("LSP request timeout (method: initialize)") ||
        normalized.includes("LSP server is still initializing") ||
        normalized.includes("NOT INSTALLED") ||
        normalized.includes("Command not found:"));
}
function sessionStatePath(sessionId) {
    const root = process.env["PLUGIN_DATA"] ?? join(homedir(), ".codex", "codex-lsp");
    return join(root, "sessions", `${safePathSegment(sessionId)}.json`);
}
function readSessionState(path) {
    try {
        const parsed = JSON.parse(readFileSync(path, "utf8"));
        if (isLspSessionState(parsed))
            return parsed;
        return emptyState();
    }
    catch (error) {
        if (error instanceof SyntaxError || (isRecord(error) && error["code"] === "ENOENT"))
            return emptyState();
        throw error;
    }
}
function writeSessionState(path, state) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(state)}\n`);
}
function emptyState() {
    return { unavailableExtensions: [] };
}
function extensionKey(filePath) {
    const extension = extname(filePath).toLowerCase();
    return extension.length === 0 ? undefined : extension;
}
function safePathSegment(value) {
    return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "unknown-session";
}
function isLspSessionState(value) {
    if (!isRecord(value) || !Array.isArray(value["unavailableExtensions"]))
        return false;
    const postCompactProbePending = value["postCompactProbePending"];
    return (value["unavailableExtensions"].every((item) => typeof item === "string") &&
        (postCompactProbePending === undefined || typeof postCompactProbePending === "boolean"));
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

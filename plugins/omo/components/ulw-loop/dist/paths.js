import { join } from "node:path";
import { ULW_LOOP_BRIEF, ULW_LOOP_DIR, ULW_LOOP_GOALS, ULW_LOOP_LEDGER } from "./types.js";
const SESSION_ENV_KEYS = ["OMO_ULW_LOOP_SESSION_ID", "CODEX_SESSION_ID", "CODEX_THREAD_ID"];
export function normalizeUlwLoopSessionId(sessionId) {
    const trimmed = sessionId?.trim();
    if (!trimmed)
        return null;
    const pathSegments = trimmed
        .split(/[\\/]+/)
        .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..");
    const candidate = (pathSegments.length > 0 ? pathSegments.join("-") : trimmed)
        .replace(/[^A-Za-z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\.+/, "")
        .replace(/^[.-]+|[.-]+$/g, "");
    return candidate.length > 0 ? candidate : null;
}
export function resolveUlwLoopSessionIdFromEnv(env = process.env) {
    for (const key of SESSION_ENV_KEYS) {
        const normalized = normalizeUlwLoopSessionId(env[key]);
        if (normalized !== null)
            return normalized;
    }
    return null;
}
export function ulwLoopRelativeDir(scope) {
    const sessionId = normalizeUlwLoopSessionId(scope?.sessionId);
    return sessionId === null ? ULW_LOOP_DIR : `${ULW_LOOP_DIR}/${sessionId}`;
}
export function ulwLoopDir(repoRoot, scope) {
    return join(repoRoot, ulwLoopRelativeDir(scope));
}
export function ulwLoopBriefRelativePath(scope) {
    return `${ulwLoopRelativeDir(scope)}/${ULW_LOOP_BRIEF}`;
}
export function ulwLoopGoalsRelativePath(scope) {
    return `${ulwLoopRelativeDir(scope)}/${ULW_LOOP_GOALS}`;
}
export function ulwLoopLedgerRelativePath(scope) {
    return `${ulwLoopRelativeDir(scope)}/${ULW_LOOP_LEDGER}`;
}
export function ulwLoopBriefPath(repoRoot, scope) {
    return join(ulwLoopDir(repoRoot, scope), ULW_LOOP_BRIEF);
}
export function ulwLoopGoalsPath(repoRoot, scope) {
    return join(ulwLoopDir(repoRoot, scope), ULW_LOOP_GOALS);
}
export function ulwLoopLedgerPath(repoRoot, scope) {
    return join(ulwLoopDir(repoRoot, scope), ULW_LOOP_LEDGER);
}
export function repoRelative(absolutePath, repoRoot) {
    const slashPrefix = `${repoRoot}/`;
    const backslashPrefix = `${repoRoot}\\`;
    if (absolutePath.startsWith(slashPrefix))
        return absolutePath.slice(slashPrefix.length).split("\\").join("/");
    if (absolutePath.startsWith(backslashPrefix))
        return absolutePath.slice(backslashPrefix.length).split("\\").join("/");
    return absolutePath.split("\\").join("/");
}

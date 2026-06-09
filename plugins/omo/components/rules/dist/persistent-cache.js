import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { postCompactKindState, postCompactPendingKinds, postCompactRecoveringKinds, } from "./post-compact-state.js";
import { SESSION_STATE_LOCK_CONTENDED, withSessionStateLock } from "./session-state-lock.js";
export function hydrateEngineState(engine, cachePath) {
    const state = readSessionState(cachePath);
    engine.state.staticDedup.clear();
    engine.state.dynamicDedup.clear();
    engine.state.dynamicTargetFingerprints.clear();
    for (const key of state.staticDedup) {
        engine.state.staticDedup.add(key);
    }
    for (const [scope, keys] of Object.entries(state.dynamicDedup)) {
        engine.state.dynamicDedup.set(scope, new Set(keys));
    }
    for (const [targetKey, fingerprint] of Object.entries(state.dynamicTargetFingerprints ?? {})) {
        engine.state.dynamicTargetFingerprints.set(targetKey, fingerprint);
    }
}
export function persistEngineState(engine, cachePath, completedPostCompactKind) {
    const currentState = readSessionState(cachePath);
    const dynamicDedup = {};
    for (const [scope, keys] of engine.state.dynamicDedup.entries()) {
        dynamicDedup[scope] = [...keys];
    }
    const postCompactPending = nextPostCompactPending(currentState, completedPostCompactKind);
    const postCompactRecovering = nextPostCompactRecovering(currentState, completedPostCompactKind);
    writeSessionState(cachePath, {
        staticDedup: [...engine.state.staticDedup],
        dynamicDedup,
        dynamicTargetFingerprints: Object.fromEntries(engine.state.dynamicTargetFingerprints.entries()),
        ...(postCompactPending === undefined ? {} : { postCompactPending }),
        ...(postCompactRecovering === undefined ? {} : { postCompactRecovering }),
    });
}
export function clearSessionState(cachePath) {
    rmSync(cachePath, { force: true });
}
export function markSessionCompacted(cachePath) {
    const state = readSessionState(cachePath);
    writeSessionState(cachePath, {
        staticDedup: state.staticDedup,
        dynamicDedup: state.dynamicDedup,
        ...(state.dynamicTargetFingerprints === undefined
            ? {}
            : { dynamicTargetFingerprints: state.dynamicTargetFingerprints }),
        postCompactPending: { static: true, dynamic: true },
    });
}
export function hasPostCompactPending(cachePath) {
    const state = readSessionState(cachePath);
    return postCompactPendingKinds(state).size > 0 || postCompactRecoveringKinds(state).size > 0;
}
export function isPostCompactPending(cachePath, kind) {
    return postCompactPendingKinds(readSessionState(cachePath)).has(kind);
}
export function claimPostCompactPending(cachePath, kind) {
    const result = withSessionStateLock(cachePath, () => {
        const state = readSessionState(cachePath);
        const pendingKinds = postCompactPendingKinds(state);
        if (!pendingKinds.has(kind)) {
            return "not-pending";
        }
        pendingKinds.delete(kind);
        const recoveringKinds = postCompactRecoveringKinds(state);
        recoveringKinds.add(kind);
        writeSessionState(cachePath, stateWithPostCompactKinds(state, pendingKinds, recoveringKinds));
        return "claimed";
    });
    return result === SESSION_STATE_LOCK_CONTENDED ? "contended" : result;
}
export function isPostCompactRecoveryInProgress(cachePath, kind) {
    return postCompactRecoveringKinds(readSessionState(cachePath)).has(kind);
}
export function completePostCompactRecovery(cachePath, kind) {
    withSessionStateLock(cachePath, () => {
        const state = readSessionState(cachePath);
        const pendingKinds = postCompactPendingKinds(state);
        const recoveringKinds = postCompactRecoveringKinds(state);
        recoveringKinds.delete(kind);
        writeSessionState(cachePath, stateWithPostCompactKinds(state, pendingKinds, recoveringKinds));
    });
}
export function sessionCachePath(sessionId, pluginDataRoot) {
    const root = pluginDataRoot ?? process.env["PLUGIN_DATA"] ?? join(homedir(), ".codex", "codex-rules");
    return join(root, "sessions", `${safePathSegment(sessionId)}.json`);
}
function readSessionState(cachePath) {
    try {
        const parsed = JSON.parse(readFileSync(cachePath, "utf8"));
        if (!isSerializedSessionState(parsed))
            return emptyState();
        return parsed;
    }
    catch {
        return emptyState();
    }
}
function writeSessionState(cachePath, state) {
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, `${JSON.stringify(state)}\n`);
}
function emptyState() {
    return { staticDedup: [], dynamicDedup: {}, dynamicTargetFingerprints: {} };
}
function nextPostCompactPending(state, completedKind) {
    const pendingKinds = postCompactPendingKinds(state);
    if (completedKind !== undefined) {
        pendingKinds.delete(completedKind);
    }
    if (pendingKinds.size === 0) {
        return undefined;
    }
    return {
        ...(pendingKinds.has("static") ? { static: true } : {}),
        ...(pendingKinds.has("dynamic") ? { dynamic: true } : {}),
    };
}
function nextPostCompactRecovering(state, completedKind) {
    const recoveringKinds = postCompactRecoveringKinds(state);
    if (completedKind !== undefined) {
        recoveringKinds.delete(completedKind);
    }
    return postCompactKindState(recoveringKinds);
}
function stateWithPostCompactKinds(state, pendingKinds, recoveringKinds) {
    const postCompactPending = postCompactKindState(pendingKinds);
    const postCompactRecovering = postCompactKindState(recoveringKinds);
    return {
        staticDedup: state.staticDedup,
        dynamicDedup: state.dynamicDedup,
        ...(state.dynamicTargetFingerprints === undefined
            ? {}
            : { dynamicTargetFingerprints: state.dynamicTargetFingerprints }),
        ...(postCompactPending === undefined ? {} : { postCompactPending }),
        ...(postCompactRecovering === undefined ? {} : { postCompactRecovering }),
    };
}
function safePathSegment(value) {
    return value.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "unknown-session";
}
function isSerializedSessionState(value) {
    if (!isRecord(value) || !Array.isArray(value["staticDedup"]) || !isRecord(value["dynamicDedup"])) {
        return false;
    }
    const staticDedup = value["staticDedup"];
    const dynamicDedup = value["dynamicDedup"];
    const dynamicTargetFingerprints = value["dynamicTargetFingerprints"];
    const postCompactPending = value["postCompactPending"];
    const postCompactRecovering = value["postCompactRecovering"];
    const compacted = value["compacted"];
    return (staticDedup.every((item) => typeof item === "string") &&
        Object.values(dynamicDedup).every((item) => Array.isArray(item) && item.every((nestedItem) => typeof nestedItem === "string")) &&
        (dynamicTargetFingerprints === undefined ||
            (isRecord(dynamicTargetFingerprints) &&
                Object.entries(dynamicTargetFingerprints).every(([targetKey, fingerprint]) => typeof targetKey === "string" && typeof fingerprint === "string"))) &&
        (postCompactPending === undefined || isPostCompactPendingState(postCompactPending)) &&
        (postCompactRecovering === undefined || isPostCompactPendingState(postCompactRecovering)) &&
        (compacted === undefined || typeof compacted === "boolean"));
}
function isPostCompactPendingState(value) {
    return (isRecord(value) &&
        (value["static"] === undefined || typeof value["static"] === "boolean") &&
        (value["dynamic"] === undefined || typeof value["dynamic"] === "boolean"));
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

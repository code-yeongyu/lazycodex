import { performance } from "node:perf_hooks";
import { debuglog } from "node:util";
const debug = debuglog("codex-rules");
const noopTimer = {
    lap: () => { },
    done: () => { },
};
export function createHookDebugTimer(hookName) {
    if (!debug.enabled) {
        return noopTimer;
    }
    const startMs = performance.now();
    let lastMs = startMs;
    return {
        lap: (phase, fields = {}) => {
            const nowMs = performance.now();
            writeDebugLine(hookName, phase, nowMs - lastMs, nowMs - startMs, fields);
            lastMs = nowMs;
        },
        done: (fields = {}) => {
            const nowMs = performance.now();
            writeDebugLine(hookName, "done", nowMs - lastMs, nowMs - startMs, fields);
            lastMs = nowMs;
        },
    };
}
function writeDebugLine(hookName, phase, durationMs, totalMs, fields) {
    debug("%s phase=%s ms=%s total_ms=%s%s", hookName, phase, durationMs.toFixed(3), totalMs.toFixed(3), formatFields(fields));
}
function formatFields(fields) {
    const entries = Object.entries(fields);
    if (entries.length === 0) {
        return "";
    }
    return ` ${entries.map(([key, value]) => `${key}=${String(value)}`).join(" ")}`;
}

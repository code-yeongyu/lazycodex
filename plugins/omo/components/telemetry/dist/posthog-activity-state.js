import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomically } from "./atomic-write.js";
import { getActivityStateDir } from "./data-path.js";
import { writeTelemetryDiagnostic } from "./diagnostics.js";
const POSTHOG_ACTIVITY_STATE_FILE = "posthog-activity.json";
function getPostHogActivityStateFilePath() {
    return join(getActivityStateDir(), POSTHOG_ACTIVITY_STATE_FILE);
}
function getUtcDayString(date) {
    return date.toISOString().slice(0, 10);
}
function isPostHogActivityState(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function writeActivityStateDiagnostic(event, error, errorKind) {
    writeTelemetryDiagnostic({
        event,
        source: "shared",
        error,
        errorKind,
    });
}
function readPostHogActivityState() {
    const stateFilePath = getPostHogActivityStateFilePath();
    if (!existsSync(stateFilePath)) {
        return {};
    }
    try {
        const stateContent = readFileSync(stateFilePath, "utf-8");
        const stateJson = JSON.parse(stateContent);
        if (!isPostHogActivityState(stateJson)) {
            return {};
        }
        return stateJson;
    }
    catch (error) {
        writeActivityStateDiagnostic("telemetry_activity_state_read_failed", error, error instanceof Error ? "error" : "non_error");
        return {};
    }
}
function writePostHogActivityState(nextState) {
    const stateDir = getActivityStateDir();
    const stateFilePath = getPostHogActivityStateFilePath();
    try {
        mkdirSync(stateDir, { recursive: true });
        writeFileAtomically(stateFilePath, `${JSON.stringify(nextState, null, 2)}\n`);
    }
    catch (error) {
        writeActivityStateDiagnostic("telemetry_activity_state_write_failed", error, error instanceof Error ? "error" : "non_error");
        return;
    }
}
export function getPostHogActivityCaptureState(now = new Date()) {
    const state = readPostHogActivityState();
    const dayUTC = getUtcDayString(now);
    const captureDaily = state.lastActiveDayUTC !== dayUTC;
    if (captureDaily) {
        writePostHogActivityState({
            ...state,
            lastActiveDayUTC: dayUTC,
        });
    }
    return {
        dayUTC,
        captureDaily,
    };
}

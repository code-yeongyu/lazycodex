import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomically } from "./atomic-write.js";
import { getActivityStateDir } from "./data-path.js";
const DIAGNOSTICS_FILE_NAME = "telemetry-diagnostics.jsonl";
const DIAGNOSTICS_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const DIAGNOSTICS_MAX_BYTES = 256 * 1024;
export function getTelemetryDiagnosticsFilePath() {
    return join(getActivityStateDir(), DIAGNOSTICS_FILE_NAME);
}
export function writeTelemetryDiagnostic(input, now = new Date()) {
    try {
        cleanupTelemetryDiagnostics(now);
        mkdirSync(getActivityStateDir(), { recursive: true });
        appendFileSync(getTelemetryDiagnosticsFilePath(), `${JSON.stringify(toDiagnosticRecord(input, now))}\n`, "utf-8");
    }
    catch {
        return;
    }
}
export function cleanupTelemetryDiagnostics(now = new Date()) {
    const diagnosticsFilePath = getTelemetryDiagnosticsFilePath();
    if (!existsSync(diagnosticsFilePath)) {
        return;
    }
    try {
        const cutoffMs = now.getTime() - DIAGNOSTICS_RETENTION_MS;
        const retainedLines = trimToMaxBytes(readFileSync(diagnosticsFilePath, "utf-8")
            .split("\n")
            .filter((line) => shouldRetainLine(line, cutoffMs)));
        writeFileAtomically(diagnosticsFilePath, retainedLines.length === 0 ? "" : `${retainedLines.join("\n")}\n`);
    }
    catch {
        return;
    }
}
function toDiagnosticRecord(input, now) {
    return {
        timestamp: now.toISOString(),
        event: input.event,
        source: input.source,
        ...serializeError(input.error, input.errorKind),
    };
}
function serializeError(error, errorKind) {
    if (error instanceof Error) {
        return {
            error_kind: errorKind ?? "error",
            error_name: error.name,
            error_message: error.message,
        };
    }
    if (error === undefined) {
        return {};
    }
    return {
        error_kind: errorKind ?? "non_error",
        error_name: typeof error,
        error_message: String(error),
    };
}
function shouldRetainLine(line, cutoffMs) {
    if (line.length === 0) {
        return false;
    }
    const parsed = parseDiagnosticLine(line);
    if (parsed === null) {
        return false;
    }
    const timestamp = parsed["timestamp"];
    if (typeof timestamp !== "string") {
        return false;
    }
    const timestampMs = Date.parse(timestamp);
    return Number.isFinite(timestampMs) && timestampMs >= cutoffMs;
}
function parseDiagnosticLine(line) {
    try {
        const parsed = JSON.parse(line);
        if (!isRecord(parsed)) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function trimToMaxBytes(lines) {
    const retained = [];
    let totalBytes = 0;
    for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index];
        if (line === undefined) {
            continue;
        }
        const lineBytes = Buffer.byteLength(`${line}\n`, "utf-8");
        if (totalBytes + lineBytes > DIAGNOSTICS_MAX_BYTES) {
            break;
        }
        retained.unshift(line);
        totalBytes += lineBytes;
    }
    return retained;
}

import { readFileSync } from "node:fs";
export function readTranscriptSearchText(transcriptPath, options = {}) {
    try {
        const rawTranscript = readFileSync(transcriptPath, "utf8");
        if (options.latestCompactedReplacementOnly === true) {
            return latestCompactedReplacementSearchText(rawTranscript);
        }
        return [rawTranscript, ...collectJsonLineStrings(rawTranscript)].join("\n");
    }
    catch (error) {
        if (!(error instanceof Error)) {
            throw error;
        }
        return null;
    }
}
function latestCompactedReplacementSearchText(rawTranscript) {
    const lines = rawTranscript.split(/\r?\n/);
    let latestCompactedLineIndex = -1;
    let replacementHistory = null;
    for (const [index, line] of lines.entries()) {
        const parsed = parseJsonLine(line);
        if (!isRecord(parsed) || parsed["type"] !== "compacted") {
            continue;
        }
        const payload = parsed["payload"];
        if (!isRecord(payload)) {
            continue;
        }
        const candidateReplacementHistory = payload["replacement_history"];
        if (!Array.isArray(candidateReplacementHistory)) {
            continue;
        }
        latestCompactedLineIndex = index;
        replacementHistory = candidateReplacementHistory;
    }
    if (replacementHistory === null) {
        return null;
    }
    const values = [];
    collectStrings(replacementHistory, values);
    const laterTranscript = lines.slice(latestCompactedLineIndex + 1).join("\n");
    values.push(laterTranscript, ...collectJsonLineStrings(laterTranscript));
    return values.join("\n");
}
function collectJsonLineStrings(rawTranscript) {
    const values = [];
    for (const line of rawTranscript.split(/\r?\n/)) {
        const parsed = parseJsonLine(line);
        if (parsed !== null) {
            collectStrings(parsed, values);
        }
    }
    return values;
}
function parseJsonLine(line) {
    if (line.trim().length === 0) {
        return null;
    }
    try {
        const parsed = JSON.parse(line);
        return parsed;
    }
    catch (error) {
        if (!(error instanceof Error)) {
            throw error;
        }
        return null;
    }
}
function collectStrings(value, output) {
    if (typeof value === "string") {
        output.push(value);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            collectStrings(item, output);
        }
        return;
    }
    if (!isRecord(value)) {
        return;
    }
    for (const item of Object.values(value)) {
        collectStrings(item, output);
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

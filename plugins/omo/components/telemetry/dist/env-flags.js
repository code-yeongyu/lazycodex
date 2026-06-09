import { DEFAULT_POSTHOG_API_KEY, DEFAULT_POSTHOG_HOST, } from "./product-identity.js";
function normalizeEnvValue(value) {
    return value?.trim().toLowerCase();
}
function isDisableFlag(value) {
    const normalized = normalizeEnvValue(value);
    return normalized === "1" || normalized === "true";
}
function isTelemetryOptOutFlag(value) {
    const normalized = normalizeEnvValue(value);
    return normalized === "0" || normalized === "false" || normalized === "no";
}
export function shouldDisablePostHog() {
    return (isDisableFlag(process.env["OMO_DISABLE_POSTHOG"]) ||
        isTelemetryOptOutFlag(process.env["OMO_SEND_ANONYMOUS_TELEMETRY"]) ||
        isDisableFlag(process.env["OMO_CODEX_DISABLE_POSTHOG"]) ||
        isTelemetryOptOutFlag(process.env["OMO_CODEX_SEND_ANONYMOUS_TELEMETRY"]));
}
export function getPostHogApiKey() {
    const explicit = process.env["POSTHOG_API_KEY"];
    if (explicit === undefined) {
        return DEFAULT_POSTHOG_API_KEY;
    }
    return explicit.trim();
}
export function hasPostHogApiKey() {
    return getPostHogApiKey().length > 0;
}
export function getPostHogHost() {
    return process.env["POSTHOG_HOST"]?.trim() || DEFAULT_POSTHOG_HOST;
}

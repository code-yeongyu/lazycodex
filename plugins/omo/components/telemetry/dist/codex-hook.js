import { writeTelemetryDiagnostic, } from "./diagnostics.js";
import { createPluginPostHog, getPostHogDistinctId, } from "./posthog.js";
const SESSION_START_REASON = "session_start";
function writeHookDiagnostic(event, error, errorKind) {
    writeTelemetryDiagnostic({
        event,
        source: "plugin",
        error,
        errorKind,
    });
}
export async function runSessionStartHook(_input, options = {}) {
    const createClient = options.createClient ?? createPluginPostHog;
    const getDistinctId = options.getDistinctId ?? getPostHogDistinctId;
    let client;
    try {
        client = await createClient();
    }
    catch (error) {
        writeHookDiagnostic("telemetry_posthog_init_failed", error, error instanceof Error ? "error" : "non_error");
        return "";
    }
    try {
        client.trackActive(getDistinctId(), SESSION_START_REASON);
    }
    catch (error) {
        writeHookDiagnostic("telemetry_capture_failed", error, error instanceof Error ? "error" : "non_error");
        await safeShutdown(client);
        return "";
    }
    await safeShutdown(client);
    return "";
}
async function safeShutdown(client) {
    try {
        await client.shutdown();
    }
    catch (error) {
        writeHookDiagnostic("telemetry_shutdown_failed", error, error instanceof Error ? "error" : "non_error");
        return;
    }
}

import { createHash } from "node:crypto";
import os from "node:os";
import { writeTelemetryDiagnostic, } from "./diagnostics.js";
import { getPostHogApiKey, getPostHogHost, hasPostHogApiKey, shouldDisablePostHog } from "./env-flags.js";
import { getPostHogActivityCaptureState } from "./posthog-activity-state.js";
import { DEFAULT_POSTHOG_API_KEY, DEFAULT_POSTHOG_HOST, EVENT_NAME, getComponentVersion, PACKAGE_NAME, PRODUCT_NAME, } from "./product-identity.js";
export { DEFAULT_POSTHOG_API_KEY, DEFAULT_POSTHOG_HOST };
let osProviderOverride = null;
let activityStateProviderOverride = null;
const NO_OP_POSTHOG = {
    trackActive: () => undefined,
    shutdown: async () => undefined,
};
function resolveOsProvider() {
    return osProviderOverride ?? os;
}
function resolveActivityStateProvider() {
    return activityStateProviderOverride ?? getPostHogActivityCaptureState;
}
function writePostHogDiagnostic(event, source, error, errorKind) {
    writeTelemetryDiagnostic({ event, source, error, errorKind });
}
function getSafeCpuInfo() {
    try {
        const cpuInfo = resolveOsProvider().cpus();
        return {
            count: cpuInfo.length,
            model: cpuInfo[0]?.model,
        };
    }
    catch (error) {
        writePostHogDiagnostic("telemetry_cpu_info_unavailable", "plugin", error, error instanceof Error ? "error" : "non_error");
        return {
            count: 0,
            model: undefined,
        };
    }
}
function getSharedProperties() {
    const osProvider = resolveOsProvider();
    const cpuInfo = getSafeCpuInfo();
    return {
        platform: "omo-codex",
        product_name: PRODUCT_NAME,
        package_name: PACKAGE_NAME,
        package_version: getComponentVersion(),
        runtime: "node",
        runtime_version: process.version,
        source: "plugin",
        $os: osProvider.platform(),
        $os_version: osProvider.release(),
        os_arch: osProvider.arch(),
        os_type: osProvider.type(),
        cpu_count: cpuInfo.count,
        cpu_model: cpuInfo.model,
        total_memory_gb: Math.round(osProvider.totalmem() / 1024 / 1024 / 1024),
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        shell: process.env["SHELL"],
        ci: Boolean(process.env["CI"]),
        terminal: process.env["TERM_PROGRAM"],
    };
}
export async function createPluginPostHog() {
    if (shouldDisablePostHog() || !hasPostHogApiKey()) {
        return NO_OP_POSTHOG;
    }
    let PostHogClientConstructor;
    try {
        const module = await import("posthog-node");
        PostHogClientConstructor = module.PostHog;
    }
    catch (error) {
        writePostHogDiagnostic("telemetry_posthog_import_failed", "plugin", error, error instanceof Error ? "error" : "non_error");
        return NO_OP_POSTHOG;
    }
    let client;
    try {
        client = new PostHogClientConstructor(getPostHogApiKey(), {
            enableExceptionAutocapture: false,
            enableLocalEvaluation: false,
            strictLocalEvaluation: true,
            disableRemoteConfig: true,
            flushAt: 1,
            flushInterval: 0,
            host: getPostHogHost(),
            disableGeoip: false,
        });
    }
    catch (error) {
        writePostHogDiagnostic("telemetry_posthog_init_failed", "plugin", error, error instanceof Error ? "error" : "non_error");
        return NO_OP_POSTHOG;
    }
    const sharedProperties = getSharedProperties();
    return {
        trackActive: (distinctId, reason) => {
            const activityState = resolveActivityStateProvider()();
            if (!activityState.captureDaily) {
                return;
            }
            client.capture({
                distinctId,
                event: EVENT_NAME,
                properties: {
                    ...sharedProperties,
                    $process_person_profile: false,
                    day_utc: activityState.dayUTC,
                    reason,
                },
            });
        },
        shutdown: async () => client.shutdown(),
    };
}
export function getPostHogDistinctId() {
    return createHash("sha256").update(`omo-codex:${resolveOsProvider().hostname()}`).digest("hex");
}
/** @internal test-only */
export function __setOsProviderForTesting(provider) {
    osProviderOverride = provider;
}
/** @internal test-only */
export function __resetOsProviderForTesting() {
    osProviderOverride = null;
}
/** @internal test-only */
export function __setActivityStateProviderForTesting(provider) {
    activityStateProviderOverride = provider;
}
/** @internal test-only */
export function __resetActivityStateProviderForTesting() {
    activityStateProviderOverride = null;
}

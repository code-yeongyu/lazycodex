import os from "node:os";
import { getPostHogActivityCaptureState } from "./posthog-activity-state.js";
import { DEFAULT_POSTHOG_API_KEY, DEFAULT_POSTHOG_HOST } from "./product-identity.js";
export { DEFAULT_POSTHOG_API_KEY, DEFAULT_POSTHOG_HOST };
export type PostHogActivityReason = "session_start";
export type PostHogClient = {
    trackActive: (distinctId: string, reason: PostHogActivityReason) => void;
    shutdown: () => Promise<void>;
};
type OsProvider = Pick<typeof os, "arch" | "cpus" | "hostname" | "platform" | "release" | "totalmem" | "type">;
type ActivityStateProvider = typeof getPostHogActivityCaptureState;
export declare function createPluginPostHog(): Promise<PostHogClient>;
export declare function getPostHogDistinctId(): string;
/** @internal test-only */
export declare function __setOsProviderForTesting(provider: OsProvider): void;
/** @internal test-only */
export declare function __resetOsProviderForTesting(): void;
/** @internal test-only */
export declare function __setActivityStateProviderForTesting(provider: ActivityStateProvider): void;
/** @internal test-only */
export declare function __resetActivityStateProviderForTesting(): void;

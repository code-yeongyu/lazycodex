import { type PostHogClient } from "./posthog.js";
export type CodexSessionStartInput = {
    session_id: string;
    transcript_path: string | null;
    cwd: string;
    hook_event_name: "SessionStart";
    model: string;
    permission_mode: string;
    source: "startup" | "resume" | "clear";
};
export type CodexTelemetryHookOptions = {
    createClient?: () => PostHogClient | Promise<PostHogClient>;
    getDistinctId?: () => string;
};
export declare function runSessionStartHook(_input: CodexSessionStartInput, options?: CodexTelemetryHookOptions): Promise<string>;

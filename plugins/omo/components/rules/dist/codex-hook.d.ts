import type { CodexRulesHookOptions } from "./codex-hook-options.js";
export type { CodexRulesHookOptions } from "./codex-hook-options.js";
export type CodexSessionStartInput = {
    session_id: string;
    transcript_path: string | null;
    cwd: string;
    hook_event_name: "SessionStart";
    model: string;
    permission_mode: string;
    source: "startup" | "resume" | "clear" | "compact";
};
export type CodexUserPromptSubmitInput = {
    session_id: string;
    turn_id: string;
    transcript_path: string | null;
    cwd: string;
    hook_event_name: "UserPromptSubmit";
    model: string;
    permission_mode: string;
    prompt: string;
};
export type CodexPostToolUseInput = {
    session_id: string;
    turn_id: string;
    transcript_path: string | null;
    cwd: string;
    hook_event_name: "PostToolUse";
    model: string;
    permission_mode: string;
    tool_name: string;
    tool_input: unknown;
    tool_response: unknown;
    tool_use_id: string;
};
export type CodexPostCompactInput = {
    session_id: string;
    turn_id: string;
    transcript_path: string | null;
    cwd: string;
    hook_event_name: "PostCompact";
    model: string;
    trigger: "manual" | "auto";
};
export declare function runSessionStartHook(input: CodexSessionStartInput, options?: CodexRulesHookOptions): Promise<string>;
export declare function runPostCompactHook(input: CodexPostCompactInput, options?: CodexRulesHookOptions): Promise<string>;
export declare function runUserPromptSubmitHook(input: CodexUserPromptSubmitInput, options?: CodexRulesHookOptions): Promise<string>;
export declare function runPostToolUseHook(input: CodexPostToolUseInput, options?: CodexRulesHookOptions): Promise<string>;

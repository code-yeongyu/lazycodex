import { type CommentCheckRequest } from "./core.js";
import { type CommentCheckerRunner } from "./runner.js";
export type CodexPostToolUseInput = {
    session_id: string;
    turn_id: string;
    transcript_path: string | null;
    cwd: string;
    hook_event_name: "PostToolUse";
    model: string;
    permission_mode: string;
    tool_name: string;
    tool_input: Record<string, unknown>;
    tool_response: unknown;
    tool_use_id: string;
};
export type CodexHookOptions = {
    run?: CommentCheckerRunner;
};
export declare function extractCodexCommentCheckRequests(input: CodexPostToolUseInput): CommentCheckRequest[];
export declare function runCommentCheckerPostToolUse(input: CodexPostToolUseInput, options?: CodexHookOptions): Promise<string>;
export declare function runCodexHookCli(): Promise<void>;
export declare function parseCodexPostToolUseInput(input: string): CodexPostToolUseInput | undefined;

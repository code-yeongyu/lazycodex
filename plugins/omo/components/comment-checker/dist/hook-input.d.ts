import type { CommentCheckerHookInput, CommentCheckRequest } from "./types.js";
export declare function toHookInput(request: CommentCheckRequest, context: {
    readonly sessionId: string;
    readonly cwd: string;
    readonly transcriptPath?: string;
}): CommentCheckerHookInput;

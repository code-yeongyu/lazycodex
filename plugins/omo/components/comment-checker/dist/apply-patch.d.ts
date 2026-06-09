import type { CommentCheckRequest } from "./types.js";
export declare function extractApplyPatchRequests(event: {
    details?: unknown;
    input: Record<string, unknown>;
    toolName: string;
}): CommentCheckRequest[];
export declare function parseApplyPatchRequests(patch: string, sourceToolName?: string): CommentCheckRequest[];

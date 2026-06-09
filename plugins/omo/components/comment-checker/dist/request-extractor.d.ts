import type { CommentCheckRequest, ToolResultLike } from "./types.js";
export declare function extractCommentCheckRequests(event: ToolResultLike): CommentCheckRequest[];
export declare function isToolFailureOutput(text: string): boolean;

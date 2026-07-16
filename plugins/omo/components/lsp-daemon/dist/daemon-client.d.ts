import { type LspRequestContext } from "@oh-my-opencode/lsp-core/request-context";
import type { ToolExecutionResult } from "@oh-my-opencode/lsp-core/tools";
import { type DaemonPaths } from "./paths.js";
export declare class DaemonRequestError extends Error {
    readonly requestWritten: boolean;
    constructor(message: string, requestWritten: boolean);
}
export declare class DaemonAuthenticationRejectedError extends DaemonRequestError {
    constructor();
}
export declare class DaemonRequestCancelledError extends DaemonRequestError {
    constructor(requestWritten: boolean);
}
export type DaemonToolContext = LspRequestContext;
export interface CallToolOptions {
    context: DaemonToolContext;
    paths?: DaemonPaths;
    requestTimeoutMs?: number;
    signal?: AbortSignal;
    ensure?: (paths: DaemonPaths, signal?: AbortSignal) => Promise<void>;
}
export declare function callToolViaDaemon(name: string, args: Record<string, unknown>, options: CallToolOptions): Promise<ToolExecutionResult>;
export declare function callDiagnosticsViaDaemon(filePath: string, options: CallToolOptions): Promise<ToolExecutionResult>;
export declare function currentRequestContext(env?: NodeJS.ProcessEnv): DaemonToolContext;

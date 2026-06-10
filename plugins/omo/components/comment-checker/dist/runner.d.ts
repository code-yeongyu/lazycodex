import type { CommentCheckerHookInput } from "./core.js";
export type ProcessResult = {
    exitCode: number | null;
    stdout: string;
    stderr: string;
};
export declare const MAX_PROCESS_OUTPUT_BYTES: number;
export type ProcessExecutor = (command: string, args: string[], stdin: string) => Promise<ProcessResult>;
export type RunCommentCheckerOptions = {
    binaryPath?: string;
    customPrompt?: string;
    resolveBinary?: () => string | undefined;
    executor?: ProcessExecutor;
};
export type CommentCheckerRunResult = {
    status: "pass" | "warning" | "error" | "missing";
    message: string;
    binaryPath?: string;
    exitCode?: number | null;
    stdout?: string;
    stderr?: string;
};
export type CommentCheckerRunner = (input: CommentCheckerHookInput) => Promise<CommentCheckerRunResult>;
export declare function runCommentChecker(input: CommentCheckerHookInput, options?: RunCommentCheckerOptions): Promise<CommentCheckerRunResult>;
export declare function resolveCommentCheckerBinary(): string | undefined;
export declare function spawnProcess(command: string, args: string[], stdin: string, maxOutputBytes?: number): Promise<ProcessResult>;

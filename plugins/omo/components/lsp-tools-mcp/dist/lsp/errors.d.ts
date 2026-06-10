export declare class LspConnectionClosedError extends Error {
    readonly serverId: string;
    readonly root: string;
    readonly name = "LspConnectionClosedError";
    constructor(serverId: string, root: string, message?: string);
}
export declare class LspProcessExitedError extends Error {
    readonly serverId: string;
    readonly root: string;
    readonly exitCode: number | null;
    readonly stderrTail?: string | undefined;
    readonly name = "LspProcessExitedError";
    constructor(serverId: string, root: string, exitCode: number | null, stderrTail?: string | undefined);
}
export declare class LspRequestTimeoutError extends Error {
    readonly method: string;
    readonly stderrTail?: string | undefined;
    readonly name = "LspRequestTimeoutError";
    constructor(method: string, stderrTail?: string | undefined);
}
export declare class LspInvalidPathError extends Error {
    readonly name = "LspInvalidPathError";
}
export declare class LspServerLookupError extends Error {
    readonly name = "LspServerLookupError";
}
export declare class LspServerInitializingError extends Error {
    readonly originalError: LspRequestTimeoutError;
    readonly name = "LspServerInitializingError";
    constructor(originalError: LspRequestTimeoutError);
}
export declare class LspProcessSpawnError extends Error {
    readonly name = "LspProcessSpawnError";
}
export declare function isLspDeadConnectionError(err: unknown): err is LspConnectionClosedError | LspProcessExitedError;

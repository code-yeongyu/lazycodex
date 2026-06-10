export class LspConnectionClosedError extends Error {
    constructor(serverId, root, message) {
        super(message ?? `LSP connection closed for ${serverId} at ${root}`);
        this.serverId = serverId;
        this.root = root;
        this.name = "LspConnectionClosedError";
    }
}
export class LspProcessExitedError extends Error {
    constructor(serverId, root, exitCode, stderrTail) {
        const stderrSuffix = stderrTail ? `\nstderr tail: ${stderrTail}` : "";
        super(`LSP server ${serverId} at ${root} exited with code ${exitCode ?? "null"}${stderrSuffix}`);
        this.serverId = serverId;
        this.root = root;
        this.exitCode = exitCode;
        this.stderrTail = stderrTail;
        this.name = "LspProcessExitedError";
    }
}
export class LspRequestTimeoutError extends Error {
    constructor(method, stderrTail) {
        const stderrSuffix = stderrTail ? `\nrecent stderr: ${stderrTail}` : "";
        super(`LSP request timeout (method: ${method})${stderrSuffix}`);
        this.method = method;
        this.stderrTail = stderrTail;
        this.name = "LspRequestTimeoutError";
    }
}
export class LspInvalidPathError extends Error {
    constructor() {
        super(...arguments);
        this.name = "LspInvalidPathError";
    }
}
export class LspServerLookupError extends Error {
    constructor() {
        super(...arguments);
        this.name = "LspServerLookupError";
    }
}
export class LspServerInitializingError extends Error {
    constructor(originalError) {
        super(`LSP server is still initializing. Please retry in a few seconds. Original error: ${originalError.message}`);
        this.originalError = originalError;
        this.name = "LspServerInitializingError";
    }
}
export class LspProcessSpawnError extends Error {
    constructor() {
        super(...arguments);
        this.name = "LspProcessSpawnError";
    }
}
export function isLspDeadConnectionError(err) {
    return err instanceof LspConnectionClosedError || err instanceof LspProcessExitedError;
}

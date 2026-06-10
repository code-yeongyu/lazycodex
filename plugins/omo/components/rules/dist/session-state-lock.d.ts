export declare const SESSION_STATE_LOCK_CONTENDED: unique symbol;
export type SessionStateLockResult<T> = T | typeof SESSION_STATE_LOCK_CONTENDED;
export declare function withSessionStateLock<T>(cachePath: string, callback: () => T): SessionStateLockResult<T>;

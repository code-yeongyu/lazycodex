type DebugFieldValue = boolean | number | string | null;
type DebugFields = Record<string, DebugFieldValue>;
export interface HookDebugTimer {
    lap(phase: string, fields?: DebugFields): void;
    done(fields?: DebugFields): void;
}
export declare function createHookDebugTimer(hookName: string): HookDebugTimer;
export {};

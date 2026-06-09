import type { LoadedRule, SessionState } from "./types.js";
export declare function createSessionState(cwd?: string): SessionState;
export declare function staticDedupKey(cwd: string, rulePath: string, contentHash: string): string;
export declare function dynamicDedupKey(rulePath: string, contentHash: string): string;
export declare function markStaticInjected(state: SessionState, rule: LoadedRule): boolean;
export declare function markDynamicInjected(state: SessionState, rule: LoadedRule): boolean;
export declare function isStaticInjected(state: SessionState, rule: LoadedRule): boolean;
export declare function isDynamicInjected(state: SessionState, rule: LoadedRule): boolean;
export declare function clearSession(state: SessionState): void;

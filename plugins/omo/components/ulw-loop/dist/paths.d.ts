export interface UlwLoopScope {
    readonly sessionId?: string | null;
}
type EnvMap = Readonly<Record<string, string | undefined>>;
export declare function normalizeUlwLoopSessionId(sessionId: string | null | undefined): string | null;
export declare function resolveUlwLoopSessionIdFromEnv(env?: EnvMap): string | null;
export declare function ulwLoopRelativeDir(scope?: UlwLoopScope): string;
export declare function ulwLoopDir(repoRoot: string, scope?: UlwLoopScope): string;
export declare function ulwLoopBriefRelativePath(scope?: UlwLoopScope): string;
export declare function ulwLoopGoalsRelativePath(scope?: UlwLoopScope): string;
export declare function ulwLoopLedgerRelativePath(scope?: UlwLoopScope): string;
export declare function ulwLoopBriefPath(repoRoot: string, scope?: UlwLoopScope): string;
export declare function ulwLoopGoalsPath(repoRoot: string, scope?: UlwLoopScope): string;
export declare function ulwLoopLedgerPath(repoRoot: string, scope?: UlwLoopScope): string;
export declare function repoRelative(absolutePath: string, repoRoot: string): string;
export {};

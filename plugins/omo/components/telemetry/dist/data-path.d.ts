import os from "node:os";
type OsProvider = Pick<typeof os, "homedir" | "tmpdir">;
export declare function getOsProvider(): OsProvider;
/** @internal test-only */
export declare function __setOsProviderForTesting(provider: OsProvider): void;
/** @internal test-only */
export declare function __resetOsProviderForTesting(): void;
export declare function getDataDir(): string;
export declare function getActivityStateDir(): string;
export {};

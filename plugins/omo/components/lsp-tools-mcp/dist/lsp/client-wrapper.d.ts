import type { LspClient } from "./client.js";
import { type LspManager } from "./manager.js";
import type { ServerLookupResult } from "./types.js";
export declare function isDirectoryPath(filePath: string): boolean;
export declare function findWorkspaceRoot(filePath: string): string;
export declare function formatServerLookupError(result: Exclude<ServerLookupResult, {
    status: "found";
}>): string;
export interface WithLspClientOptions {
    signal?: AbortSignal;
    manager?: LspManager;
}
export declare function withLspClient<T>(filePath: string, fn: (client: LspClient) => Promise<T>, toolName: string, options?: WithLspClientOptions): Promise<T>;

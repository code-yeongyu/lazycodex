import { LspClient } from "./client.js";
import type { ResolvedServer } from "./types.js";
export interface ClientSnapshot {
    root: string;
    serverId: string;
    refCount: number;
    pendingWaiters: number;
    lastUsedAt: number;
    isInitializing: boolean;
    alive: boolean;
    command: string[];
}
export interface LspManagerOptions {
    idleTimeoutMs?: number;
    initTimeoutMs?: number;
    reaperIntervalMs?: number;
    clientFactory?: (root: string, server: ResolvedServer) => LspClient;
    now?: () => number;
}
export declare class LspManager {
    private readonly clients;
    private reaperHandle;
    private signalDisposer;
    private disposed;
    private readonly idleTimeoutMs;
    private readonly initTimeoutMs;
    private readonly reaperIntervalMs;
    private readonly clientFactory;
    private readonly now;
    constructor(options?: LspManagerOptions);
    private startReaper;
    private getKey;
    private reapStale;
    private tryDeleteIfOrphaned;
    getClient(root: string, server: ResolvedServer, signal?: AbortSignal): Promise<LspClient>;
    releaseClient(root: string, serverId: string): void;
    invalidateClient(root: string, serverId: string, client?: LspClient): void;
    warmupClient(root: string, server: ResolvedServer): void;
    isServerInitializing(root: string, serverId: string): boolean;
    getSnapshot(): ClientSnapshot[];
    hasClient(root: string, serverId: string): boolean;
    clientCount(): number;
    stopAll(): Promise<void>;
}
export declare function getLspManager(): LspManager;
export declare function disposeDefaultLspManager(): Promise<void>;

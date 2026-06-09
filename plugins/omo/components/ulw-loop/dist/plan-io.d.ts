import { type UlwLoopScope } from "./paths.js";
import type { UlwLoopLedgerEntry, UlwLoopPlan } from "./types.js";
export declare function withUlwLoopMutationLock<T>(repoRoot: string, fn: () => Promise<T>): Promise<T>;
export declare function withUlwLoopMutationLock<T>(repoRoot: string, scope: UlwLoopScope | undefined, fn: () => Promise<T>): Promise<T>;
export declare function readUlwLoopPlan(repoRoot: string, scope?: UlwLoopScope): Promise<UlwLoopPlan>;
export declare function writePlan(repoRoot: string, plan: UlwLoopPlan, scope?: UlwLoopScope): Promise<void>;
export declare function appendLedger(repoRoot: string, entry: UlwLoopLedgerEntry, scope?: UlwLoopScope): Promise<void>;
export declare function readSteeringLedgerEntries(repoRoot: string, scope?: UlwLoopScope): Promise<UlwLoopLedgerEntry[]>;

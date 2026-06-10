import type { ReadonlyFileSystem } from "./types.js";
export type PlanChecklist = {
    readonly remaining: number;
    readonly total: number;
    readonly nextTaskLabel: string | null;
};
export type ContinuationState = {
    readonly planName: string;
    readonly planPath: string;
    readonly boulderPath: string;
    readonly ledgerPath: string;
    readonly worktreePath: string | null;
    readonly checklist: PlanChecklist;
};
export declare function parsePlanChecklist(markdown: string): PlanChecklist;
export declare function readContinuationState(cwd: string, sessionId: string, fs: ReadonlyFileSystem): ContinuationState | null;

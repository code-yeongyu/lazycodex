import { type UlwLoopScope } from "./paths.js";
import type { UlwLoopCodexGoalMode, UlwLoopItem, UlwLoopPlan, UlwLoopSuccessCriterion } from "./types.js";
export type UlwLoopPlanSummary = {
    readonly total: number;
    readonly pending: number;
    readonly in_progress: number;
    readonly complete: number;
    readonly failed: number;
    readonly blocked: number;
    readonly review_blocked: number;
    readonly needs_user_decision: number;
    readonly superseded: number;
    readonly criteria: {
        readonly total: number;
        readonly pass: number;
        readonly pending: number;
        readonly fail: number;
        readonly blocked: number;
    };
};
export declare function seedDefaultSuccessCriteria(goalIndex: number, objective: string): UlwLoopSuccessCriterion[];
export declare function deriveGoalCandidates(brief: string): Array<{
    title: string;
    objective: string;
}>;
export declare function createUlwLoopPlan(repoRoot: string, args: {
    brief: string;
    codexGoalMode?: UlwLoopCodexGoalMode;
    force?: boolean;
}, scope?: UlwLoopScope): Promise<UlwLoopPlan>;
export declare function addUlwLoopGoal(repoRoot: string, args: {
    title: string;
    objective: string;
}, scope?: UlwLoopScope): Promise<{
    plan: UlwLoopPlan;
    goal: UlwLoopItem;
}>;
export declare function startNextUlwLoop(repoRoot: string, args?: {
    retryFailed?: boolean;
}, scope?: UlwLoopScope): Promise<{
    plan: UlwLoopPlan;
    goal: UlwLoopItem;
    resumed: boolean;
} | {
    done: true;
    plan: UlwLoopPlan;
}>;
export declare function summarizeUlwLoopPlan(plan: UlwLoopPlan): UlwLoopPlanSummary;

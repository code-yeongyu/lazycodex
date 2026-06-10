import type { PiRulesConfig } from "./rules/types.js";
export interface PostCompactBudgetContext {
    readonly model: string;
    readonly transcriptPath: string | null;
}
export declare function withPostCompactBudget(config: PiRulesConfig, context?: PostCompactBudgetContext): PiRulesConfig;

import type { TruncationResult } from "./types.js";
type BudgetRule = {
    body: string;
    relativePath: string;
};
type BudgetResult = BudgetRule & {
    truncated: boolean;
};
export declare function truncateRule(body: string, options: {
    maxChars: number;
    relativePath: string;
}): TruncationResult;
export declare function truncateBudget(input: {
    rules: ReadonlyArray<BudgetRule>;
    maxResultChars: number;
}): BudgetResult[];
export {};

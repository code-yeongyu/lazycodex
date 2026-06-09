import type { LoadedRule } from "./types.js";
export interface FormatOptions {
    maxRuleChars: number;
    maxResultChars: number;
}
export declare function formatStaticBlock(rules: ReadonlyArray<LoadedRule>, options: FormatOptions): string;
export declare function formatDynamicBlock(rules: ReadonlyArray<LoadedRule>, targetRelativePath: string, options: FormatOptions): string;

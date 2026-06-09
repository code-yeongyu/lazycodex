import type { RuleSource } from "./types.js";
export declare function toProjectRuleSource(parentDirectory: string, subDirectory: string): RuleSource;
export declare function toProjectSingleFileSource(ruleFile: string): RuleSource;
export declare function toUserHomeRuleSource(ruleSubdir: string): RuleSource;
export declare function toUserHomeSingleFileSource(ruleFile: string): RuleSource;

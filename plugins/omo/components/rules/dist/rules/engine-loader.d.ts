import type { CandidateProjectMembership, EngineDeps, LoadedRuleContent } from "./engine-types.js";
import type { LoadedRule, MatchReason, RuleCandidate, RuleDiagnostic } from "./types.js";
export declare function loadCandidate(candidate: RuleCandidate, deps: EngineDeps, diagnostics: RuleDiagnostic[], projectRoot: string | null, loadedRuleContent?: Map<string, LoadedRuleContent | null>, projectMembership?: CandidateProjectMembership): (LoadedRule & {
    matchReason: MatchReason;
}) | null;
export declare function ruleDedupKey(rule: LoadedRule): string;
export declare function staticMatchReason(rule: LoadedRule): MatchReason | null;

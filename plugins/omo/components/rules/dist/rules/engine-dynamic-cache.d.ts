import type { CandidateDiscoveryCache, DynamicMatchCache, EngineDeps } from "./engine-types.js";
import type { matchRule } from "./matcher.js";
import type { LoadedRule, MatchReason, RuleCandidate } from "./types.js";
export declare function matchDynamicRuleCached(cache: DynamicMatchCache, projectRoot: string | null, targetFile: string, candidate: RuleCandidate, loadedRule: LoadedRule, matchRuleImpl: typeof matchRule): MatchReason | null;
export declare function findSortedCandidatesCached(cache: CandidateDiscoveryCache, findCandidates: EngineDeps["findCandidates"], options: Parameters<EngineDeps["findCandidates"]>[0]): RuleCandidate[];

import type { EngineDeps } from "./engine-types.js";
import type { LoadedRule, RuleCandidate, RuleDiagnostic } from "./types.js";
export declare function loadStaticCandidates(candidates: ReadonlyArray<RuleCandidate>, deps: EngineDeps, projectRoot: string | null): {
    rules: LoadedRule[];
    diagnostics: RuleDiagnostic[];
};

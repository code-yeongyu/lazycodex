import type { DynamicMatchCache, EngineDeps } from "./engine-types.js";
import type { LoadedRule, PiRulesConfig, RuleDiagnostic } from "./types.js";
export declare function loadDynamicCandidates(config: PiRulesConfig, deps: EngineDeps, cwd: string, targetPaths: ReadonlyArray<string>, dynamicMatchCache: DynamicMatchCache): {
    rules: LoadedRule[];
    diagnostics: RuleDiagnostic[];
};

import type { RuleCandidate } from "./types.js";
export declare function sortCandidates<T extends RuleCandidate>(candidates: ReadonlyArray<T>): T[];
export declare function compareCandidates(a: RuleCandidate, b: RuleCandidate): number;

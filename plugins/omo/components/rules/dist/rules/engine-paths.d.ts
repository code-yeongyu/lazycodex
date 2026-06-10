import type { CandidateProjectMembership } from "./engine-types.js";
import type { RuleCandidate } from "./types.js";
export declare function isCandidateWithinProjectCached(candidate: RuleCandidate, projectRoot: string | null, projectMembership: CandidateProjectMembership | undefined): boolean;
export declare function isSameOrChildPath(childPath: string, parentPath: string): boolean;
export declare function isRootSingleFile(candidate: RuleCandidate): boolean;
export declare function pathBasesForTarget(projectRoot: string | null, targetFile: string, candidate: RuleCandidate): {
    projectRelative: string;
    scopeRelative?: string;
    basename: string;
};
export declare function toPosixPath(path: string): string;

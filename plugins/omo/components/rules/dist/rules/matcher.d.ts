import type { MatchReason, RuleFrontmatter } from "./types.js";
export interface MatcherInput {
    frontmatter: RuleFrontmatter;
    isSingleFile: boolean;
    /** Path bases to try matching against (POSIX-normalized). */
    pathBases: {
        projectRelative: string;
        scopeRelative?: string;
        basename: string;
    };
}
export interface MatchResult {
    matched: boolean;
    reason: MatchReason;
}
export declare function matchRule(input: MatcherInput): MatchResult;
export declare function normalizeGlobs(frontmatter: RuleFrontmatter): string[];
export declare function hashContent(body: string): string;

import { createHash } from "node:crypto";
import picomatch from "picomatch";
const compiledPatternSets = new Map();
export function matchRule(input) {
    if (input.isSingleFile) {
        return { matched: true, reason: "single-file" };
    }
    if (input.frontmatter.alwaysApply === true) {
        return { matched: true, reason: "alwaysApply" };
    }
    const patterns = normalizeGlobs(input.frontmatter);
    if (patterns.length === 0) {
        return noMatch();
    }
    const pathBases = normalizedPathBases(input.pathBases);
    const { positivePatterns, negativeMatchers } = compiledPatternSetFor(patterns);
    for (const { pattern, isMatch } of positivePatterns) {
        for (const pathBase of pathBases) {
            if (!isMatch(pathBase)) {
                continue;
            }
            if (isExcluded(pathBase, negativeMatchers)) {
                return noMatch();
            }
            return { matched: true, reason: { kind: "glob", pattern } };
        }
    }
    return noMatch();
}
export function normalizeGlobs(frontmatter) {
    const patterns = [
        ...normalizePatternList(frontmatter.globs),
        ...normalizePatternList(frontmatter.paths),
        ...normalizePatternList(frontmatter.applyTo),
    ];
    return [...new Set(patterns.map(normalizePath))];
}
export function hashContent(body) {
    return createHash("sha256").update(body).digest("hex");
}
function normalizePatternList(patterns) {
    if (patterns === undefined) {
        return [];
    }
    return Array.isArray(patterns) ? patterns : [patterns];
}
function normalizePath(path) {
    return path.replaceAll("\\", "/");
}
function normalizedPathBases(pathBases) {
    const normalizedBases = [normalizePath(pathBases.projectRelative)];
    if (pathBases.scopeRelative !== undefined) {
        normalizedBases.push(normalizePath(pathBases.scopeRelative));
    }
    normalizedBases.push(normalizePath(pathBases.basename));
    return normalizedBases;
}
function compiledPatternSetFor(patterns) {
    const cacheKey = JSON.stringify(patterns);
    const cached = compiledPatternSets.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    const compiled = compilePatternSet(patterns);
    compiledPatternSets.set(cacheKey, compiled);
    return compiled;
}
function compilePatternSet(patterns) {
    const positivePatterns = [];
    const negativeMatchers = [];
    for (const pattern of patterns) {
        if (pattern.startsWith("!")) {
            negativeMatchers.push(createGlobMatcher(pattern.slice(1)));
            continue;
        }
        positivePatterns.push({ pattern, isMatch: createGlobMatcher(pattern) });
    }
    return { positivePatterns, negativeMatchers };
}
function createGlobMatcher(pattern) {
    return picomatch(normalizePath(pattern), { bash: true, dot: true });
}
function isExcluded(pathBase, negativeMatchers) {
    for (const isMatch of negativeMatchers) {
        if (isMatch(pathBase)) {
            return true;
        }
    }
    return false;
}
function noMatch() {
    return { matched: false, reason: { kind: "no-match" } };
}

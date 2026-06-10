import { dirname, resolve } from "node:path";
import { pathBasesForTarget, toPosixPath } from "./engine-paths.js";
import { sortCandidates } from "./ordering.js";
const MAX_DYNAMIC_MATCH_CACHE_ENTRIES = 4096;
export function matchDynamicRuleCached(cache, projectRoot, targetFile, candidate, loadedRule, matchRuleImpl) {
    const cacheKey = dynamicMatchCacheKey(projectRoot, targetFile, candidate, loadedRule.contentHash);
    if (cache.has(cacheKey)) {
        const cachedReason = cache.get(cacheKey) ?? null;
        cache.delete(cacheKey);
        cache.set(cacheKey, cachedReason);
        return cachedReason;
    }
    const matchResult = matchRuleImpl({
        frontmatter: loadedRule.frontmatter,
        isSingleFile: candidate.isSingleFile,
        pathBases: pathBasesForTarget(projectRoot, targetFile, candidate),
    });
    const reason = matchResult.matched ? matchResult.reason : null;
    setDynamicMatchCacheEntry(cache, cacheKey, reason);
    return reason;
}
export function findSortedCandidatesCached(cache, findCandidates, options) {
    const cacheKey = candidateDiscoveryCacheKey(options);
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    const candidates = sortCandidates(findCandidates(options));
    cache.set(cacheKey, candidates);
    return candidates;
}
function setDynamicMatchCacheEntry(cache, cacheKey, reason) {
    if (cache.size >= MAX_DYNAMIC_MATCH_CACHE_ENTRIES) {
        const oldestCacheKey = cache.keys().next().value;
        if (oldestCacheKey !== undefined) {
            cache.delete(oldestCacheKey);
        }
    }
    cache.set(cacheKey, reason);
}
function dynamicMatchCacheKey(projectRoot, targetFile, candidate, contentHash) {
    return [
        projectRoot ?? "",
        toPosixPath(resolve(targetFile)),
        candidate.realPath,
        candidate.relativePath,
        candidate.source,
        candidate.isGlobal ? "global" : "project",
        candidate.isSingleFile ? "single" : "multi",
        String(candidate.distance),
        contentHash,
    ].join("\0");
}
function candidateDiscoveryCacheKey(options) {
    return [
        options.projectRoot ?? "",
        options.targetFile === null ? "" : dirname(resolve(options.targetFile)),
        ...[...(options.disabledSources ?? [])].sort(),
    ].join("\0");
}

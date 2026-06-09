import { findSortedCandidatesCached, matchDynamicRuleCached } from "./engine-dynamic-cache.js";
import { loadCandidate, ruleDedupKey } from "./engine-loader.js";
import { isSameOrChildPath } from "./engine-paths.js";
import { createRuleDiscoveryCache } from "./finder.js";
import { matchRule } from "./matcher.js";
import { sortCandidates } from "./ordering.js";
import { disabledSourcesFromConfig } from "./sources.js";
export function loadDynamicCandidates(config, deps, cwd, targetPaths, dynamicMatchCache) {
    const rules = [];
    const diagnostics = [];
    const seenRules = new Set();
    const loadedRuleContent = new Map();
    const projectMembership = new Map();
    const disabledSources = disabledSourcesFromConfig(config);
    const discoveryCache = createRuleDiscoveryCache();
    const candidateDiscoveryCache = new Map();
    const cwdProjectRoot = deps.findProjectRoot(cwd);
    for (const targetFile of uniqueStrings(targetPaths)) {
        const projectRoot = cwdProjectRoot !== null && isSameOrChildPath(targetFile, cwdProjectRoot)
            ? cwdProjectRoot
            : deps.findProjectRoot(targetFile);
        const findOptions = {
            projectRoot,
            targetFile,
            cache: discoveryCache,
        };
        if (disabledSources !== undefined) {
            findOptions.disabledSources = disabledSources;
        }
        const candidates = findSortedCandidatesCached(candidateDiscoveryCache, deps.findCandidates, findOptions);
        for (const candidate of candidates) {
            const loadedRule = loadCandidate(candidate, deps, diagnostics, projectRoot, loadedRuleContent, projectMembership);
            if (loadedRule === null) {
                continue;
            }
            const matchReason = matchDynamicRuleCached(dynamicMatchCache, projectRoot, targetFile, candidate, loadedRule, deps.matchRule ?? matchRule);
            if (matchReason === null) {
                continue;
            }
            const dedupKey = ruleDedupKey(loadedRule);
            if (seenRules.has(dedupKey)) {
                continue;
            }
            seenRules.add(dedupKey);
            rules.push({ ...loadedRule, matchReason });
        }
    }
    return { rules: sortCandidates(rules), diagnostics };
}
function uniqueStrings(values) {
    const uniqueValues = [];
    const seenValues = new Set();
    for (const value of values) {
        if (seenValues.has(value)) {
            continue;
        }
        seenValues.add(value);
        uniqueValues.push(value);
    }
    return uniqueValues;
}

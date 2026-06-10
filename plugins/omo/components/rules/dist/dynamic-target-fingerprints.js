import { statSync } from "node:fs";
import { resolve } from "node:path";
import { isSameOrChildPath, toPosixPath, uniqueStrings } from "./path-utils.js";
import { createRuleDiscoveryCache, findRuleCandidates } from "./rules/finder.js";
import { hashContent } from "./rules/matcher.js";
import { sortCandidates } from "./rules/ordering.js";
import { findProjectRoot } from "./rules/project-root.js";
import { disabledSourcesFromConfig } from "./rules/sources.js";
export function fingerprintDynamicTargets(cwd, targetPaths, config) {
    const disabledSources = disabledSourcesFromConfig(config);
    const discoveryCache = createRuleDiscoveryCache();
    const cwdProjectRoot = findProjectRoot(cwd);
    const fingerprints = [];
    for (const targetPath of uniqueStrings(targetPaths)) {
        const projectRoot = cwdProjectRoot !== null && isSameOrChildPath(targetPath, cwdProjectRoot)
            ? cwdProjectRoot
            : findProjectRoot(targetPath);
        const findOptions = {
            projectRoot,
            targetFile: targetPath,
            cache: discoveryCache,
        };
        if (disabledSources !== undefined) {
            findOptions.disabledSources = disabledSources;
        }
        const candidates = findRuleCandidates(findOptions);
        const candidateFingerprint = sortCandidates(candidates).map(fingerprintCandidate).join("\u0001");
        const cacheKey = dynamicTargetCacheKey(targetPath);
        fingerprints.push({
            targetPath,
            cacheKey,
            fingerprint: hashContent([
                "v1",
                config.enabledSources === "auto" ? "auto" : config.enabledSources.join(","),
                projectRoot ?? "",
                cacheKey,
                candidateFingerprint,
            ].join("\u0000")),
        });
    }
    return fingerprints;
}
function fingerprintCandidate(candidate) {
    return [
        candidate.realPath,
        candidate.relativePath,
        candidate.source,
        candidate.isGlobal ? "global" : "project",
        candidate.isSingleFile ? "single" : "multi",
        String(candidate.distance),
        fileFingerprint(candidate.path),
    ].join("\u0000");
}
function fileFingerprint(filePath) {
    try {
        const stats = statSync(filePath, { bigint: true });
        return `${stats.mtimeNs}:${stats.ctimeNs}:${stats.size}`;
    }
    catch {
        return "missing";
    }
}
function dynamicTargetCacheKey(targetPath) {
    return toPosixPath(resolve(targetPath));
}

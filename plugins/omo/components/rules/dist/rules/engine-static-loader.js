import { loadCandidate, staticMatchReason } from "./engine-loader.js";
import { isRootSingleFile } from "./engine-paths.js";
import { sortCandidates } from "./ordering.js";
export function loadStaticCandidates(candidates, deps, projectRoot) {
    const rules = [];
    const diagnostics = [];
    let rootSingleFileSelected = false;
    for (const candidate of sortCandidates(candidates)) {
        if (isDedupedRootSingleFile(candidate, rootSingleFileSelected)) {
            continue;
        }
        const loadedRule = loadCandidate(candidate, deps, diagnostics, projectRoot);
        if (loadedRule === null) {
            continue;
        }
        const matchReason = staticMatchReason(loadedRule);
        if (matchReason === null) {
            continue;
        }
        if (isRootSingleFile(candidate)) {
            rootSingleFileSelected = true;
        }
        rules.push({ ...loadedRule, matchReason });
    }
    return { rules: sortCandidates(rules), diagnostics };
}
function isDedupedRootSingleFile(candidate, rootSingleFileSelected) {
    return rootSingleFileSelected && isRootSingleFile(candidate);
}

import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { BUNDLED_RULE_SUBDIR, GLOBAL_DISTANCE, PROJECT_RULE_SUBDIRS, PROJECT_SINGLE_FILES, USER_HOME_RULE_SUBDIRS, USER_HOME_SINGLE_FILES, } from "./constants.js";
import { scanRuleFilesCached, singleFileInfoCached } from "./finder-cache.js";
import { getWalkDirectories, toRelativePath } from "./finder-paths.js";
import { toProjectRuleSource, toProjectSingleFileSource, toUserHomeRuleSource, toUserHomeSingleFileSource, } from "./finder-sources.js";
import { resolvePluginRulesRoot } from "./plugin-root.js";
export { createRuleDiscoveryCache } from "./finder-cache.js";
const WINDOWS_GIT_BASH_BUNDLED_RULE_PATH = "bundled-rules/windows-git-bash.md";
export function findRuleCandidates(options) {
    const skipUserHome = options.skipUserHome ?? false;
    const disabledSources = options.disabledSources ?? new Set();
    const candidates = [];
    const homeDirectory = resolve(options.homeDir ?? homedir());
    if (options.projectRoot !== null) {
        candidates.push(...findProjectCandidates(options.projectRoot, options.targetFile, disabledSources, options.cache));
    }
    const pluginBundledOptions = {
        disabledSources,
        ...(options.cache === undefined ? {} : { cache: options.cache }),
        ...(options.pluginRoot === undefined ? {} : { pluginRoot: options.pluginRoot }),
        ...(options.platform === undefined ? {} : { platform: options.platform }),
    };
    candidates.push(...findPluginBundledCandidates(pluginBundledOptions));
    if (!skipUserHome) {
        candidates.push(...findUserHomeCandidates(homeDirectory, disabledSources, options.cache));
    }
    return candidates;
}
export function findPluginBundledCandidates(options = {}) {
    if (options.disabledSources?.has("plugin-bundled") === true) {
        return [];
    }
    const pluginRoot = resolvePluginRulesRoot(options.pluginRoot);
    const ruleDirectory = join(pluginRoot, BUNDLED_RULE_SUBDIR);
    const platform = options.platform ?? process.platform;
    const candidates = [];
    for (const scannedFile of scanRuleFilesCached(ruleDirectory, options.cache)) {
        const candidate = {
            path: scannedFile.path,
            realPath: scannedFile.realPath,
            source: "plugin-bundled",
            distance: GLOBAL_DISTANCE,
            isGlobal: true,
            isSingleFile: false,
            relativePath: toRelativePath(pluginRoot, scannedFile.path),
        };
        if (isPluginBundledCandidateEnabled(candidate, platform)) {
            candidates.push(candidate);
        }
    }
    return candidates;
}
function isPluginBundledCandidateEnabled(candidate, platform) {
    return candidate.relativePath !== WINDOWS_GIT_BASH_BUNDLED_RULE_PATH || platform === "win32";
}
function findProjectCandidates(projectRoot, targetFile, disabledSources, cache) {
    const rootDirectory = resolve(projectRoot);
    const walkDirectories = getWalkDirectories(rootDirectory, targetFile);
    const candidates = [];
    for (const walkDirectory of walkDirectories) {
        for (const [parentDirectory, subDirectory] of PROJECT_RULE_SUBDIRS) {
            const source = toProjectRuleSource(parentDirectory, subDirectory);
            if (disabledSources.has(source)) {
                continue;
            }
            const ruleDirectory = join(walkDirectory.directory, parentDirectory, subDirectory);
            for (const scannedFile of scanRuleFilesCached(ruleDirectory, cache)) {
                candidates.push({
                    path: scannedFile.path,
                    realPath: scannedFile.realPath,
                    source,
                    distance: targetFile === null ? 0 : walkDirectory.distance,
                    isGlobal: false,
                    isSingleFile: false,
                    relativePath: toRelativePath(rootDirectory, scannedFile.path),
                });
            }
        }
    }
    for (const walkDirectory of walkDirectories) {
        for (const ruleFile of PROJECT_SINGLE_FILES) {
            const source = toProjectSingleFileSource(ruleFile);
            if (disabledSources.has(source)) {
                continue;
            }
            const filePath = join(walkDirectory.directory, ruleFile);
            const fileInfo = singleFileInfoCached(filePath, cache);
            if (fileInfo === null) {
                continue;
            }
            candidates.push({
                path: fileInfo.path,
                realPath: fileInfo.realPath,
                source,
                distance: targetFile === null ? 0 : walkDirectory.distance,
                isGlobal: false,
                isSingleFile: true,
                relativePath: toRelativePath(rootDirectory, filePath),
            });
        }
    }
    return candidates;
}
function findUserHomeCandidates(homeDirectory, disabledSources, cache) {
    const candidates = [];
    for (const ruleSubdir of USER_HOME_RULE_SUBDIRS) {
        const source = toUserHomeRuleSource(ruleSubdir);
        if (disabledSources.has(source)) {
            continue;
        }
        const ruleDirectory = join(homeDirectory, ruleSubdir);
        for (const scannedFile of scanRuleFilesCached(ruleDirectory, cache)) {
            candidates.push({
                path: scannedFile.path,
                realPath: scannedFile.realPath,
                source,
                distance: GLOBAL_DISTANCE,
                isGlobal: true,
                isSingleFile: false,
                relativePath: toRelativePath(homeDirectory, scannedFile.path),
            });
        }
    }
    for (const ruleFile of USER_HOME_SINGLE_FILES) {
        const source = toUserHomeSingleFileSource(ruleFile);
        if (disabledSources.has(source)) {
            continue;
        }
        const filePath = join(homeDirectory, ruleFile);
        const fileInfo = singleFileInfoCached(filePath, cache);
        if (fileInfo === null) {
            continue;
        }
        candidates.push({
            path: fileInfo.path,
            realPath: fileInfo.realPath,
            source,
            distance: GLOBAL_DISTANCE,
            isGlobal: true,
            isSingleFile: true,
            relativePath: toRelativePath(homeDirectory, filePath),
        });
    }
    return candidates;
}

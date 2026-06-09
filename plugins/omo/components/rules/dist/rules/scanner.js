import { existsSync, lstatSync, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { DEFAULT_MAX_SCAN_FILES, RULE_FILE_EXTENSIONS, SCANNER_EXCLUDED_DIRS } from "./constants.js";
export function scanRuleFiles(options) {
    const rootPath = toAbsolutePath(options.rootDir);
    if (!existsSync(rootPath)) {
        return [];
    }
    let rootStats;
    try {
        rootStats = statSync(rootPath);
    }
    catch {
        return [];
    }
    if (!rootStats.isDirectory()) {
        return [];
    }
    const results = [];
    const visitedDirectories = new Set();
    const excludedDirs = new Set(options.excludedDirs ?? SCANNER_EXCLUDED_DIRS);
    const maxDepth = options.maxDepth ?? 10;
    const maxFiles = normalizeMaxFiles(options.maxFiles);
    scanDirectory(rootPath, 0, maxDepth, maxFiles, excludedDirs, visitedDirectories, results);
    return results;
}
function normalizeMaxFiles(maxFiles) {
    const value = maxFiles ?? DEFAULT_MAX_SCAN_FILES;
    if (!Number.isFinite(value) || value < 0)
        return DEFAULT_MAX_SCAN_FILES;
    return Math.floor(value);
}
function toAbsolutePath(filePath) {
    return isAbsolute(filePath) ? filePath : resolve(filePath);
}
function scanDirectory(directoryPath, depth, maxDepth, maxFiles, excludedDirs, visitedDirectories, results) {
    if (results.length >= maxFiles) {
        return;
    }
    let realDirectoryPath;
    try {
        realDirectoryPath = realpathSync.native(directoryPath);
    }
    catch {
        return;
    }
    if (visitedDirectories.has(realDirectoryPath)) {
        return;
    }
    visitedDirectories.add(realDirectoryPath);
    let entries;
    try {
        entries = readdirSync(directoryPath, { withFileTypes: true }).sort((leftEntry, rightEntry) => leftEntry.name.localeCompare(rightEntry.name));
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (results.length >= maxFiles) {
            return;
        }
        const entryPath = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            if (!excludedDirs.has(entry.name) && depth < maxDepth) {
                scanDirectory(entryPath, depth + 1, maxDepth, maxFiles, excludedDirs, visitedDirectories, results);
            }
            continue;
        }
        if (entry.isSymbolicLink()) {
            scanSymbolicLink(entryPath, entry.name, depth, maxDepth, maxFiles, excludedDirs, visitedDirectories, results);
            continue;
        }
        if (entry.isFile() && isRuleFile(entry.name)) {
            results.push({ path: entryPath, realPath: resolveRealPath(entryPath) });
        }
    }
}
function scanSymbolicLink(linkPath, linkName, depth, maxDepth, maxFiles, excludedDirs, visitedDirectories, results) {
    if (results.length >= maxFiles) {
        return;
    }
    let targetStats;
    try {
        targetStats = statSync(linkPath);
    }
    catch {
        return;
    }
    if (targetStats.isDirectory()) {
        if (!excludedDirs.has(linkName) && depth < maxDepth) {
            scanDirectory(linkPath, depth + 1, maxDepth, maxFiles, excludedDirs, visitedDirectories, results);
        }
        return;
    }
    if (targetStats.isFile() && isRuleFile(linkName)) {
        results.push({ path: linkPath, realPath: resolveRealPath(linkPath) });
    }
}
function isRuleFile(fileName) {
    return RULE_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}
function resolveRealPath(filePath) {
    try {
        const realPath = realpathSync.native(filePath);
        const fileStats = lstatSync(filePath);
        return fileStats.isSymbolicLink() ? realPath : filePath;
    }
    catch {
        return filePath;
    }
}

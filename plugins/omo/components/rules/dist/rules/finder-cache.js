import { existsSync, realpathSync, statSync } from "node:fs";
import { scanRuleFiles } from "./scanner.js";
export function createRuleDiscoveryCache() {
    return { scannedRuleFiles: new Map(), singleFileInfo: new Map() };
}
export function scanRuleFilesCached(rootDir, cache) {
    if (cache === undefined) {
        return scanRuleFiles({ rootDir });
    }
    const cached = cache.scannedRuleFiles.get(rootDir);
    if (cached !== undefined) {
        return cached;
    }
    const scannedFiles = scanRuleFiles({ rootDir });
    cache.scannedRuleFiles.set(rootDir, scannedFiles);
    return scannedFiles;
}
export function singleFileInfoCached(filePath, cache) {
    if (cache === undefined) {
        return readSingleFileInfo(filePath);
    }
    const cached = cache.singleFileInfo.get(filePath);
    if (cached !== undefined) {
        return cached;
    }
    const fileInfo = readSingleFileInfo(filePath);
    cache.singleFileInfo.set(filePath, fileInfo);
    return fileInfo;
}
function readSingleFileInfo(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }
    try {
        if (!statSync(filePath).isFile()) {
            return null;
        }
        return { path: filePath, realPath: resolveRealPath(filePath) };
    }
    catch {
        return null;
    }
}
function resolveRealPath(filePath) {
    try {
        return realpathSync.native(filePath);
    }
    catch {
        return filePath;
    }
}

import { accessSync, constants, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { CACHE_DIR_NAME } from "./product-identity.js";
let osProviderOverride = null;
export function getOsProvider() {
    return osProviderOverride ?? os;
}
/** @internal test-only */
export function __setOsProviderForTesting(provider) {
    osProviderOverride = provider;
}
/** @internal test-only */
export function __resetOsProviderForTesting() {
    osProviderOverride = null;
}
function resolveWritableDirectory(preferredDir, fallbackSuffix) {
    try {
        mkdirSync(preferredDir, { recursive: true });
        accessSync(preferredDir, constants.W_OK);
        return preferredDir;
    }
    catch {
        const fallbackDir = path.join(getOsProvider().tmpdir(), fallbackSuffix);
        mkdirSync(fallbackDir, { recursive: true });
        return fallbackDir;
    }
}
export function getDataDir() {
    const preferredDataDir = process.env["XDG_DATA_HOME"] ?? path.join(getOsProvider().homedir(), ".local", "share");
    return resolveWritableDirectory(preferredDataDir, "omo-codex-data");
}
export function getActivityStateDir() {
    return path.join(getDataDir(), CACHE_DIR_NAME);
}

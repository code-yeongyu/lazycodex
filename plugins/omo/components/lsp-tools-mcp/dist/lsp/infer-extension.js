import { lstatSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { EXT_TO_LANG } from "./language-mappings.js";
const SKIP_DIRECTORIES = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);
const MAX_SCAN_ENTRIES = 500;
export function inferExtensionFromDirectory(directory) {
    const extensionCounts = new Map();
    let scanned = 0;
    function walk(dir) {
        if (scanned >= MAX_SCAN_ENTRIES)
            return;
        let entries;
        try {
            entries = readdirSync(dir);
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (scanned >= MAX_SCAN_ENTRIES)
                return;
            const fullPath = join(dir, entry);
            let stat;
            try {
                stat = lstatSync(fullPath);
            }
            catch {
                continue;
            }
            if (stat.isSymbolicLink())
                continue;
            scanned++;
            if (stat.isDirectory()) {
                if (!SKIP_DIRECTORIES.has(entry)) {
                    walk(fullPath);
                }
            }
            else if (stat.isFile()) {
                const ext = extname(fullPath);
                if (ext && ext in EXT_TO_LANG) {
                    extensionCounts.set(ext, (extensionCounts.get(ext) ?? 0) + 1);
                }
            }
        }
    }
    walk(directory);
    if (extensionCounts.size === 0)
        return null;
    let maxExt = "";
    let maxCount = 0;
    for (const [ext, count] of extensionCounts) {
        if (count > maxCount) {
            maxCount = count;
            maxExt = ext;
        }
    }
    return maxExt || null;
}

export interface ScanOptions {
    rootDir: string;
    excludedDirs?: ReadonlyArray<string>;
    /** Maximum recursion depth. Default: 10 */
    maxDepth?: number;
    maxFiles?: number;
}
export interface ScannedFile {
    /** Absolute path as encountered (may be a symlink). */
    path: string;
    /** Real (resolved) path; same as path if not a symlink. */
    realPath: string;
}
export declare function scanRuleFiles(options: ScanOptions): ScannedFile[];

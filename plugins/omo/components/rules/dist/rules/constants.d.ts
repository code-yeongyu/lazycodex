import type { RuleSource } from "./types.js";
/**
 * Project root marker files / directories used by `findProjectRoot`.
 * Walks UP from cwd until any of these is found in the directory.
 */
export declare const PROJECT_MARKERS: readonly string[];
/**
 * Project rule subdirectories. First tuple element is the parent dir under
 * the project root, second is the subdir scanned recursively.
 */
export declare const PROJECT_RULE_SUBDIRS: ReadonlyArray<readonly [string, string]>;
/**
 * Single-file project rules (always apply, frontmatter optional).
 */
export declare const PROJECT_SINGLE_FILES: readonly string[];
/**
 * User-home rule directories.
 */
export declare const USER_HOME_RULE_SUBDIRS: readonly string[];
/**
 * User-home single-file rules. The first one to exist wins per "first-match" semantics.
 */
export declare const USER_HOME_SINGLE_FILES: readonly string[];
/**
 * Bundled plugin rule directory relative to the rules component root.
 */
export declare const BUNDLED_RULE_SUBDIR = "bundled-rules";
/**
 * File extensions accepted as rule files in scanned directories.
 */
export declare const RULE_FILE_EXTENSIONS: readonly string[];
/**
 * Per-rule source priority for deterministic ordering. Lower = earlier.
 */
export declare const SOURCE_PRIORITY: ReadonlyMap<RuleSource, number>;
/**
 * Distance value assigned to global / user-home rules.
 */
export declare const GLOBAL_DISTANCE = 9999;
/**
 * Per-rule body character cap (default).
 */
export declare const DEFAULT_MAX_RULE_CHARS = 12000;
export declare const DEFAULT_MAX_SCAN_FILES = 1000;
/**
 * Total injected chars per tool result (default).
 */
export declare const DEFAULT_MAX_RESULT_CHARS = 40000;
export declare const DEFAULT_POST_COMPACT_MAX_RULE_CHARS = 3500;
export declare const DEFAULT_POST_COMPACT_MAX_RESULT_CHARS = 4000;
/**
 * Truncation marker template. `{path}` is replaced with the relative path.
 */
export declare const TRUNCATION_NOTICE = "\n\n[Truncated. Full: {path}]";
/**
 * Directories excluded by the recursive scanner regardless of glob settings.
 */
export declare const SCANNER_EXCLUDED_DIRS: readonly string[];

import { type RuleDiscoveryCache } from "./finder-cache.js";
import type { RuleCandidate } from "./types.js";
export type { RuleDiscoveryCache } from "./finder-cache.js";
export { createRuleDiscoveryCache } from "./finder-cache.js";
export interface FinderOptions {
    /** Project root absolute path (use findProjectRoot to get this). */
    projectRoot: string | null;
    /** Target file path (used for distance calculation in dynamic injection mode). null for static mode. */
    targetFile: string | null;
    /** User home directory (default: os.homedir()). Injectable for tests. */
    homeDir?: string;
    /** Set of disabled sources to omit from discovery. Empty by default. */
    disabledSources?: ReadonlySet<string>;
    /** Whether to skip user-home rules. Default: false. */
    skipUserHome?: boolean;
    /** Plugin root directory. Defaults to PLUGIN_ROOT env or this package root. */
    pluginRoot?: string;
    platform?: NodeJS.Platform;
    cache?: RuleDiscoveryCache;
}
interface PluginBundledFinderOptions {
    readonly disabledSources?: ReadonlySet<string>;
    readonly cache?: RuleDiscoveryCache;
    readonly pluginRoot?: string;
    readonly platform?: NodeJS.Platform;
}
export declare function findRuleCandidates(options: FinderOptions): RuleCandidate[];
export declare function findPluginBundledCandidates(options?: PluginBundledFinderOptions): RuleCandidate[];

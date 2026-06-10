import type { PiRulesConfig } from "./types.js";
export declare const DEFAULT_AUTO_DISABLED_SOURCES: readonly string[];
export declare function disabledSourcesFromConfig(config: PiRulesConfig): ReadonlySet<string> | undefined;

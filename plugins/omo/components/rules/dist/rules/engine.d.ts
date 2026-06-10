import type { Engine, EngineDeps } from "./engine-types.js";
import type { PiRulesConfig } from "./types.js";
export type { Engine, EngineDeps } from "./engine-types.js";
export declare function defaultConfig(): PiRulesConfig;
export declare function createEngine(config: PiRulesConfig, deps: EngineDeps): Engine;

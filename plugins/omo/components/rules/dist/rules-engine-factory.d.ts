interface RulesEngineFactoryOptions {
    env?: NodeJS.ProcessEnv;
    platform?: NodeJS.Platform;
}
export declare function createRulesEngine(options: RulesEngineFactoryOptions, config?: import("./rules/types.js").PiRulesConfig): import("./rules/engine-types.js").Engine;
export {};

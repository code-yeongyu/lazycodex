import { readFileSync } from "node:fs";
import { configFromEnvironment } from "./config.js";
import { createEngine } from "./rules/engine.js";
import { findRuleCandidates } from "./rules/finder.js";
import { findProjectRoot } from "./rules/project-root.js";
export function createRulesEngine(options, config = configFromEnvironment(options.env)) {
    const platform = options.platform ?? process.platform;
    return createEngine(config, {
        findCandidates: (finderOptions) => findRuleCandidates({ ...finderOptions, platform }),
        findProjectRoot,
        readFile: (path) => {
            try {
                return readFileSync(path, "utf8");
            }
            catch {
                return null;
            }
        },
    });
}

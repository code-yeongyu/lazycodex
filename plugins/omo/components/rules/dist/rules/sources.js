import { SOURCE_PRIORITY } from "./constants.js";
export const DEFAULT_AUTO_DISABLED_SOURCES = ["AGENTS.md", "~/.claude/rules", "~/.claude/CLAUDE.md"];
export function disabledSourcesFromConfig(config) {
    if (config.enabledSources === "auto") {
        return new Set(DEFAULT_AUTO_DISABLED_SOURCES);
    }
    const enabledSources = new Set(config.enabledSources);
    return new Set([...SOURCE_PRIORITY.keys()].filter((source) => !enabledSources.has(source)));
}

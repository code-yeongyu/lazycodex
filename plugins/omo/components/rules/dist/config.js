import { SOURCE_PRIORITY } from "./rules/constants.js";
import { defaultConfig } from "./rules/engine.js";
export function configFromEnvironment(env = process.env) {
    const config = defaultConfig();
    const disableBundledRules = isTruthy(firstEnv(env, "CODEX_RULES_DISABLE_BUNDLED", "PI_RULES_DISABLE_BUNDLED"));
    config.disabled = isTruthy(firstEnv(env, "CODEX_RULES_DISABLED", "PI_RULES_DISABLED"));
    config.mode = parseMode(firstEnv(env, "CODEX_RULES_MODE", "PI_RULES_MODE")) ?? config.mode;
    config.maxRuleChars =
        parsePositiveInteger(firstEnv(env, "CODEX_RULES_MAX_RULE_CHARS", "PI_RULES_MAX_RULE_CHARS")) ??
            config.maxRuleChars;
    config.maxResultChars =
        parsePositiveInteger(firstEnv(env, "CODEX_RULES_MAX_RESULT_CHARS", "PI_RULES_MAX_RESULT_CHARS")) ??
            config.maxResultChars;
    config.postCompactMaxRuleChars =
        parsePositiveInteger(firstEnv(env, "CODEX_RULES_POST_COMPACT_MAX_RULE_CHARS", "PI_RULES_POST_COMPACT_MAX_RULE_CHARS")) ?? config.postCompactMaxRuleChars;
    config.postCompactMaxResultChars =
        parsePositiveInteger(firstEnv(env, "CODEX_RULES_POST_COMPACT_MAX_RESULT_CHARS", "PI_RULES_POST_COMPACT_MAX_RESULT_CHARS")) ?? config.postCompactMaxResultChars;
    config.enabledSources = parseEnabledSources(firstEnv(env, "CODEX_RULES_ENABLED_SOURCES", "PI_RULES_ENABLED_SOURCES"), disableBundledRules);
    return config;
}
function firstEnv(env, ...names) {
    for (const name of names) {
        const value = env[name];
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }
    return undefined;
}
function isTruthy(value) {
    if (value === undefined)
        return false;
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
function parseMode(value) {
    if (value === undefined)
        return undefined;
    const normalized = value.trim().toLowerCase();
    switch (normalized) {
        case "static":
        case "dynamic":
        case "both":
        case "off":
            return normalized;
        default:
            return undefined;
    }
}
function parsePositiveInteger(value) {
    if (value === undefined)
        return undefined;
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}
function parseEnabledSources(value, disableBundledRules) {
    if (value === undefined || value.trim().toLowerCase() === "auto") {
        return disableBundledRules ? sourcesWithoutBundledRules() : "auto";
    }
    const sources = [];
    for (const rawSource of value.split(",")) {
        const source = toRuleSource(rawSource.trim());
        if (source === null) {
            continue;
        }
        sources.push(source);
    }
    const enabledSources = disableBundledRules ? sources.filter((source) => source !== "plugin-bundled") : sources;
    return enabledSources;
}
function sourcesWithoutBundledRules() {
    return [...SOURCE_PRIORITY.keys()].filter((source) => source !== "plugin-bundled");
}
function toRuleSource(value) {
    switch (value) {
        case ".omo/rules":
        case ".claude/rules":
        case ".cursor/rules":
        case ".github/instructions":
        case ".github/copilot-instructions.md":
        case "CONTEXT.md":
        case "plugin-bundled":
        case "~/.omo/rules":
        case "~/.opencode/rules":
        case "~/.claude/rules":
            return value;
        default:
            return null;
    }
}

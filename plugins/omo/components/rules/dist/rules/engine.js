import { clearSession, createSessionState, isDynamicInjected as isDynamicInjectedInState, isStaticInjected as isStaticInjectedInState, markDynamicInjected as markDynamicInjectedInState, markStaticInjected as markStaticInjectedInState, } from "./cache.js";
import { DEFAULT_MAX_RESULT_CHARS, DEFAULT_MAX_RULE_CHARS, DEFAULT_POST_COMPACT_MAX_RESULT_CHARS, DEFAULT_POST_COMPACT_MAX_RULE_CHARS, } from "./constants.js";
import { loadDynamicCandidates } from "./engine-dynamic-loader.js";
import { loadStaticCandidates } from "./engine-static-loader.js";
import { formatDynamicBlock, formatStaticBlock } from "./formatter.js";
import { disabledSourcesFromConfig } from "./sources.js";
export function defaultConfig() {
    return {
        disabled: false,
        mode: "both",
        maxRuleChars: DEFAULT_MAX_RULE_CHARS,
        maxResultChars: DEFAULT_MAX_RESULT_CHARS,
        postCompactMaxRuleChars: DEFAULT_POST_COMPACT_MAX_RULE_CHARS,
        postCompactMaxResultChars: DEFAULT_POST_COMPACT_MAX_RESULT_CHARS,
        enabledSources: "auto",
    };
}
export function createEngine(config, deps) {
    const state = createSessionState();
    const dynamicMatchCache = new Map();
    function loadStaticRules(cwd) {
        state.cwd = cwd;
        if (config.disabled || config.mode === "off" || config.mode === "dynamic") {
            return emptyLoadResult(state);
        }
        const projectRoot = deps.findProjectRoot(cwd);
        const findOptions = {
            projectRoot,
            targetFile: null,
        };
        const disabledSources = disabledSourcesFromConfig(config);
        if (disabledSources !== undefined) {
            findOptions.disabledSources = disabledSources;
        }
        const candidates = deps.findCandidates(findOptions);
        const result = loadStaticCandidates(candidates, deps, projectRoot);
        storeLastLoad(state, result.rules, result.diagnostics);
        return result;
    }
    function loadDynamicRules(cwd, targetPaths) {
        state.cwd = cwd;
        if (config.disabled || config.mode === "off" || config.mode === "static" || targetPaths.length === 0) {
            return emptyLoadResult(state);
        }
        const result = loadDynamicCandidates(config, deps, cwd, targetPaths, dynamicMatchCache);
        storeLastLoad(state, result.rules, result.diagnostics);
        return result;
    }
    return {
        state,
        config,
        loadStaticRules,
        loadDynamicRules,
        formatStatic: (rules) => formatStaticBlock(rules, { maxRuleChars: config.maxRuleChars, maxResultChars: config.maxResultChars }),
        formatDynamic: (rules, target) => formatDynamicBlock(rules, target, {
            maxRuleChars: config.maxRuleChars,
            maxResultChars: config.maxResultChars,
        }),
        resetSession: (cwd) => {
            clearSession(state);
            dynamicMatchCache.clear();
            if (cwd !== undefined) {
                state.cwd = cwd;
            }
        },
        isStaticInjected: (rule) => isStaticInjectedInState(state, rule),
        isDynamicInjected: (rule) => isDynamicInjectedInState(state, rule),
        markStaticInjected: (rule) => markStaticInjectedInState(state, rule),
        markDynamicInjected: (rule) => markDynamicInjectedInState(state, rule),
    };
}
function storeLastLoad(state, rules, diagnostics) {
    state.loadedRules.length = 0;
    state.loadedRules.push(...rules);
    state.diagnostics.length = 0;
    state.diagnostics.push(...diagnostics);
}
function emptyLoadResult(state) {
    storeLastLoad(state, [], []);
    return { rules: [], diagnostics: [] };
}

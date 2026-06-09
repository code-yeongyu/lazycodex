import { truncateBudget, truncateRule } from "./truncator.js";
function formatRule(rule) {
    const body = normalizeRuleBody(rule.body);
    if (body.length === 0) {
        return `Instructions from: ${rule.path}`;
    }
    return `Instructions from: ${rule.path}\n\n${body}`;
}
function truncateRules(rules, options) {
    const perRuleNormalized = rules.map((rule) => ({
        path: rule.path,
        relativePath: rule.relativePath,
        body: normalizeRuleBody(rule.body),
        source: rule.source,
    }));
    const perRuleResultChars = Math.floor(options.maxResultChars / Math.max(1, perRuleNormalized.length));
    const perRuleBudgeted = perRuleNormalized.map((rule) => ({
        path: rule.path,
        relativePath: rule.relativePath,
        body: rule.source === "plugin-bundled"
            ? truncateRule(rule.body, { maxChars: perRuleResultChars, relativePath: rule.relativePath }).body
            : truncateRule(rule.body, {
                maxChars: Math.min(options.maxRuleChars, perRuleResultChars),
                relativePath: rule.relativePath,
            }).body,
    }));
    const budgetedRules = truncateBudget({
        rules: perRuleBudgeted.map((rule) => ({ body: rule.body, relativePath: rule.relativePath })),
        maxResultChars: options.maxResultChars,
    });
    const truncatedRules = [];
    for (let index = 0; index < budgetedRules.length; index += 1) {
        const sourceRule = perRuleBudgeted[index];
        const budgetedRule = budgetedRules[index];
        if (sourceRule === undefined || budgetedRule === undefined) {
            continue;
        }
        truncatedRules.push({
            path: sourceRule.path,
            relativePath: budgetedRule.relativePath,
            body: budgetedRule.body,
        });
    }
    return truncatedRules;
}
export function formatStaticBlock(rules, options) {
    if (rules.length === 0) {
        return "";
    }
    if (options.maxResultChars <= 0) {
        return "";
    }
    const orderedRules = orderStaticRules(uniqueRulesByBody(rules));
    return ["## Project Instructions", "", truncateRules(orderedRules, options).map(formatRule).join("\n\n")].join("\n");
}
function orderStaticRules(rules) {
    const hephaestusRules = [];
    const otherRules = [];
    for (const rule of rules) {
        if (isHephaestusRule(rule)) {
            hephaestusRules.push(rule);
            continue;
        }
        otherRules.push(rule);
    }
    return [...hephaestusRules, ...otherRules];
}
function isHephaestusRule(rule) {
    return displayFilename(rule).toLowerCase() === "hephaestus.md";
}
function displayFilename(rule) {
    const normalizedPath = rule.relativePath.length > 0 ? rule.relativePath : rule.path;
    const segments = normalizedPath
        .replace(/\\/g, "/")
        .split("/")
        .filter((segment) => segment.length > 0);
    return segments.at(-1) ?? normalizedPath;
}
function uniqueRulesByBody(rules) {
    const uniqueRules = [];
    const seenBodies = new Set();
    const userDescriptions = new Set();
    for (const rule of rules) {
        const descriptionKey = rule.frontmatter.description?.trim();
        if (rule.source === "plugin-bundled" && descriptionKey !== undefined && userDescriptions.has(descriptionKey)) {
            continue;
        }
        const bodyKey = normalizeRuleBody(rule.body);
        if (seenBodies.has(bodyKey)) {
            continue;
        }
        seenBodies.add(bodyKey);
        if (descriptionKey !== undefined && rule.source !== "plugin-bundled") {
            userDescriptions.add(descriptionKey);
        }
        uniqueRules.push(rule);
    }
    return uniqueRules;
}
export function formatDynamicBlock(rules, targetRelativePath, options) {
    if (rules.length === 0) {
        return "";
    }
    return [
        `Additional project instructions matched for ${targetRelativePath}:`,
        "",
        truncateRules(rules, options).map(formatRule).join("\n\n"),
    ].join("\n");
}
function normalizeRuleBody(body) {
    return body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

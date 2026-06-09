import { TRUNCATION_NOTICE } from "./constants.js";
function truncationNotice(relativePath) {
    return TRUNCATION_NOTICE.replace("{path}", relativePath);
}
function safeSliceEnd(body, end) {
    if (end <= 0) {
        return 0;
    }
    const lastCodeUnit = body.charCodeAt(end - 1);
    if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
        return end - 1;
    }
    return end;
}
export function truncateRule(body, options) {
    if (body.length <= options.maxChars) {
        return { body, truncated: false, originalLength: body.length };
    }
    const notice = truncationNotice(options.relativePath);
    if (options.maxChars < notice.length) {
        return { body: notice, truncated: true, originalLength: body.length };
    }
    const sliceEnd = safeSliceEnd(body, options.maxChars - notice.length);
    return { body: `${body.slice(0, sliceEnd)}${notice}`, truncated: true, originalLength: body.length };
}
export function truncateBudget(input) {
    const results = [];
    let remainingBudget = input.maxResultChars;
    for (const rule of input.rules) {
        if (remainingBudget >= rule.body.length) {
            results.push({ body: rule.body, truncated: false, relativePath: rule.relativePath });
            remainingBudget -= rule.body.length;
            continue;
        }
        const notice = truncationNotice(rule.relativePath);
        if (remainingBudget <= notice.length) {
            break;
        }
        const sliceEnd = safeSliceEnd(rule.body, remainingBudget - notice.length);
        const body = `${rule.body.slice(0, sliceEnd)}${notice}`;
        results.push({ body, truncated: true, relativePath: rule.relativePath });
        remainingBudget -= body.length;
    }
    return results;
}

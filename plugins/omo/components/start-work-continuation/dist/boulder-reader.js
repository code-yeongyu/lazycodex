import { isAbsolute, join, resolve } from "node:path";
const CHECKBOX_PATTERN = /^- \[[ xX]\] /;
const UNCHECKED_PATTERN = /^- \[ \] /;
const TODO_HEADING = "TODOs";
const FINAL_VERIFICATION_HEADING = "Final Verification Wave";
export function parsePlanChecklist(markdown) {
    const lines = markdown.split(/\r?\n/);
    const hasCountedSections = lines.some(hasCountedSectionHeading);
    let remaining = 0;
    let total = 0;
    let nextTaskLabel = null;
    let isCountedSection = !hasCountedSections;
    for (const line of lines) {
        const heading = parseLevelTwoHeading(line);
        if (heading !== null)
            isCountedSection = isCountedHeading(heading);
        if (!isCountedSection)
            continue;
        if (!CHECKBOX_PATTERN.test(line))
            continue;
        total += 1;
        if (!UNCHECKED_PATTERN.test(line))
            continue;
        remaining += 1;
        if (nextTaskLabel === null)
            nextTaskLabel = line.slice("- [ ] ".length);
    }
    return { remaining, total, nextTaskLabel };
}
function hasCountedSectionHeading(line) {
    const heading = parseLevelTwoHeading(line);
    return heading !== null && isCountedHeading(heading);
}
export function readContinuationState(cwd, sessionId, fs) {
    const boulderPath = join(cwd, ".omo", "boulder.json");
    const boulderText = readTextFile(fs, boulderPath);
    if (boulderText === null)
        return null;
    const parsed = parseJsonObject(boulderText);
    if (parsed === null)
        return null;
    const work = findMatchingWork(parsed, `codex:${sessionId}`);
    if (work === null)
        return null;
    const planPath = resolvePlanPath(cwd, work.activePlan);
    const planText = readTextFile(fs, planPath);
    if (planText === null)
        return null;
    const checklist = parsePlanChecklist(planText);
    if (checklist.remaining === 0)
        return null;
    return {
        planName: work.planName,
        planPath,
        boulderPath,
        ledgerPath: join(cwd, ".omo", "start-work", "ledger.jsonl"),
        worktreePath: work.worktreePath,
        checklist,
    };
}
function findMatchingWork(state, prefixedSessionId) {
    const worksValue = state["works"];
    const candidates = isRecord(worksValue) ? Object.values(worksValue) : [state];
    for (const candidate of candidates) {
        const work = parseBoulderWork(candidate);
        if (work === null)
            continue;
        if (!isContinuableStatus(work.status))
            continue;
        if (work.sessionIds.includes(prefixedSessionId))
            return work;
    }
    return null;
}
function parseBoulderWork(value) {
    if (!isRecord(value))
        return null;
    const activePlan = value["active_plan"];
    const planName = value["plan_name"];
    const status = parseWorkStatus(value["status"]);
    const sessionIds = value["session_ids"];
    const worktreePath = value["worktree_path"];
    if (typeof activePlan !== "string")
        return null;
    if (typeof planName !== "string")
        return null;
    if (status === null)
        return null;
    if (!isStringArray(sessionIds))
        return null;
    return {
        activePlan,
        planName,
        status,
        sessionIds,
        worktreePath: typeof worktreePath === "string" ? worktreePath : null,
    };
}
function parseWorkStatus(value) {
    if (value === "active" || value === "completed" || value === "paused" || value === "abandoned")
        return value;
    return null;
}
function isContinuableStatus(status) {
    return status === "active" || status === "paused";
}
function parseLevelTwoHeading(line) {
    if (!line.startsWith("## "))
        return null;
    if (line.startsWith("### "))
        return null;
    return line.slice("## ".length).trim();
}
function isCountedHeading(heading) {
    return heading === TODO_HEADING || heading === FINAL_VERIFICATION_HEADING;
}
function resolvePlanPath(cwd, activePlan) {
    return isAbsolute(activePlan) ? activePlan : resolve(cwd, activePlan);
}
function readTextFile(fs, path) {
    try {
        return fs.readFileSync(path, "utf8");
    }
    catch (error) {
        if (error instanceof Error)
            return null;
        throw error;
    }
}
function parseJsonObject(json) {
    try {
        const parsed = JSON.parse(json);
        return isRecord(parsed) ? parsed : null;
    }
    catch (error) {
        if (error instanceof SyntaxError)
            return null;
        throw error;
    }
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

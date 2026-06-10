import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { aggregateCodexObjectiveForScope } from "./goal-status.js";
import { repoRelative, ulwLoopDir, ulwLoopGoalsPath, ulwLoopLedgerPath, ulwLoopRelativeDir, } from "./paths.js";
import { iso, ULW_LOOP_DIR, ULW_LOOP_GOALS, ULW_LOOP_LEDGER, UlwLoopError } from "./types.js";
const LEGACY_OBJECTIVE_PREFIX = `Complete all ulw-loop stories in ${ULW_LOOP_DIR}/${ULW_LOOP_GOALS}: `;
const LEGACY_OBJECTIVE = `Complete all ulw-loop stories listed in ${ULW_LOOP_DIR}/${ULW_LOOP_GOALS}. Use ${ULW_LOOP_DIR}/${ULW_LOOP_LEDGER} as the durable audit trail.`;
const locks = new Map();
function hasCode(error, code) {
    return error instanceof Error && "code" in error && error.code === code;
}
function isLegacyEnumeratedAggregateObjective(objective) {
    return objective === LEGACY_OBJECTIVE || Boolean(objective?.startsWith(LEGACY_OBJECTIVE_PREFIX));
}
function isSteeringKind(value) {
    return value === "steering_accepted" || value === "steering_rejected" || value === "criteria_revised";
}
export async function withUlwLoopMutationLock(repoRoot, scopeOrFn, maybeFn) {
    const scope = typeof scopeOrFn === "function" ? undefined : scopeOrFn;
    const fn = typeof scopeOrFn === "function" ? scopeOrFn : maybeFn;
    if (fn === undefined)
        throw new UlwLoopError("Missing ulw-loop mutation body.", "ULW_LOOP_LOCK_BODY_MISSING");
    const lockKey = `${repoRoot}\0${ulwLoopRelativeDir(scope)}`;
    const prior = locks.get(lockKey) ?? Promise.resolve();
    const run = prior.then(fn, fn);
    locks.set(lockKey, run.catch(() => undefined));
    return run;
}
export async function readUlwLoopPlan(repoRoot, scope) {
    const path = ulwLoopGoalsPath(repoRoot, scope);
    let raw;
    try {
        raw = await readFile(path, "utf8");
    }
    catch (error) {
        if (!hasCode(error, "ENOENT"))
            throw error;
        throw new UlwLoopError(`No ulw-loop plan found at ${repoRelative(path, repoRoot)}. Run \`omo ulw-loop create-goals ...\` first.`, "ULW_LOOP_PLAN_MISSING", { cause: error });
    }
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.goals)) {
        throw new UlwLoopError(`Invalid ulw-loop plan at ${repoRelative(path, repoRoot)}.`, "ULW_LOOP_PLAN_INVALID");
    }
    const previousObjective = parsed.codexObjective;
    if ((parsed.codexGoalMode ?? "per_story") === "aggregate" &&
        isLegacyEnumeratedAggregateObjective(previousObjective)) {
        const now = iso();
        parsed.codexObjective = aggregateCodexObjectiveForScope(scope);
        parsed.codexObjectiveAliases = [...new Set([...(parsed.codexObjectiveAliases ?? []), previousObjective])];
        parsed.updatedAt = now;
        await writePlan(repoRoot, parsed, scope);
        await appendLedger(repoRoot, {
            at: now,
            kind: "aggregate_objective_migrated",
            message: "Migrated legacy enumerated aggregate Codex objective to the stable pointer objective.",
            before: { codexObjective: previousObjective },
            after: { codexObjective: parsed.codexObjective },
        }, scope);
    }
    return parsed;
}
export async function writePlan(repoRoot, plan, scope) {
    await mkdir(ulwLoopDir(repoRoot, scope), { recursive: true });
    const path = ulwLoopGoalsPath(repoRoot, scope);
    const tmpPath = `${path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
    await rename(tmpPath, path);
}
export async function appendLedger(repoRoot, entry, scope) {
    await mkdir(ulwLoopDir(repoRoot, scope), { recursive: true });
    await appendFile(ulwLoopLedgerPath(repoRoot, scope), `${JSON.stringify(entry)}\n`, "utf8");
}
export async function readSteeringLedgerEntries(repoRoot, scope) {
    let raw;
    try {
        raw = await readFile(ulwLoopLedgerPath(repoRoot, scope), "utf8");
    }
    catch (error) {
        if (hasCode(error, "ENOENT"))
            return [];
        throw error;
    }
    const entries = [];
    for (const line of raw.split(/\r?\n/).filter(Boolean)) {
        const entry = JSON.parse(line);
        if (isSteeringKind(entry.kind))
            entries.push(entry);
    }
    return entries;
}

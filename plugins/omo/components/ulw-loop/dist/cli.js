#!/usr/bin/env node

// components/ulw-loop/src/checkpoint.ts
import { existsSync as existsSync5, statSync as statSync2 } from "node:fs";
import { readFile as readFile3 } from "node:fs/promises";
import { resolve as resolve4 } from "node:path";

// components/ulw-loop/src/codex-goal-snapshot.ts
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

class CodexGoalSnapshotError extends Error {
}
function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function safeString(value) {
  return typeof value === "string" ? value : "";
}
function safeStatusString(value) {
  return typeof value === "string" ? value.trim() : "";
}
function normalizeStatus(value) {
  const status = safeStatusString(value).toLowerCase();
  if (status === "complete" || status === "completed" || status === "done")
    return "complete";
  if (status === "cancelled" || status === "canceled")
    return "cancelled";
  if (status === "failed" || status === "failure")
    return "failed";
  if (status === "paused")
    return "paused";
  if (status === "usage_limited")
    return "usage_limited";
  if (status === "budget_limited")
    return "budget_limited";
  if (status === "active" || status === "in_progress" || status === "pending" || status === "running")
    return "active";
  return "unknown";
}
function normalizeObjective(value) {
  return value.replace(/\s+/g, " ").trim();
}
function parseCodexGoalSnapshot(value) {
  const root = safeObject(value);
  const goalValue = Object.hasOwn(root, "goal") ? root["goal"] : value;
  if (goalValue === null || goalValue === undefined || goalValue === false) {
    return { available: false, raw: value };
  }
  const goal = safeObject(goalValue);
  const objective = safeString(goal["objective"] ?? goal["goal"] ?? goal["description"] ?? goal["title"] ?? root["objective"] ?? root["title"]);
  const status = normalizeStatus(goal["status"] ?? root["status"]);
  return {
    available: Boolean(objective || status !== "unknown"),
    ...objective ? { objective } : {},
    status,
    raw: value
  };
}
async function readCodexGoalSnapshotInput(raw, cwd = process.cwd()) {
  if (!raw?.trim())
    return null;
  const trimmed = raw.trim();
  try {
    return parseCodexGoalSnapshot(JSON.parse(trimmed));
  } catch {
    const path = resolve(cwd, trimmed);
    if (!existsSync(path)) {
      throw new CodexGoalSnapshotError(`Codex goal snapshot is neither valid JSON nor a readable path: ${trimmed}`);
    }
    try {
      return parseCodexGoalSnapshot(JSON.parse(await readFile(path, "utf-8")));
    } catch (error) {
      throw new CodexGoalSnapshotError(`Codex goal snapshot path does not contain valid JSON: ${trimmed}${error instanceof Error ? ` (${error.message})` : ""}`);
    }
  }
}
function reconcileCodexGoalSnapshot(snapshot, options) {
  const effectiveSnapshot = snapshot ?? { available: false, raw: null };
  const errors = [];
  const warnings = [];
  const nextActions = [];
  const expected = options.expectedObjective;
  if (!effectiveSnapshot.available) {
    nextActions.push(`call get_goal; if none, create_goal with codexObjective "${expected}" verbatim`);
    return { ok: errors.length === 0, snapshot: effectiveSnapshot, warnings, nextActions, errors };
  }
  const normalized = (objectives) => new Set(objectives.map(normalizeObjective).filter(Boolean));
  const accepted = normalized([expected, ...options.acceptedObjectives ?? []]);
  const acknowledged = normalized(options.acknowledgedObjectives ?? []);
  const actual = normalizeObjective(effectiveSnapshot.objective ?? "");
  let unacknowledgedObjective;
  if (actual && !accepted.has(actual) && !acknowledged.has(actual)) {
    warnings.push(`driver_objective_differs: expected "${expected}", got "${actual}".`);
    unacknowledgedObjective = actual;
  }
  const actualStatus = effectiveSnapshot.status ?? "unknown";
  if (actualStatus === "paused" || actualStatus === "usage_limited" || actualStatus === "budget_limited") {
    nextActions.push("/goal resume or raise the budget");
  }
  if (actualStatus === "complete")
    nextActions.push(`driver closed early: call create_goal with codexObjective "${expected}" verbatim`);
  return {
    ok: errors.length === 0,
    snapshot: effectiveSnapshot,
    warnings,
    nextActions,
    errors,
    ...unacknowledgedObjective === undefined ? {} : { unacknowledgedObjective }
  };
}
function formatCodexGoalReconciliation(reconciliation) {
  const parts = [...reconciliation.errors, ...reconciliation.nextActions, ...reconciliation.warnings];
  return parts.join(" ");
}

// components/ulw-loop/src/driver-objective-ack.ts
function normalizeDriverObjective(value) {
  return value.replace(/\s+/g, " ").trim();
}
function acknowledgedDriverObjectives(plan) {
  return plan.acknowledgedDriverObjectives ?? [];
}
function acknowledgeDriverObjective(plan, objective) {
  if (objective === undefined)
    return false;
  const normalized = normalizeDriverObjective(objective);
  if (!normalized || acknowledgedDriverObjectives(plan).includes(normalized))
    return false;
  plan.acknowledgedDriverObjectives = [...acknowledgedDriverObjectives(plan), normalized];
  return true;
}

// components/ulw-loop/src/paths.ts
import { isAbsolute, join, relative, sep } from "node:path";
// components/ulw-loop/src/constants.ts
var ULW_LOOP_DIR = ".omo/ulw-loop";
var ULW_LOOP_BRIEF = "brief.md";
var ULW_LOOP_GOALS = "goals.json";
var ULW_LOOP_LEDGER = "ledger.jsonl";
var ULW_LOOP_STATE_LOCK = ".state.lock";
var ULW_LOOP_STEERING_MUTATION_KINDS = [
  "add_subgoal",
  "split_subgoal",
  "reorder_pending",
  "revise_pending_wording",
  "revise_criterion",
  "annotate_ledger",
  "mark_blocked_superseded"
];
var ULW_LOOP_SUCCESS_CRITERION_USER_MODELS = [
  "happy",
  "edge",
  "regression",
  "adversarial"
];
// components/ulw-loop/src/runtime.ts
class UlwLoopError extends Error {
  constructor(message, code, opts) {
    super(message, opts?.cause === undefined ? undefined : { cause: opts.cause });
    this.name = "UlwLoopError";
    this.code = code;
    if (opts?.details !== undefined) {
      this.details = opts.details;
    }
  }
}
function iso() {
  return new Date().toISOString();
}
// components/ulw-loop/src/paths.ts
var SESSION_ENV_KEYS = ["OMO_ULW_LOOP_SESSION_ID", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "PI_SESSION_ID"];
function normalizeUlwLoopSessionId(sessionId) {
  const trimmed = sessionId?.trim();
  if (!trimmed)
    return null;
  const pathSegments = trimmed.split(/[\\/]+/).filter((segment) => segment.length > 0 && segment !== "." && segment !== "..");
  const candidate = (pathSegments.length > 0 ? pathSegments.join("-") : trimmed).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^\.+/, "").replace(/^[.-]+|[.-]+$/g, "");
  return candidate.length > 0 ? candidate : null;
}
function resolveUlwLoopSessionIdFromEnv(env = process.env) {
  for (const key of SESSION_ENV_KEYS) {
    const normalized = normalizeUlwLoopSessionId(env[key]);
    if (normalized !== null)
      return normalized;
  }
  return null;
}
function ulwLoopRelativeDir(scope) {
  const sessionId = normalizeUlwLoopSessionId(scope?.sessionId);
  return sessionId === null ? ULW_LOOP_DIR : `${ULW_LOOP_DIR}/${sessionId}`;
}
function ulwLoopDir(repoRoot, scope) {
  return join(repoRoot, ulwLoopRelativeDir(scope));
}
function ulwLoopBriefRelativePath(scope) {
  return `${ulwLoopRelativeDir(scope)}/${ULW_LOOP_BRIEF}`;
}
function ulwLoopGoalsRelativePath(scope) {
  return `${ulwLoopRelativeDir(scope)}/${ULW_LOOP_GOALS}`;
}
function ulwLoopLedgerRelativePath(scope) {
  return `${ulwLoopRelativeDir(scope)}/${ULW_LOOP_LEDGER}`;
}
function ulwLoopGoalsPath(repoRoot, scope) {
  return join(ulwLoopDir(repoRoot, scope), ULW_LOOP_GOALS);
}
function ulwLoopStateLockPath(repoRoot, scope) {
  return join(ulwLoopDir(repoRoot, scope), ULW_LOOP_STATE_LOCK);
}
function repoRelative(absolutePath, repoRoot) {
  const slashPrefix = `${repoRoot}/`;
  const backslashPrefix = `${repoRoot}\\`;
  if (absolutePath.startsWith(slashPrefix))
    return absolutePath.slice(slashPrefix.length).split("\\").join("/");
  if (absolutePath.startsWith(backslashPrefix))
    return absolutePath.slice(backslashPrefix.length).split("\\").join("/");
  return absolutePath.split("\\").join("/");
}
function ulwLoopEvidenceRoot(scope) {
  const sessionId = normalizeUlwLoopSessionId(scope?.sessionId);
  return sessionId === null ? ".omo/evidence" : `.omo/evidence/ulw/${sessionId}`;
}
function ulwLoopAttemptEvidenceDir(goalId, attempt, scope) {
  const sessionId = normalizeUlwLoopSessionId(scope?.sessionId);
  if (sessionId === null) {
    throw new UlwLoopError(`Evidence for ${goalId} attempt ${attempt} needs a session scope; pass --session-id <id> so the attempt directory lives under .omo/evidence/ulw/<id>/.`, "ULW_LOOP_SESSION_SCOPE_REQUIRED", { details: { goalId, attempt } });
  }
  return `.omo/evidence/ulw/${sessionId}/${goalId}/a${attempt}`;
}
var PLATFORM_PATH_API = { relative, isAbsolute, sep };
function isWithinAttemptDir(absolutePath, attemptRoot, pathApi = PLATFORM_PATH_API) {
  const relativePath = pathApi.relative(attemptRoot, absolutePath);
  if (relativePath === "")
    return true;
  if (relativePath === ".." || relativePath.startsWith(`..${pathApi.sep}`))
    return false;
  return !pathApi.isAbsolute(relativePath);
}

// components/ulw-loop/src/goal-status.ts
var ULW_LOOP_AGGREGATE_CODEX_OBJECTIVE = aggregateCodexObjectiveForScope();
function aggregateCodexObjectiveForScope(scope) {
  return `Complete the durable ulw-loop plan in ${ulwLoopGoalsRelativePath(scope)}, including later accepted/appended stories, under the original brief constraints; use ${ulwLoopLedgerRelativePath(scope)} as the audit trail.`;
}
function codexGoalMode(plan) {
  return plan.codexGoalMode ?? "per_story";
}
function isResolvedStatus(status) {
  return status === "complete";
}
function isMemberResolved(goal, plan) {
  return isResolvedStatus(goal.status) || isSupersededResolved(goal, plan);
}
function isSupersededResolved(goal, plan) {
  if (goal.steeringStatus !== "superseded")
    return false;
  const replacements = goal.supersededBy ?? [];
  if (replacements.length === 0)
    return false;
  return replacements.every((id) => {
    const replacement = plan.goals.find((candidate) => candidate.id === id);
    return replacement !== undefined && isResolvedStatus(replacement.status);
  });
}
function isCompletionBlocking(goal, plan) {
  if (goal.steeringStatus === "superseded")
    return !isSupersededResolved(goal, plan);
  if (goal.steeringStatus === "blocked")
    return true;
  return !isResolvedStatus(goal.status);
}
function isCompletionBlockingForFinalCandidate(candidate, finalCandidate, plan) {
  if (candidate.id === finalCandidate.id)
    return false;
  if (candidate.steeringStatus === "superseded") {
    const replacements = candidate.supersededBy ?? [];
    if (replacements.length === 0)
      return true;
    return !replacements.every((id) => {
      if (id === finalCandidate.id)
        return true;
      const replacement = plan.goals.find((goal) => goal.id === id);
      return replacement !== undefined && isResolvedStatus(replacement.status);
    });
  }
  return isCompletionBlocking(candidate, plan);
}
function isUlwLoopDone(plan) {
  if (plan.aggregateCompletion?.status === "complete")
    return true;
  return plan.goals.every((goal) => !isCompletionBlocking(goal, plan));
}
function isFinalRunCompletionCandidate(plan, goal) {
  return isCompletionBlocking(goal, plan) && plan.goals.every((candidate) => !isCompletionBlockingForFinalCandidate(candidate, goal, plan));
}
function aggregateCodexObjective(plan) {
  return plan.codexObjective ?? ULW_LOOP_AGGREGATE_CODEX_OBJECTIVE;
}
function expectedCodexObjective(plan, goal) {
  return codexGoalMode(plan) === "aggregate" ? aggregateCodexObjective(plan) : goal.objective;
}
function compatibleCodexObjectives(plan) {
  return [aggregateCodexObjective(plan), ...plan.codexObjectiveAliases ?? []];
}
function hasAllCriteriaPass(goal) {
  return goal.successCriteria.length > 0 && goal.successCriteria.every((criterion) => criterion.status === "pass");
}
function isEssentialCriterion(criterion) {
  return criterion.essential ?? true;
}
function essentialCriteriaOf(goal) {
  const explicit = goal.successCriteria.filter(isEssentialCriterion);
  if (explicit.length > 0)
    return explicit;
  const happy = goal.successCriteria.find((criterion) => criterion.userModel === "happy");
  return happy === undefined ? [] : [happy];
}
function hasEssentialCriteriaPass(goal) {
  const criteria = essentialCriteriaOf(goal);
  return criteria.length > 0 && criteria.every((criterion) => criterion.status === "pass");
}

// components/ulw-loop/src/checkpoint-codex-validation.ts
async function validateCheckpointCodexGoal(input) {
  const snapshot = await readCodexGoalSnapshotInput(input.raw, input.repoRoot);
  const expected = expectedCodexObjective(input.plan, input.goal);
  const reconciliation = reconcileCodexGoalSnapshot(snapshot, {
    expectedObjective: expected,
    acknowledgedObjectives: acknowledgedDriverObjectives(input.plan),
    ...codexGoalMode(input.plan) === "aggregate" ? { acceptedObjectives: compatibleCodexObjectives(input.plan) } : {}
  });
  if (!reconciliation.ok)
    throw new CodexGoalSnapshotError(formatCodexGoalReconciliation(reconciliation));
  return {
    raw: snapshot?.raw,
    nextActions: reconciliation.nextActions,
    warnings: reconciliation.warnings,
    ...reconciliation.unacknowledgedObjective === undefined ? {} : { unacknowledgedObjective: reconciliation.unacknowledgedObjective }
  };
}
function combineCheckpointValidationErrors(codexError, gateError) {
  return new UlwLoopError(`${codexError.message}
${gateError.message}`, "ULW_LOOP_QUALITY_GATE_INVALID", {
    details: { ...codexError.details ?? {}, ...gateError.details ?? {} }
  });
}

// components/ulw-loop/src/evidence-artifacts.ts
import { existsSync as existsSync2 } from "node:fs";
import { isAbsolute as isAbsolute2, relative as relative2, resolve as resolve2, sep as sep2 } from "node:path";
function fail(message, code, details) {
  throw new UlwLoopError(message, code, { details });
}
function stored(repoRoot, absolute) {
  const rel = relative2(repoRoot, absolute);
  const inside = rel !== "" && !rel.startsWith("..") && !isAbsolute2(rel);
  return inside ? rel.split(sep2).join("/") : absolute;
}
function resolveEvidenceArtifacts(repoRoot, artifacts) {
  if (artifacts === undefined)
    return;
  const seen = new Set;
  const resolved = [];
  for (const [index, candidate] of artifacts.entries()) {
    const path = typeof candidate === "string" ? candidate.trim() : "";
    if (!path)
      fail(`Artifact ${index + 1} must be a non-empty path.`, "ULW_LOOP_ARGUMENT_INVALID", { index });
    const absolute = resolve2(repoRoot, path);
    if (!existsSync2(absolute))
      fail(`Evidence artifact does not exist: ${path} (resolved to ${absolute}).`, "ULW_LOOP_EVIDENCE_ARTIFACT_MISSING", {
        path,
        resolved: absolute
      });
    const value = stored(repoRoot, absolute);
    if (!seen.has(value)) {
      seen.add(value);
      resolved.push(value);
    }
  }
  return resolved;
}

// components/ulw-loop/src/plan-commit.ts
import { AsyncLocalStorage as AsyncLocalStorage2 } from "node:async_hooks";
import { randomUUID as randomUUID2 } from "node:crypto";
import { linkSync, mkdirSync as mkdirSync2, renameSync, rmSync, writeFileSync } from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { join as join4 } from "node:path";

// components/ulw-loop/src/ledger.ts
import { join as join3 } from "node:path";

// components/ulw-loop/src/plan-log.ts
import { existsSync as existsSync3, readdirSync, readFileSync } from "node:fs";
import { join as join2 } from "node:path";
function hasCode(error, code) {
  return error instanceof Error && "code" in error && error.code === code;
}
function readOptional(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (hasCode(error, "ENOENT"))
      return;
    throw error;
  }
}
function logNames(dir) {
  try {
    return readdirSync(join2(dir, "revisions")).filter((name) => /^\d{8,}\.json$/.test(name)).sort();
  } catch (error) {
    if (hasCode(error, "ENOENT"))
      return [];
    throw error;
  }
}
function readRecord(dir, name) {
  try {
    const record = JSON.parse(readFileSync(join2(dir, "revisions", name), "utf8"));
    return record.version === 1 && Number.isInteger(record.revision) && record.plan?.version === 1 && Array.isArray(record.plan.goals) && Array.isArray(record.ledger) ? record : undefined;
  } catch (error) {
    if (!(error instanceof SyntaxError))
      throw error;
    return;
  }
}
function readRecords(dir) {
  const records = [];
  for (const name of logNames(dir)) {
    const record = readRecord(dir, name);
    if (record !== undefined)
      records.push(record);
  }
  return records.sort((a, b) => a.revision - b.revision);
}
function readNewestRecord(dir) {
  const names = logNames(dir).sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10));
  for (const name of names) {
    const record = readRecord(dir, name);
    if (record !== undefined)
      return record;
  }
  return;
}
function reconcilePlan(dir) {
  const raw = readOptional(join2(dir, "goals.json"));
  let cached;
  if (raw !== undefined) {
    try {
      cached = JSON.parse(raw);
    } catch (error) {
      if (!(error instanceof SyntaxError))
        throw error;
    }
  }
  const latest = readNewestRecord(dir);
  if (latest === undefined)
    return cached;
  if (cached === undefined)
    return latest.plan;
  if ((cached.revision ?? 0) > latest.revision)
    return cached;
  if (cached.revision === undefined || cached.revision === latest.revision) {
    const published = new Set(latest.plan.goals.map((goal) => goal.id));
    if (Array.isArray(cached.goals) && cached.goals.some((goal) => !published.has(goal.id)))
      return { ...cached, revision: latest.revision };
  }
  return latest.plan;
}
function assertProjectionComplete(plan, ledger) {
  const present = new Set(plan.goals.map((goal) => goal.id));
  const missing = new Set;
  for (const entry of ledger)
    if (entry.kind === "goal_added" && entry.goalId !== undefined && !present.has(entry.goalId))
      missing.add(entry.goalId);
  if (missing.size === 0)
    return;
  throw new UlwLoopError(`Refusing to rewrite goals.json: the ledger records goals the plan projection lacks (${[...missing].join(", ")}). Restore those goals into the newest revisions/ record (keeping plan.revision equal to its file number) before mutating this run.`, "ULW_LOOP_PROJECTION_TRUNCATED", { details: { missingGoalIds: [...missing] } });
}
function planExists(repoRoot, scope) {
  const dir = ulwLoopDir(repoRoot, scope);
  return existsSync3(join2(dir, "goals.json")) || logNames(dir).length > 0;
}

// components/ulw-loop/src/ledger.ts
function readLedgerAt(dir) {
  const entries = new Map;
  const lines = (readOptional(join3(dir, "ledger.jsonl")) ?? "").split(/\r?\n/);
  let reached = 0;
  for (const [index, line] of lines.entries()) {
    if (line.trim().length === 0)
      continue;
    try {
      const entry = JSON.parse(line);
      entry.revision = entry.revision || reached;
      reached = Math.max(reached, entry.revision);
      entry.id ??= `legacy-${index + 1}`;
      entries.set(entry.id, entry);
    } catch (error) {
      if (!(error instanceof SyntaxError))
        throw error;
    }
  }
  for (const record of readRecords(dir))
    for (const [seq, entry] of record.ledger.entries()) {
      const id = entry.id ?? `${record.revision}-${seq}`;
      entries.set(id, { ...entry, revision: record.revision, id });
    }
  const reset = reconcilePlan(dir)?.ledgerResetRevision ?? 0;
  const sequence = (entry) => Number(entry.id?.split("-").at(-1) ?? 0);
  return [...entries.values()].filter((entry) => (entry.revision ?? 0) >= reset).sort((a, b) => (a.revision ?? 0) - (b.revision ?? 0) || sequence(a) - sequence(b));
}
function readLedger(repoRoot, scope) {
  return readLedgerAt(ulwLoopDir(repoRoot, scope));
}

// components/ulw-loop/src/plan-io.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { readdirSync as readdirSync2 } from "node:fs";

// components/ulw-loop/src/plan-missing-recovery.ts
var ULW_LOOP_CREATE_GOALS_COMMAND = 'omo-agent-toolkit ulw-loop create-goals --brief "<brief>" --json';
function createGoalsAction(surface) {
  return surface === "omo-senpi" ? 'agentToolkit.createGoals({ brief: "<brief>" })' : ULW_LOOP_CREATE_GOALS_COMMAND;
}
function planMissingRecovery(existingSessionIds, surface = "lazycodex") {
  const lines = [`Recovery: bootstrap the plan with \`${createGoalsAction(surface)}\`.`];
  if (existingSessionIds.length === 0)
    return { message: lines.join(`
`) };
  lines.push(surface === "omo-senpi" ? `Existing ulw-loop session ids under .omo/ulw-loop/: ${existingSessionIds.join(", ")}. The SDK is bound to the current session; resume the owning session to target its plan.` : `Existing ulw-loop session ids under .omo/ulw-loop/: ${existingSessionIds.join(", ")}. Re-run with \`--session-id <id>\` to target one of them.`);
  return { message: lines.join(`
`), details: { existingSessionIds } };
}
function planMissingError(planPath, existingSessionIds, surface = "lazycodex") {
  const recovery = planMissingRecovery(existingSessionIds, surface);
  return new UlwLoopError(`No ulw-loop plan found at ${planPath}.
${recovery.message}`, "ULW_LOOP_PLAN_MISSING", {
    ...recovery.details === undefined ? {} : { details: recovery.details }
  });
}
function sessionScopeRequiredMessage(flag, existingSessionIds) {
  const lines = [
    "No ulw-loop session scope: neither the session env (OMO_ULW_LOOP_SESSION_ID / CODEX_SESSION_ID / CODEX_THREAD_ID / PI_SESSION_ID) nor the flag names this run, and the shared .omo/ulw-loop root is never used implicitly because every session in this directory would read and overwrite it.",
    `Recovery: pass the scope explicitly: \`${flag} <id>\` (subprocess, eval, and hook contexts do not inherit the session env).`
  ];
  if (existingSessionIds.length > 0) {
    lines.push(`Existing ulw-loop session ids under .omo/ulw-loop/: ${existingSessionIds.join(", ")}.`);
  }
  return lines.join(`
`);
}
function sessionIdRequiredMessage(flag) {
  return [
    `${flag} requires a non-empty value.`,
    "Recovery: subprocess, eval, and hook contexts do not inherit the ulw-loop session env (OMO_ULW_LOOP_SESSION_ID / CODEX_SESSION_ID / CODEX_THREAD_ID / PI_SESSION_ID),",
    `so pass the scope explicitly: \`${flag} <id>\` (for example \`${flag} 01a05b8a-6763-7780-834f-319423b071ce\`).`
  ].join(`
`);
}

// components/ulw-loop/src/state-lock.ts
import { randomUUID } from "node:crypto";
import { closeSync, ftruncateSync, mkdirSync, openSync, readFileSync as readFileSync2, statSync, unlinkSync, writeSync } from "node:fs";
import { dirname } from "node:path";
var ULW_LOOP_LOCK_TIMEOUT_CODE = "ULW_LOOP_LOCK_TIMEOUT";
var DEFAULT_TIMEOUT_MS = 1e4;
var DEFAULT_STALE_MS = 60000;
var DEFAULT_LEASE_MS = 30000;
var SLEEP_CELL = new Int32Array(new SharedArrayBuffer(4));
var systemClock = {
  now: Date.now,
  schedule(fn, ms) {
    const timer = setTimeout(fn, ms);
    return {
      unref: () => {
        timer.unref();
      },
      cancel: () => clearTimeout(timer)
    };
  }
};
async function withStateLock(lockPath, fn, options = {}) {
  const holder = await acquireAsync(lockPath, options);
  const clock = options.clock ?? systemClock;
  let timer;
  let heartbeatError;
  const beat = () => {
    try {
      holder.record.leaseUntil = clock.now() + (options.leaseMs ?? DEFAULT_LEASE_MS);
      writeRecord(holder);
      schedule();
    } catch (error) {
      heartbeatError = error;
    }
  };
  const schedule = () => {
    if (options.heartbeatMs === 0)
      return;
    timer = clock.schedule(beat, options.heartbeatMs ?? (options.leaseMs ?? DEFAULT_LEASE_MS) / 3);
    timer.unref();
  };
  schedule();
  try {
    const result = await fn(holder.record.token);
    if (heartbeatError !== undefined)
      throw heartbeatError;
    return result;
  } finally {
    timer?.cancel();
    closeSync(holder.fd);
    release(lockPath, holder.record.token);
  }
}
function withStateLockSync(lockPath, fn, options = {}) {
  const holder = acquireSync(lockPath, options);
  try {
    return fn();
  } finally {
    closeSync(holder.fd);
    release(lockPath, holder.record.token);
  }
}
function isStateLockTimeout(error) {
  return error instanceof UlwLoopError && error.code === ULW_LOOP_LOCK_TIMEOUT_CODE;
}
async function acquireAsync(lockPath, options) {
  const clock = options.clock ?? systemClock;
  const deadline = clock.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  mkdirSync(dirname(lockPath), { recursive: true });
  for (let attempt = 0;; ) {
    const outcome = attemptOnce(lockPath, options, clock.now(), options.leaseMs ?? DEFAULT_LEASE_MS);
    if (outcome.kind === "acquired")
      return outcome.holder;
    if (outcome.kind === "retry")
      continue;
    if (clock.now() >= deadline)
      throw lockTimeout(lockPath, options);
    await new Promise((resolve) => clock.schedule(resolve, backoffMs(attempt)));
    attempt += 1;
  }
}
function acquireSync(lockPath, options) {
  const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  mkdirSync(dirname(lockPath), { recursive: true });
  for (let attempt = 0;; ) {
    const outcome = attemptOnce(lockPath, options, Date.now());
    if (outcome.kind === "acquired")
      return outcome.holder;
    if (outcome.kind === "retry")
      continue;
    if (Date.now() >= deadline)
      throw lockTimeout(lockPath, options);
    Atomics.wait(SLEEP_CELL, 0, 0, backoffMs(attempt));
    attempt += 1;
  }
}
function attemptOnce(lockPath, options, now, leaseMs) {
  try {
    const holder = tryCreate(lockPath, now, leaseMs);
    if (holder !== null)
      return { kind: "acquired", holder };
    const snapshot = readSnapshot(lockPath, now);
    if (snapshot === null)
      return { kind: "retry" };
    const record = snapshot.record;
    const stale = record === null ? snapshot.ageMs > (options.staleMs ?? DEFAULT_STALE_MS) : !isProcessAlive(record.pid) || record.leaseUntil !== undefined && now > record.leaseUntil;
    if (stale && reclaim(lockPath, snapshot.raw))
      return { kind: "retry" };
    return { kind: "wait" };
  } catch (error) {
    if (hasCode2(error, "EINTR"))
      return { kind: "wait" };
    throw error;
  }
}
function writeRecord(holder) {
  const buf = Buffer.from(JSON.stringify(holder.record));
  ftruncateSync(holder.fd, 0);
  let offset = 0;
  while (offset < buf.length) {
    const written = writeSync(holder.fd, buf, offset, buf.length - offset, offset);
    if (written === 0)
      throw new Error("State lock write made no progress.");
    offset += written;
  }
}
function tryCreate(lockPath, now, leaseMs) {
  let fd;
  try {
    fd = openSync(lockPath, "wx");
  } catch (error) {
    if (hasCode2(error, "EEXIST"))
      return null;
    throw error;
  }
  const record = {
    pid: process.pid,
    createdAt: new Date(now).toISOString(),
    token: randomUUID(),
    ...leaseMs === undefined ? {} : { leaseUntil: now + leaseMs }
  };
  const holder = { fd, record };
  try {
    writeRecord(holder);
  } catch (error) {
    closeSync(fd);
    try {
      unlinkSync(lockPath);
    } catch (cleanup) {
      if (!hasCode2(cleanup, "ENOENT"))
        throw cleanup;
    }
    throw error;
  }
  return holder;
}
function readSnapshot(lockPath, now) {
  try {
    const raw = readFileSync2(lockPath, "utf8");
    return { raw, record: parseRecord(raw), ageMs: now - statSync(lockPath).mtimeMs };
  } catch (error) {
    if (hasCode2(error, "ENOENT"))
      return null;
    throw error;
  }
}
function parseRecord(raw) {
  try {
    const record = JSON.parse(raw);
    if (typeof record !== "object" || record === null)
      return null;
    if (!("pid" in record) || typeof record.pid !== "number" || !Number.isInteger(record.pid) || record.pid <= 0)
      return null;
    if (!("createdAt" in record) || typeof record.createdAt !== "string")
      return null;
    if (!("token" in record) || typeof record.token !== "string" || record.token.length === 0)
      return null;
    return {
      pid: record.pid,
      createdAt: record.createdAt,
      token: record.token,
      ..."leaseUntil" in record && typeof record.leaseUntil === "number" ? { leaseUntil: record.leaseUntil } : {}
    };
  } catch (error) {
    if (error instanceof SyntaxError)
      return null;
    throw error;
  }
}
function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (hasCode2(error, "ESRCH"))
      return false;
    if (hasCode2(error, "EPERM"))
      return true;
    throw error;
  }
}
function reclaim(lockPath, expectedRaw) {
  const current = readSnapshot(lockPath, Date.now());
  if (current === null)
    return true;
  if (current.raw !== expectedRaw)
    return false;
  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (hasCode2(error, "EPERM") || hasCode2(error, "EACCES"))
      return false;
    if (!hasCode2(error, "ENOENT"))
      throw error;
  }
  return true;
}
function release(lockPath, token) {
  if (readSnapshot(lockPath, Date.now())?.record?.token !== token)
    return;
  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (!hasCode2(error, "ENOENT"))
      throw error;
  }
}
function backoffMs(attempt) {
  return Math.min(100, 5 * 2 ** attempt) + Math.random() * 5;
}
function lockTimeout(lockPath, options) {
  const holder = readSnapshot(lockPath, Date.now())?.record;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const owner = holder == null ? "another process" : `pid ${holder.pid}`;
  return new UlwLoopError(`ulw-loop state lock ${lockPath} is held by ${owner} for more than ${timeoutMs}ms. The lock owner is still alive. If a JS eval kernel was interrupted while writing, wait for its lease to expire (${options.leaseMs ?? DEFAULT_LEASE_MS} ms) or restart the owning senpi process; never delete a lock owned by a live process.`, ULW_LOOP_LOCK_TIMEOUT_CODE, { details: { lockPath, timeoutMs, ...holder == null ? {} : { holderPid: holder.pid } } });
}
function hasCode2(error, code) {
  return error instanceof Error && "code" in error && error.code === code;
}

// components/ulw-loop/src/plan-io.ts
function readLedger2(repoRoot, scope) {
  const lockPath = ulwLoopStateLockPath(repoRoot, scope);
  if (heldLocks.getStore()?.has(lockPath)) {
    assertStateLockOwned(lockPath);
    materializeSync(ulwLoopDir(repoRoot, scope));
  }
  return readLedger(repoRoot, scope);
}
var LEGACY_OBJECTIVE_PREFIX = `Complete all ulw-loop stories in ${ULW_LOOP_DIR}/${ULW_LOOP_GOALS}: `;
var LEGACY_OBJECTIVE = `Complete all ulw-loop stories listed in ${ULW_LOOP_DIR}/${ULW_LOOP_GOALS}. Use ${ULW_LOOP_DIR}/${ULW_LOOP_LEDGER} as the durable audit trail.`;
var locks = new Map;
var heldLocks = new AsyncLocalStorage;
var lockOptions = new AsyncLocalStorage;
function tokenAt(lockPath) {
  const raw = readOptional(lockPath);
  if (raw === undefined)
    return;
  try {
    const record = JSON.parse(raw);
    return typeof record === "object" && record !== null && "token" in record && typeof record.token === "string" ? record.token : undefined;
  } catch (error) {
    if (error instanceof SyntaxError)
      return;
    throw error;
  }
}
function assertStateLockOwned(lockPath) {
  const context = heldLocks.getStore()?.get(lockPath);
  if (context === undefined)
    return;
  if (tokenAt(lockPath) !== context.token)
    throw new UlwLoopError("The ulw-loop mutation lock changed owners.", "ULW_LOOP_LOCK_LOST");
}
function migrationEntries(plan) {
  for (const context of heldLocks.getStore()?.values() ?? []) {
    const entries = context.migrations.get(plan.goalsPath);
    if (entries !== undefined) {
      context.migrations.delete(plan.goalsPath);
      return entries;
    }
  }
  return [];
}
async function withUlwLoopMutationLock(repoRoot, scopeOrFn, maybeFn, options = {}) {
  const scope = typeof scopeOrFn === "function" ? undefined : scopeOrFn;
  const fn = typeof scopeOrFn === "function" ? scopeOrFn : maybeFn;
  if (fn === undefined)
    throw new UlwLoopError("Missing ulw-loop mutation body.", "ULW_LOOP_LOCK_BODY_MISSING");
  const lockKey = `${repoRoot}\x00${ulwLoopRelativeDir(scope)}`;
  const lockPath = ulwLoopStateLockPath(repoRoot, scope);
  const locked = () => withStateLock(lockPath, async (token) => {
    return heldLocks.run(new Map([...heldLocks.getStore() ?? [], [lockPath, { token, migrations: new Map }]]), async () => {
      for (let attempt = 0;; attempt += 1) {
        try {
          return await fn();
        } catch (error) {
          if (!(error instanceof UlwLoopError) || error.code !== "ULW_LOOP_PUBLISH_CONFLICT")
            throw error;
          assertStateLockOwned(lockPath);
          if (attempt !== 0)
            throw error;
        }
      }
    });
  }, { ...lockOptions.getStore(), ...options });
  const prior = locks.get(lockKey) ?? Promise.resolve(undefined);
  const run = prior.then(locked, locked);
  const gate = run.then(() => {
    return;
  }, () => {
    return;
  });
  locks.set(lockKey, gate);
  gate.then(() => {
    if (locks.get(lockKey) === gate)
      locks.delete(lockKey);
  });
  return run;
}
function readUlwLoopPlanSync(repoRoot, scope) {
  const path = ulwLoopGoalsPath(repoRoot, scope);
  const parsed = reconcilePlan(ulwLoopDir(repoRoot, scope));
  if (parsed === undefined)
    throw planMissingError(repoRelative(path, repoRoot), listUlwLoopSessionIds(repoRoot));
  if (parsed.version !== 1 || !Array.isArray(parsed.goals))
    throw new UlwLoopError(`Invalid ulw-loop plan at ${repoRelative(path, repoRoot)}.`, "ULW_LOOP_PLAN_INVALID");
  const previousObjective = parsed.codexObjective;
  if ((parsed.codexGoalMode ?? "per_story") === "aggregate" && previousObjective !== undefined && (previousObjective === LEGACY_OBJECTIVE || previousObjective.startsWith(LEGACY_OBJECTIVE_PREFIX))) {
    parsed.codexObjective = aggregateCodexObjectiveForScope(scope);
    parsed.codexObjectiveAliases = [...new Set([...parsed.codexObjectiveAliases ?? [], previousObjective])];
    heldLocks.getStore()?.get(ulwLoopStateLockPath(repoRoot, scope))?.migrations.set(parsed.goalsPath, [
      {
        at: iso(),
        kind: "aggregate_objective_migrated",
        before: { codexObjective: previousObjective },
        after: { codexObjective: parsed.codexObjective }
      }
    ]);
  }
  return parsed;
}
async function readUlwLoopPlan(repoRoot, scope) {
  if (heldLocks.getStore()?.has(ulwLoopStateLockPath(repoRoot, scope))) {
    assertStateLockOwned(ulwLoopStateLockPath(repoRoot, scope));
    await materialize(ulwLoopDir(repoRoot, scope));
  }
  return readUlwLoopPlanSync(repoRoot, scope);
}
function listUlwLoopSessionIds(repoRoot) {
  try {
    return readdirSync2(ulwLoopDir(repoRoot), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}
function isSteeringKind(value) {
  return value === "steering_accepted" || value === "steering_rejected" || value === "criteria_revised" || value === "batch_updated";
}
async function findAcceptedSteeringLedgerEntry(repoRoot, key, scope) {
  return readLedger2(repoRoot, scope).find((entry) => isSteeringKind(entry.kind) && entry.steering?.invariant.accepted === true && (entry.idempotencyKey === key || entry.steering.idempotencyKey === key || entry.steering.promptSignature === key));
}

// components/ulw-loop/src/plan-commit.ts
var hooks = new AsyncLocalStorage2;
async function beforePlanMutation() {
  await hooks.getStore()?.beforeMutation?.();
}
async function writeViewFile(path, content) {
  await (hooks.getStore()?.writeView ?? writeFile)(path, content);
}
async function commit(repoRoot, scope, mutation) {
  const { plan } = mutation;
  const dir = ulwLoopDir(repoRoot, scope);
  assertStateLockOwned(ulwLoopStateLockPath(repoRoot, scope));
  await hooks.getStore()?.beforeCommit?.();
  const next = (plan.revision ?? 0) + 1;
  const brief = plan.brief ?? readOptional(join4(dir, "brief.md")) ?? "";
  const entries = [...migrationEntries(plan), ...mutation.entries].map((entry, seq) => ({
    ...entry,
    revision: next,
    id: `${next}-${seq}`
  }));
  const record = {
    version: 1,
    revision: next,
    plan: { ...plan, revision: next, brief },
    ledger: entries
  };
  mkdirSync2(join4(dir, "revisions"), { recursive: true });
  mkdirSync2(join4(dir, "tmp"), { recursive: true });
  const temp = join4(dir, "tmp", `${process.pid}-${randomUUID2()}.json`);
  try {
    writeFileSync(temp, `${JSON.stringify(record)}
`, { flag: "wx" });
    try {
      (hooks.getStore()?.link ?? linkSync)(temp, join4(dir, "revisions", `${String(next).padStart(8, "0")}.json`));
    } catch (error) {
      if (hasCode(error, "EEXIST"))
        throw new UlwLoopError("Another writer published the read revision.", "ULW_LOOP_PUBLISH_CONFLICT", {
          cause: error
        });
      if (["EPERM", "ENOTSUP", "EXDEV"].some((code) => hasCode(error, code)))
        throw new UlwLoopError("Immutable ulw-loop publication requires atomic hard links.", "ULW_LOOP_PUBLISH_UNSUPPORTED_FS", { cause: error });
      throw error;
    }
  } finally {
    rmSync(temp, { force: true });
  }
  plan.revision = next;
  plan.brief = brief;
  for (const [index, entry] of mutation.entries.entries())
    Object.assign(entry, entries[index + entries.length - mutation.entries.length]);
  await hooks.getStore()?.afterCommit?.();
  await materialize(dir);
}
function viewContents(dir) {
  const plan = reconcilePlan(dir);
  if (plan === undefined || readRecords(dir).length === 0)
    return [];
  const ledger = readLedgerAt(dir);
  assertProjectionComplete(plan, ledger);
  const views = [
    ["goals.json", `${JSON.stringify(plan, null, 2)}
`],
    ["ledger.jsonl", ledger.length === 0 ? "" : `${ledger.map((entry) => JSON.stringify(entry)).join(`
`)}
`],
    ["brief.md", plan.brief ?? readOptional(join4(dir, "brief.md")) ?? ""]
  ];
  return views.filter(([name, content]) => readOptional(join4(dir, name)) !== content);
}
function materializeSync(dir) {
  for (const [name, content] of viewContents(dir)) {
    mkdirSync2(join4(dir, "tmp"), { recursive: true });
    const temp = join4(dir, "tmp", `${process.pid}-${randomUUID2()}-${name}`);
    try {
      writeFileSync(temp, content, { flag: "wx" });
      renameSync(temp, join4(dir, name));
    } finally {
      rmSync(temp, { force: true });
    }
  }
}
async function materialize(dir) {
  for (const [name, content] of viewContents(dir)) {
    mkdirSync2(join4(dir, "tmp"), { recursive: true });
    const temp = join4(dir, "tmp", `${process.pid}-${randomUUID2()}-${name}`);
    try {
      await writeViewFile(temp, content);
      await rename(temp, join4(dir, name));
    } finally {
      rmSync(temp, { force: true });
    }
  }
}

// components/ulw-loop/src/evidence.ts
function ulwLoopFail(message, code, details) {
  throw new UlwLoopError(message, code, { details });
}
function ledgerKind(status) {
  switch (status) {
    case "pass":
      return "evidence_captured";
    case "fail":
      return "criterion_failed";
    case "blocked":
      return "criterion_blocked";
    default:
      return ulwLoopFail("Invalid criterion status.", "ULW_LOOP_CRITERION_STATUS_INVALID", { status });
  }
}
function findGoal(plan, goalId) {
  const goal = plan.goals.find((candidate) => candidate.id === goalId);
  return goal ?? ulwLoopFail(`UlwLoop goal not found: ${goalId}.`, "ULW_LOOP_GOAL_NOT_FOUND", { goalId });
}
function findCriterion(goal, criterionId) {
  const criterion = goal.successCriteria.find((candidate) => candidate.id === criterionId);
  return criterion ?? ulwLoopFail(`Success criterion not found: ${criterionId}.`, "ULW_LOOP_CRITERION_NOT_FOUND", {
    goalId: goal.id,
    criterionId
  });
}
function nonEmptyEvidence(evidence) {
  const trimmed = evidence.trim();
  return trimmed || ulwLoopFail("Evidence must be a non-empty string.", "ULW_LOOP_EVIDENCE_REQUIRED", {});
}
async function recordEvidence(repoRoot, args, scope) {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const goal = findGoal(plan, args.goalId);
    const criterion = findCriterion(goal, args.criterionId);
    const evidence = nonEmptyEvidence(args.evidence);
    const artifacts = resolveEvidenceArtifacts(repoRoot, args.artifacts);
    const kind = ledgerKind(args.status);
    const prevStatus = criterion.status;
    const capturedAt = iso();
    criterion.status = args.status;
    criterion.capturedEvidence = evidence;
    criterion.capturedAt = capturedAt;
    if (args.notes !== undefined)
      criterion.notes = args.notes;
    if (artifacts !== undefined)
      criterion.artifacts = artifacts;
    else
      delete criterion.artifacts;
    goal.updatedAt = capturedAt;
    plan.updatedAt = capturedAt;
    const ledgerEntry = {
      at: capturedAt,
      kind,
      goalId: goal.id,
      criterionId: criterion.id,
      criterionStatus: args.status,
      evidence,
      capturedEvidence: evidence,
      ...artifacts === undefined ? {} : { artifacts },
      before: { status: prevStatus },
      after: { goalId: goal.id, criterionId: criterion.id, status: args.status, evidence, capturedAt, prevStatus }
    };
    await commit(repoRoot, scope, { plan, entries: [ledgerEntry] });
    return { plan, goal, criterion, ledgerEntry };
  });
}
function unresolvedCriteriaOf(goal) {
  return goal.successCriteria.filter((criterion) => criterion.status !== "pass");
}
function unresolvedEssentialCriteriaOf(goal) {
  const essentialCriteria = new Set(essentialCriteriaOf(goal).map((criterion) => criterion.id));
  return goal.successCriteria.filter((criterion) => essentialCriteria.has(criterion.id) && criterion.status !== "pass");
}
function requireAllCriteriaPass(goal) {
  if (hasAllCriteriaPass(goal))
    return;
  throw new UlwLoopError(`Goal ${goal.id} has unresolved success criteria.`, "ulw_loop_criteria_not_all_pass", {
    details: {
      goalId: goal.id,
      unresolved: unresolvedCriteriaOf(goal).map((criterion) => ({ id: criterion.id, status: criterion.status }))
    }
  });
}
function requireAllPlanCriteriaPass(plan) {
  const unresolved = plan.goals.flatMap((goal) => unresolvedCriteriaOf(goal).map((criterion) => ({
    goalId: goal.id,
    id: criterion.id,
    status: criterion.status
  })));
  if (unresolved.length === 0)
    return;
  throw new UlwLoopError("Ulw-loop aggregate has unresolved success criteria.", "ulw_loop_criteria_not_all_pass", {
    details: { unresolved }
  });
}
function requireEssentialCriteriaPass(goal) {
  if (hasEssentialCriteriaPass(goal))
    return;
  throw new UlwLoopError(`Goal ${goal.id} has unresolved essential success criteria.`, "ulw_loop_criteria_not_all_pass", {
    details: {
      goalId: goal.id,
      unresolved: unresolvedEssentialCriteriaOf(goal).map((criterion) => ({
        id: criterion.id,
        status: criterion.status
      }))
    }
  });
}

// components/ulw-loop/src/quality-gate-artifacts.ts
import { resolve as resolve3 } from "node:path";

// components/ulw-loop/src/quality-gate-fields.ts
var PLACEHOLDER_PATTERN = /^(?:<replace:[^>]+>|placeholder|todo|tbd|n\/a|stub)$/i;
var activeCollector;
function withQualityGateCollector(operation) {
  const previous = activeCollector;
  const collector = { defects: [], poisonedFields: new Set, poisonedArtifactKinds: new Set };
  activeCollector = collector;
  try {
    const result = operation();
    if (collector.defects.length === 0)
      return result;
    throwQualityGateDefects(collector.defects);
  } finally {
    activeCollector = previous;
  }
}
function throwQualityGateDefects(defects) {
  const uniqueDefects = [
    ...new Map(defects.map((defect) => [`${defect.field}\x00${defect.message}`, defect])).values()
  ];
  const fields = uniqueDefects.slice(0, 25);
  const truncated = uniqueDefects.length > fields.length;
  const message = [
    `Final quality gate has ${fields.length}${truncated ? "+" : ""} validation defects:`,
    ...fields.map((item) => `- ${item.field}: ${item.message}`)
  ].join(`
`);
  throw new UlwLoopError(message, "ULW_LOOP_QUALITY_GATE_INVALID", {
    details: { field: fields[0]?.field, fields, ...truncated ? { truncated: true } : {} }
  });
}
function invalid(message, field) {
  if (activeCollector === undefined)
    throw new UlwLoopError(message, "ULW_LOOP_QUALITY_GATE_INVALID", { details: { field } });
  activeCollector.defects.push({ field, message });
  activeCollector.poisonedFields.add(field);
  return;
}
function isPoisoned(field) {
  return activeCollector?.poisonedFields.has(field) ?? false;
}
function markPoisonedArtifactKind(id) {
  activeCollector?.poisonedArtifactKinds.add(id);
}
function isPoisonedArtifactKind(id) {
  return activeCollector?.poisonedArtifactKinds.has(id) ?? false;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function section(value, field) {
  if (isRecord(value))
    return value;
  invalid(`Final quality gate is missing ${field} evidence (accepted input: a bare object with manualQa/gateReview/iteration/criteriaCoverage and optional codeReview, or the same object under a top-level "qualityGate" key).`, field);
  return {};
}
function textField(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    invalid(`Final quality gate requires non-empty ${field}.`, field);
    return "";
  }
  const trimmed = value.trim();
  if (PLACEHOLDER_PATTERN.test(trimmed))
    invalid(`Final quality gate rejects placeholder ${field}.`, field);
  return trimmed;
}
function numberField(value, field) {
  if (typeof value === "number" && Number.isFinite(value))
    return value;
  invalid(`Final quality gate requires numeric ${field}.`, field);
  return 0;
}
function stringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    invalid(`Final quality gate requires ${field}.`, field);
    return [];
  }
  return value.map((item) => textField(item, field));
}
function emptyBlockers(value, field) {
  if (Array.isArray(value) && value.length === 0)
    return [];
  invalid(`${field} must be empty.`, field);
  return [];
}
function literal(value, expected, field) {
  if (value === expected)
    return expected;
  invalid(`${field} must be ${String(expected)}.`, field);
  return expected;
}

// components/ulw-loop/src/quality-gate-artifacts.ts
var SUPPORTED_SURFACES = ["cli", "http", "tmux", "browser", "gui", "data"];
var SUPPORTED_KINDS = [
  "cli-transcript",
  "log",
  "screenshot",
  "image",
  "http-dump",
  "data-diff"
];
var COMPATIBLE_KINDS = {
  cli: ["cli-transcript", "log"],
  tmux: ["cli-transcript", "log"],
  http: ["http-dump"],
  browser: ["screenshot", "image"],
  gui: ["screenshot", "image"],
  data: ["data-diff"]
};
function isSupportedSurface(value) {
  return SUPPORTED_SURFACES.some((surface) => surface === value);
}
function isSupportedKind(value) {
  return SUPPORTED_KINDS.some((kind) => kind === value);
}
function surfaceField(value, field) {
  if (isSupportedSurface(value))
    return value;
  invalid(`${field} must be a supported manual QA surface (${SUPPORTED_SURFACES.join(", ")}).`, field);
  return "cli";
}
function kindField(value, field) {
  if (isSupportedKind(value))
    return value;
  invalid(`${field} must be a supported artifact kind (${SUPPORTED_KINDS.join(", ")}); review/QA reports belong in codeReview.reportPath or gateReview.reportPath, not artifactRefs.`, field);
  return "log";
}
function compatibleKindsFor(surface) {
  return COMPATIBLE_KINDS[surface];
}
function artifactCompatible(surface, kind) {
  return compatibleKindsFor(surface).includes(kind);
}
function checkFile(path, field, opts) {
  if (opts?.repoRoot === undefined || opts.fs === undefined || isPoisoned(field))
    return;
  const absolute = resolve3(opts.repoRoot, path);
  if (!opts.fs.existsSync(absolute)) {
    invalid(`${field} must point to an existing artifact.`, field);
    return;
  }
  if (opts.fs.statSync(absolute).size <= 0)
    invalid(`${field} must point to a non-empty artifact.`, field);
  if (opts.currentAttemptDir !== undefined && !isWithinAttemptDir(absolute, resolve3(opts.repoRoot, opts.currentAttemptDir)))
    invalid(`${field} (${path}) must point to an artifact from the current attempt (${opts.currentAttemptDir}).`, field);
}
function artifactMap(refs) {
  const byId = new Map;
  for (const ref of refs) {
    if (byId.has(ref.id))
      invalid(`manualQa.artifactRefs contains duplicate ${ref.id}.`, "manualQa.artifactRefs");
    byId.set(ref.id, ref);
  }
  return byId;
}
function parseArtifactRefs(value, opts) {
  if (!Array.isArray(value) || value.length === 0) {
    invalid("manualQa.artifactRefs must not be empty.", "manualQa.artifactRefs");
    return [];
  }
  return value.flatMap((item, index) => {
    const prefix = `manualQa.artifactRefs[${index}]`;
    const ref = section(item, prefix);
    if (isPoisoned(prefix))
      return [];
    const pathField = `${prefix}.path`;
    const idField = `${prefix}.id`;
    const kindFieldName = `${prefix}.kind`;
    const descriptionField = `${prefix}.description`;
    const path = textField(ref["path"], pathField);
    const id = textField(ref["id"], idField);
    const kind = kindField(ref["kind"], kindFieldName);
    if (isPoisoned(kindFieldName))
      markPoisonedArtifactKind(id);
    const description = textField(ref["description"], descriptionField);
    checkFile(path, pathField, opts);
    return [{ id, kind, description, path }];
  });
}
function referencedArtifacts(value, field, byId) {
  const ids = stringArray(value, field);
  if (isPoisoned(field))
    return [];
  return ids.flatMap((id) => {
    const artifact = byId.get(id);
    if (artifact === undefined) {
      invalid(`${field} references unknown artifact ${id}.`, field);
      return [];
    }
    return [artifact];
  });
}

// components/ulw-loop/src/quality-gate-verdicts.ts
function passedVerdict(value, field) {
  if (value === "not_applicable") {
    invalid(`${field} must not be not_applicable.`, field);
    return "passed";
  }
  return literal(value, "passed", field);
}
function codeQualityStatusField(value, field) {
  if (value === "CLEAR" || value === "WATCH")
    return value;
  invalid(`${field} must be CLEAR or WATCH.`, field);
  return "CLEAR";
}
function adversarialVerdict(row, field) {
  const value = row["verdict"];
  if (value === "passed")
    return { verdict: "passed" };
  if (value === "not_applicable") {
    return { verdict: "not_applicable", reason: textField(row["reason"], `${field}.reason`) };
  }
  invalid(`${field} must be passed or not_applicable with a reason.`, field);
  return { verdict: "passed" };
}

// components/ulw-loop/src/surface.ts
import { existsSync as existsSync4, readFileSync as readFileSync3 } from "node:fs";
import { dirname as dirname2, join as join5 } from "node:path";
import { fileURLToPath } from "node:url";
var REVIEWER_ROLES_BY_SURFACE = {
  lazycodex: {
    codeReview: "lazycodex-code-reviewer",
    manualQa: "lazycodex-qa-executor",
    gateReview: "lazycodex-gate-reviewer"
  },
  "omo-senpi": {
    codeReview: "omo-native-code-reviewer",
    manualQa: "omo-native-qa-executor",
    gateReview: "omo-native-gate-reviewer"
  }
};
var LEGACY_REVIEWER_AGENT_ALIASES = {
  "omo-senpi-code-reviewer": REVIEWER_ROLES_BY_SURFACE["omo-senpi"].codeReview,
  "omo-senpi-qa-executor": REVIEWER_ROLES_BY_SURFACE["omo-senpi"].manualQa,
  "omo-senpi-gate-reviewer": REVIEWER_ROLES_BY_SURFACE["omo-senpi"].gateReview
};
function canonicalReviewerAgentName(reviewer) {
  return LEGACY_REVIEWER_AGENT_ALIASES[reviewer] ?? reviewer;
}
var CANONICAL_GATE_REVIEW_NAMES = Object.values(REVIEWER_ROLES_BY_SURFACE).map((roles) => roles.gateReview);
var GATE_REVIEWER_AGENT_NAMES = new Set([
  ...CANONICAL_GATE_REVIEW_NAMES,
  ...Object.entries(LEGACY_REVIEWER_AGENT_ALIASES).filter(([, canonical]) => CANONICAL_GATE_REVIEW_NAMES.includes(canonical)).map(([legacy]) => legacy)
]);
var REQUIRED_GATE_SECTIONS_BY_SURFACE = {
  lazycodex: ["manualQa", "gateReview", "iteration", "criteriaCoverage"],
  "omo-senpi": ["manualQa", "gateReview", "iteration", "criteriaCoverage"]
};
var OPTIONAL_GATE_SECTIONS_BY_SURFACE = {
  lazycodex: ["codeReview"],
  "omo-senpi": []
};
var GATE_SECTION_BY_ACCEPTOR = {
  lazycodex: {
    codeReview: [REVIEWER_ROLES_BY_SURFACE.lazycodex.codeReview, "main-session"],
    manualQa: [REVIEWER_ROLES_BY_SURFACE.lazycodex.manualQa, "main-session"],
    gateReview: [
      REVIEWER_ROLES_BY_SURFACE.lazycodex.gateReview,
      "category:deep-high",
      "category:deep-low",
      "category:deep",
      "category:unspecified-high",
      "category:unspecified-low",
      "main-session"
    ]
  },
  "omo-senpi": {
    manualQa: ["main-session"],
    gateReview: [
      "category:deep-high",
      "category:deep-low",
      "category:deep",
      "category:unspecified-high",
      "category:unspecified-low"
    ]
  }
};
function reviewerRolesFor(surface) {
  return REVIEWER_ROLES_BY_SURFACE[surface];
}
var SURFACE_MARKER_FILENAME = "surface.json";
var SURFACE_ENV_KEY = "OMO_AGENT_TOOLKIT_SURFACE";
function parseSurface(value) {
  return value === "lazycodex" || value === "omo-senpi" ? value : null;
}
function resolveToolkitSurface(options) {
  const env = options?.env ?? process.env;
  const fromEnv = parseSurface(env[SURFACE_ENV_KEY]);
  if (fromEnv !== null)
    return fromEnv;
  const entryDir = options?.entryDir ?? dirname2(fileURLToPath(import.meta.url));
  const markerPath = join5(entryDir, SURFACE_MARKER_FILENAME);
  return readMarkerSurface(markerPath) ?? "lazycodex";
}
function readMarkerSurface(markerPath) {
  try {
    if (!existsSync4(markerPath))
      return null;
    const parsed = JSON.parse(readFileSync3(markerPath, "utf8"));
    return parseSurface(parsed["surface"]);
  } catch (error) {
    if (error instanceof Error)
      return null;
    throw error;
  }
}

// components/ulw-loop/src/quality-gate-blockers.ts
var BLOCKER_FIELD_KEYS = "blocker blockerSignature blockerEvidence blockerOccurrences blockedAt".split(" ");
var URL_PATTERN = /https?:\/\/\S+/g;
var PUNCTUATION_PATTERN = /[`"'()[\]{}:,;]/g;
var WHITESPACE_PATTERN = /\s+/g;
var AUTH_PATTERN = /\b(auth\w*|credential\w*|token|permission\w*|scope\w*|access|unauthorized|forbidden|401|403)\b/;
var MISSING_PATTERN = /\b(unset|missing|required|requires|without|omit\w*|not set|not available|no read packages|read packages)\b/;
var GHCR_PATTERN = /\b(ghcr|github container registry|read packages|imagepullsecret|package api|anonymous|container image)\b/;
var GHCR_401_PATTERN = /\b(401|unauthorized|anonymous pull|authentication required)\b/;
var GHCR_403_PATTERN = /\b(403|forbidden|read packages|package api)\b/;
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeBlockerEvidence(evidence) {
  const withoutUrls = evidence.toLowerCase().replace(URL_PATTERN, " ");
  const withoutPunctuation = withoutUrls.replace(PUNCTUATION_PATTERN, " ");
  return withoutPunctuation.replace(WHITESPACE_PATTERN, " ").trim();
}
function classifyExternalAuthorizationBlocker(evidence) {
  const normalized = normalizeBlockerEvidence(evidence);
  if (!normalized || !AUTH_PATTERN.test(normalized) || !MISSING_PATTERN.test(normalized))
    return null;
  if (!GHCR_PATTERN.test(normalized))
    return "EXTERNAL_AUTHORIZATION_REQUIRED";
  const status401 = GHCR_401_PATTERN.test(normalized) ? "HTTP_401_ANONYMOUS" : null;
  const status403 = GHCR_403_PATTERN.test(normalized) ? "HTTP_403_NO_READ_PACKAGES" : null;
  const status = [status401, status403].filter((part) => part !== null).join("+");
  return `GHCR_PULL_ACCESS:${status || "AUTHORIZATION_REQUIRED"}:GHCR_VISIBILITY_OR_CREDENTIAL_REQUIRED`;
}
function nestedBlockerSignature(goal) {
  const blocker = Reflect.get(goal, "blocker");
  const signature = isRecord2(blocker) ? blocker["signature"] : null;
  return typeof signature === "string" ? signature : null;
}
function sameBlockerOccurrences(plan, signature) {
  return plan.goals.filter((goal) => goal.blockerSignature === signature || nestedBlockerSignature(goal) === signature).length;
}
function clearGoalBlockerFields(goal) {
  for (const key of BLOCKER_FIELD_KEYS)
    Reflect.deleteProperty(goal, key);
}

// components/ulw-loop/src/quality-gate.ts
function reviewerAcceptorField(value, surface, sectionName) {
  const field = `${sectionName}.by`;
  const accepted = GATE_SECTION_BY_ACCEPTOR[surface][sectionName];
  if (typeof value !== "string" || value.trim() === "") {
    textField(value, field);
    return accepted?.[0] ?? "";
  }
  const actual = textField(value, field);
  if (accepted === undefined || !accepted.includes(actual))
    invalid(`${field} must be one of ${accepted?.join(", ") ?? "the configured reviewers"}.`, field);
  return actual;
}
function validateQualityGate(input, opts) {
  return withQualityGateCollector(() => validateQualityGateUncollected(input, opts));
}
function validateQualityGateUncollected(input, opts) {
  const surface = opts?.reviewerSurface ?? "lazycodex";
  const raw = input;
  const gate = section(raw && typeof raw === "object" && "qualityGate" in raw ? raw["qualityGate"] : input, "qualityGate");
  for (const name of REQUIRED_GATE_SECTIONS_BY_SURFACE[surface])
    section(gate[name], name);
  for (const name of Object.keys(gate)) {
    if (name === "codeReview" && !OPTIONAL_GATE_SECTIONS_BY_SURFACE[surface].includes(name))
      invalid("omo-senpi gate has no codeReview lane.", name);
  }
  if (surface === "omo-senpi" && gate["codeReview"] !== undefined)
    invalid("omo-senpi gate has no codeReview lane.", "codeReview");
  const manualQa = section(gate["manualQa"], "manualQa");
  const gateReview = section(gate["gateReview"], "gateReview");
  const iteration = section(gate["iteration"], "iteration");
  const coverage = section(gate["criteriaCoverage"], "criteriaCoverage");
  const codeReview = gate["codeReview"] !== undefined ? section(gate["codeReview"], "codeReview") : undefined;
  const manualQaBy = reviewerAcceptorField(manualQa["by"], surface, "manualQa");
  const gateReviewBy = reviewerAcceptorField(gateReview["by"], surface, "gateReview");
  const manualQaEvidence = textField(manualQa["evidence"], "manualQa.evidence");
  const gateReviewEvidence = textField(gateReview["evidence"], "gateReview.evidence");
  const totalCriteria = numberField(coverage["totalCriteria"], "criteriaCoverage.totalCriteria");
  const passCount = numberField(coverage["passCount"], "criteriaCoverage.passCount");
  if (!isPoisoned("criteriaCoverage.passCount") && passCount < totalCriteria)
    invalid("criteriaCoverage.passCount must cover totalCriteria.", "criteriaCoverage.passCount");
  const artifactRefs = parseArtifactRefs(manualQa["artifactRefs"], opts);
  const byId = artifactMap(artifactRefs);
  const surfaceEvidence = parseSurfaceEvidence(manualQa["surfaceEvidence"], byId);
  const adversarialCases = parseAdversarialCases(manualQa["adversarialCases"], byId);
  const gateReportPath = textField(gateReview["reportPath"], "gateReview.reportPath");
  if (!isPoisoned("gateReview.reportPath"))
    checkFile(gateReportPath, "gateReview.reportPath", opts);
  const common = {
    manualQa: {
      by: manualQaBy,
      status: literal(manualQa["status"], "passed", "manualQa.status"),
      evidence: manualQaEvidence,
      surfaceEvidence,
      adversarialCases,
      artifactRefs
    },
    gateReview: {
      by: gateReviewBy,
      recommendation: literal(gateReview["recommendation"], "APPROVE", "gateReview.recommendation"),
      reportPath: gateReportPath,
      evidence: gateReviewEvidence,
      blockers: emptyBlockers(gateReview["blockers"], "gateReview.blockers")
    },
    iteration: {
      fullRerun: literal(iteration["fullRerun"], true, "iteration.fullRerun"),
      status: literal(iteration["status"], "passed", "iteration.status"),
      rerunCommands: stringArray(iteration["rerunCommands"], "iteration.rerunCommands"),
      evidence: textField(iteration["evidence"], "iteration.evidence")
    },
    criteriaCoverage: {
      totalCriteria,
      passCount,
      originalIntent: textField(coverage["originalIntent"], "criteriaCoverage.originalIntent"),
      desiredOutcome: textField(coverage["desiredOutcome"], "criteriaCoverage.desiredOutcome"),
      userOutcomeReview: textField(coverage["userOutcomeReview"], "criteriaCoverage.userOutcomeReview"),
      adversarialClassesCovered: stringArray(coverage["adversarialClassesCovered"], "criteriaCoverage.adversarialClassesCovered")
    }
  };
  if (surface === "omo-senpi")
    return { surface, ...common };
  if (codeReview === undefined)
    return { surface, ...common };
  const codeReportPath = textField(codeReview["reportPath"], "codeReview.reportPath");
  checkFile(codeReportPath, "codeReview.reportPath", opts);
  return {
    surface,
    ...common,
    codeReview: {
      by: reviewerAcceptorField(codeReview["by"], surface, "codeReview"),
      recommendation: literal(codeReview["recommendation"], "APPROVE", "codeReview.recommendation"),
      codeQualityStatus: codeQualityStatusField(codeReview["codeQualityStatus"], "codeReview.codeQualityStatus"),
      reportPath: codeReportPath,
      evidence: textField(codeReview["evidence"], "codeReview.evidence"),
      blockers: emptyBlockers(codeReview["blockers"], "codeReview.blockers")
    }
  };
}
function parseSurfaceEvidence(value, byId) {
  if (!Array.isArray(value) || value.length === 0) {
    invalid("manualQa.surfaceEvidence must not be empty.", "manualQa.surfaceEvidence");
    return [];
  }
  return value.flatMap((item, index) => {
    const row = section(item, `manualQa.surfaceEvidence[${index}]`);
    if (isPoisoned(`manualQa.surfaceEvidence[${index}]`))
      return [];
    const surface = surfaceField(row["surface"], `manualQa.surfaceEvidence[${index}].surface`);
    const artifacts = referencedArtifacts(row["artifactRefs"], `manualQa.surfaceEvidence[${index}].artifactRefs`, byId);
    for (const artifact of artifacts) {
      if (isPoisoned(`manualQa.surfaceEvidence[${index}].surface`) || isPoisonedArtifactKind(artifact.id))
        continue;
      if (!artifactCompatible(surface, artifact.kind)) {
        invalid(`manualQa.surfaceEvidence ${surface} artifact ${artifact.kind} is incompatible; surface "${surface}" accepts artifact kinds: ${compatibleKindsFor(surface).join(", ")}.`, "manualQa.surfaceEvidence");
      }
    }
    return {
      id: textField(row["id"], `manualQa.surfaceEvidence[${index}].id`),
      criterionRef: textField(row["criterionRef"], `manualQa.surfaceEvidence[${index}].criterionRef`),
      surface,
      invocation: textField(row["invocation"], `manualQa.surfaceEvidence[${index}].invocation`),
      verdict: passedVerdict(row["verdict"], `manualQa.surfaceEvidence[${index}].verdict`),
      artifactRefs: artifacts.map((artifact) => artifact.id)
    };
  });
}
function parseAdversarialCases(value, byId) {
  if (!Array.isArray(value) || value.length === 0) {
    invalid("manualQa.adversarialCases must not be empty.", "manualQa.adversarialCases");
    return [];
  }
  return value.flatMap((item, index) => {
    const row = section(item, `manualQa.adversarialCases[${index}]`);
    if (isPoisoned(`manualQa.adversarialCases[${index}]`))
      return [];
    const artifacts = referencedArtifacts(row["artifactRefs"], `manualQa.adversarialCases[${index}].artifactRefs`, byId);
    const verdictInfo = adversarialVerdict(row, `manualQa.adversarialCases[${index}]`);
    return {
      id: textField(row["id"], `manualQa.adversarialCases[${index}].id`),
      criterionRef: textField(row["criterionRef"], `manualQa.adversarialCases[${index}].criterionRef`),
      scenario: textField(row["scenario"], `manualQa.adversarialCases[${index}].scenario`),
      expectedBehavior: textField(row["expectedBehavior"], `manualQa.adversarialCases[${index}].expectedBehavior`),
      verdict: verdictInfo.verdict,
      ...verdictInfo.reason === undefined ? {} : { reason: verdictInfo.reason },
      artifactRefs: artifacts.map((artifact) => artifact.id)
    };
  });
}

// components/ulw-loop/src/cli-arg-parser.ts
import { readFile as readFile2 } from "node:fs/promises";
var VALUE_FLAGS = new Set("--brief --brief-file --session-id --codex-goal-mode --validation-batch-json --goal --goal-id --criterion-id --status --evidence --notes --codex-goal-json --quality-gate-json --kind --rationale --title --objective --target-goal-id --source --after-json --directive-json --directive-file --idempotency-key --proposals-json".split(" "));
var SUBCOMMANDS = new Set("create-goals status complete-goals criteria record-evidence checkpoint steer add-goal record-review-blockers".split(" "));
function hasFlag(argv, flag) {
  return argv.includes(flag);
}
function readValue(argv, flag) {
  const index = argv.indexOf(flag);
  if (index >= 0) {
    const next = argv[index + 1];
    return next === undefined || next.startsWith("--") ? undefined : next;
  }
  const prefix = `${flag}=`;
  return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}
function parseGoalArg(argv) {
  return readValue(argv, "--goal-id") ?? readValue(argv, "--goal");
}
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
function positionalText(argv) {
  const words = [];
  for (let index = SUBCOMMANDS.has(argv[0] ?? "") ? 1 : 0;index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined)
      continue;
    if (VALUE_FLAGS.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("--"))
      continue;
    words.push(arg);
  }
  return words.join(" ").trim();
}
function looksLikeJson(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}
async function readJsonInput(value) {
  if (value === undefined)
    return;
  try {
    return JSON.parse(looksLikeJson(value) ? value : await readFile2(value, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new UlwLoopError(`Invalid JSON input: ${message}`, "ULW_LOOP_JSON_INPUT_INVALID", { cause: error });
  }
}
async function parseCodexGoalJson(value) {
  if (value === undefined)
    return;
  try {
    const raw = looksLikeJson(value) ? value : await readFile2(value, "utf8");
    JSON.parse(raw);
    return raw;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new UlwLoopError(`Invalid --codex-goal-json: ${looksLikeJson(value) ? message : "neither valid JSON nor a readable path"}`, "ULW_LOOP_CODEX_GOAL_JSON_INVALID", { cause: error });
  }
}
function required(argv, flag, code) {
  const value = readValue(argv, flag)?.trim();
  if (value)
    return value;
  throw new UlwLoopError(`Missing ${flag}.`, code, { details: { flag } });
}
function evidenceStatus(value) {
  switch (value) {
    case "pass":
      return "pass";
    case "fail":
      return "fail";
    case "blocked":
      return "blocked";
    default:
      throw new UlwLoopError("Invalid --status; expected pass, fail, or blocked.", "ULW_LOOP_EVIDENCE_STATUS_INVALID", { details: { status: value } });
  }
}
function parseRecordEvidenceArgs(argv) {
  const result = { goalId: required(argv, "--goal-id", "ULW_LOOP_GOAL_ID_REQUIRED"), criterionId: required(argv, "--criterion-id", "ULW_LOOP_CRITERION_ID_REQUIRED"), status: evidenceStatus(required(argv, "--status", "ULW_LOOP_EVIDENCE_STATUS_REQUIRED")), evidence: required(argv, "--evidence", "ULW_LOOP_EVIDENCE_REQUIRED") };
  const notes = readValue(argv, "--notes")?.trim();
  return notes ? { ...result, notes } : result;
}

// components/ulw-loop/src/validation-batch.ts
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function read(value, key) {
  return Object.entries(value).find(([name]) => name === key)?.[1];
}
function text(value, key) {
  const candidate = read(value, key);
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : undefined;
}
function strings(value, key) {
  const candidate = read(value, key);
  return Array.isArray(candidate) && candidate.every((item) => typeof item === "string" && item.trim().length > 0) ? candidate.map((item) => item.trim()) : undefined;
}
async function parseValidationBatches(input, goals) {
  const raw = await readJsonInput(input);
  if (raw === undefined)
    return;
  if (!Array.isArray(raw))
    fail2("--validation-batch-json must be a JSON array.");
  const batches = raw.map(batchFromObject);
  validateBatches(batches, goals);
  return batches;
}
function batchFromObject(value) {
  if (!isObject(value))
    fail2("validation batch entries must be objects.");
  const batchId = text(value, "batchId");
  const memberIds = strings(value, "memberIds");
  const finalGoalId = text(value, "finalGoalId");
  if (batchId === undefined)
    fail2("validation batch requires batchId.");
  if (memberIds === undefined || memberIds.length < 2)
    fail2("validation batch requires at least two memberIds.");
  if (finalGoalId === undefined)
    fail2("validation batch requires finalGoalId.");
  return { batchId, memberIds, finalGoalId };
}
function validateBatches(batches, goals) {
  const goalIds = new Set(goals.map((goal) => goal.id));
  const batchIds = new Set;
  const members = new Set;
  for (const batch of batches) {
    if (batchIds.has(batch.batchId))
      fail2(`duplicate validation batch id: ${batch.batchId}.`);
    batchIds.add(batch.batchId);
    if (new Set(batch.memberIds).size !== batch.memberIds.length)
      fail2(`validation batch ${batch.batchId} has duplicate memberIds.`);
    if (!batch.memberIds.includes(batch.finalGoalId))
      fail2(`validation batch ${batch.batchId} finalGoalId must be a member.`, "ULW_LOOP_VALIDATION_BATCH_FINAL_NOT_MEMBER");
    for (const memberId of batch.memberIds) {
      if (!goalIds.has(memberId))
        fail2(`validation batch ${batch.batchId} references unknown goal: ${memberId}.`, "ULW_LOOP_VALIDATION_BATCH_MEMBER_UNKNOWN");
      if (members.has(memberId))
        fail2(`goal appears in multiple validation batches: ${memberId}.`, "ULW_LOOP_VALIDATION_BATCH_OVERLAP");
      members.add(memberId);
    }
  }
}
function updateBatchesAfterSupersede(plan, targetId, replacementIds) {
  if (replacementIds.length === 0 || plan.validationBatches === undefined)
    return;
  plan.validationBatches = plan.validationBatches.map((batch) => {
    if (!batch.memberIds.includes(targetId))
      return batch;
    const memberIds = batch.memberIds.flatMap((id) => id === targetId ? [...replacementIds] : [id]);
    const replacementFinalGoalId = replacementIds[replacementIds.length - 1] ?? batch.finalGoalId;
    const finalGoalId = batch.finalGoalId === targetId ? replacementFinalGoalId : batch.finalGoalId;
    return { batchId: batch.batchId, memberIds, finalGoalId };
  });
}
function batchUpdateLedgerEntry(before, after, at) {
  if (JSON.stringify(before.validationBatches ?? []) === JSON.stringify(after.validationBatches ?? []))
    return null;
  return { at, kind: "batch_updated", before: before.validationBatches ?? [], after: after.validationBatches ?? [], message: "Validation batch membership updated after steering." };
}
function batchOf(plan, goalId) {
  return plan.validationBatches?.find((batch) => batch.memberIds.includes(goalId));
}
function batchClosedBy(plan, goalId) {
  const batch = batchOf(plan, goalId);
  return batch?.finalGoalId === goalId ? batch : undefined;
}
function requireBatchFinalReady(plan, goal) {
  const batch = batchClosedBy(plan, goal.id);
  if (batch === undefined)
    return;
  const open = batch.memberIds.filter((id) => id !== goal.id && !memberResolved(plan, id));
  if (open.length > 0)
    throw new UlwLoopError("Validation batch has unresolved members.", "ULW_LOOP_VALIDATION_BATCH_OPEN", { details: { batchId: batch.batchId, open } });
}
function requireAllValidationBatchesClosed(plan, closingGoalId) {
  const open = (plan.validationBatches ?? []).filter((batch) => batch.memberIds.some((id) => id !== closingGoalId && !memberResolved(plan, id)));
  if (open.length > 0)
    throw new UlwLoopError("Validation batches remain open.", "ULW_LOOP_VALIDATION_BATCH_OPEN", { details: { batchIds: open.map((batch) => batch.batchId) } });
}
function requireBatchGate(plan, goal, gate) {
  const batch = batchClosedBy(plan, goal.id);
  if (batch === undefined)
    return;
  const members = batch.memberIds.map((id) => plan.goals.find((item) => item.id === id)).filter((item) => item !== undefined);
  const pending = members.flatMap((member) => member.successCriteria.filter((criterion) => criterion.status !== "pass").map((criterion) => `${member.id}:${criterion.id}`));
  if (pending.length > 0)
    throw new UlwLoopError("Validation batch criteria remain pending.", "ULW_LOOP_VALIDATION_BATCH_CRITERIA_PENDING", { details: { batchId: batch.batchId, pending } });
  const totalCriteria = members.reduce((sum, member) => sum + member.successCriteria.length, 0);
  const passCount = members.reduce((sum, member) => sum + member.successCriteria.filter((criterion) => criterion.status === "pass").length, 0);
  if (gate.criteriaCoverage.totalCriteria !== totalCriteria || gate.criteriaCoverage.passCount !== passCount)
    throw new UlwLoopError("Validation batch gate coverage does not match member criteria.", "ULW_LOOP_VALIDATION_BATCH_GATE_MISMATCH", { details: { batchId: batch.batchId, expected: { totalCriteria, passCount }, actual: gate.criteriaCoverage } });
}
function memberResolved(plan, goalId) {
  const goal = plan.goals.find((candidate) => candidate.id === goalId);
  return goal !== undefined && isMemberResolved(goal, plan);
}
function fail2(message, code = "ULW_LOOP_VALIDATION_BATCH_INVALID") {
  throw new UlwLoopError(message, code);
}

// components/ulw-loop/src/checkpoint.ts
var QUALITY_GATE_FS = { existsSync: existsSync5, statSync: statSync2 };
function ulwLoopFail2(message, code) {
  throw new UlwLoopError(message, code);
}
function nonEmptyEvidence2(value) {
  const trimmed = value.trim();
  return trimmed || ulwLoopFail2("Evidence must be a non-empty string.", "ulw_loop_evidence_required");
}
function findGoal2(plan, goalId) {
  const goal = plan.goals.find((candidate) => candidate.id === goalId);
  return goal ?? ulwLoopFail2(`Unknown ulw-loop id: ${goalId}.`, "ulw_loop_goal_not_found");
}
async function readJsonInput2(raw, repoRoot) {
  if (raw === undefined || raw.trim() === "")
    return;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    if (!(error instanceof SyntaxError))
      throw error;
  }
  const path = resolve4(repoRoot, trimmed);
  if (!existsSync5(path))
    return ulwLoopFail2("Quality gate JSON is neither valid JSON nor a readable path.", "ulw_loop_json_input_invalid");
  try {
    return JSON.parse(await readFile3(path, "utf8"));
  } catch (error) {
    return ulwLoopFail2(`Quality gate path does not contain valid JSON${error instanceof Error ? `: ${error.message}` : "."}`, "ulw_loop_json_input_invalid");
  }
}
function makeAggregateCompletion(now, evidence, codexGoal) {
  return { status: "complete", completedAt: now, evidence, codexGoal };
}
function applyBlockedOrFailed(goal, plan, status, evidence, now) {
  const signature = classifyExternalAuthorizationBlocker(evidence);
  const occurrences = signature === null ? 0 : sameBlockerOccurrences(plan, signature) + 1;
  const needsDecision = signature !== null && occurrences >= 3;
  goal.status = needsDecision ? "needs_user_decision" : status;
  goal.updatedAt = now;
  if (status === "failed" || needsDecision) {
    goal.failedAt = now;
    goal.failureReason = evidence;
  }
  if (status === "blocked" || needsDecision)
    goal.blockedReason = evidence;
  if (signature !== null) {
    goal.blockerSignature = signature;
    goal.blockerOccurrenceCount = occurrences;
    goal.requiredExternalDecision = `Resolve external authorization: ${signature}`;
  }
  if (needsDecision)
    goal.nonRetriable = true;
  if (plan.activeGoalId === goal.id)
    delete plan.activeGoalId;
}
function ledgerKind2(status, goal, aggregateCompletion) {
  if (aggregateCompletion !== undefined)
    return "aggregate_completed";
  if (status === "complete")
    return "goal_completed";
  if (goal.status === "needs_user_decision")
    return "goal_needs_user_decision";
  return status === "blocked" ? "goal_blocked" : "goal_failed";
}
function buildLedger(now, args, goal, qualityGate, codexGoal, aggregateCompletion) {
  const watch = qualityGate?.surface === "lazycodex" && qualityGate.codeReview?.codeQualityStatus === "WATCH";
  const entry = {
    at: now,
    kind: ledgerKind2(args.status, goal, aggregateCompletion),
    goalId: goal.id,
    status: goal.status,
    evidence: watch && qualityGate.surface === "lazycodex" ? `${args.evidence} | codeQuality=WATCH: ${qualityGate.codeReview?.evidence ?? ""}` : args.evidence
  };
  if (codexGoal !== undefined)
    entry.codexGoal = codexGoal;
  if (qualityGate !== undefined)
    entry.qualityGate = qualityGate;
  if (goal.blockerSignature !== undefined)
    entry.blockerSignature = goal.blockerSignature;
  if (goal.blockerOccurrenceCount !== undefined)
    entry.blockerOccurrenceCount = goal.blockerOccurrenceCount;
  if (goal.requiredExternalDecision !== undefined)
    entry.requiredExternalDecision = goal.requiredExternalDecision;
  return entry;
}
async function checkpointUlwLoop(repoRoot, args, scope, dependencies) {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const goal = findGoal2(plan, args.goalId);
    const evidence = nonEmptyEvidence2(args.evidence);
    const now = iso();
    let aggregateCompletion;
    let qualityGate;
    let codexGoal;
    let nextActions = [];
    let warnings = [];
    if (args.status === "complete") {
      const aggregate = codexGoalMode(plan) === "aggregate";
      const final = isFinalRunCompletionCandidate(plan, goal);
      const closesBatch = batchClosedBy(plan, goal.id) !== undefined;
      if (final) {
        requireAllCriteriaPass(goal);
        requireAllPlanCriteriaPass(plan);
        requireAllValidationBatchesClosed(plan, goal.id);
      } else if (aggregate)
        requireEssentialCriteriaPass(goal);
      else
        requireAllCriteriaPass(goal);
      let codexValidationError;
      try {
        const validation = await validateCheckpointCodexGoal({
          repoRoot,
          plan,
          goal,
          raw: args.codexGoalJson,
          evidence,
          ...scope === undefined ? {} : { scope }
        });
        codexGoal = validation.raw;
        nextActions = validation.nextActions;
        warnings = validation.warnings;
        acknowledgeDriverObjective(plan, validation.unacknowledgedObjective);
      } catch (error) {
        if (!(error instanceof UlwLoopError))
          throw error;
        codexValidationError = error;
      }
      if (closesBatch)
        requireBatchFinalReady(plan, goal);
      if (closesBatch && args.qualityGateJson === undefined)
        throw new UlwLoopError("Validation batch final checkpoint requires --quality-gate-json.", "ULW_LOOP_VALIDATION_BATCH_GATE_REQUIRED");
      if (final)
        aggregateCompletion = makeAggregateCompletion(now, evidence, codexGoal);
      if (final || aggregateCompletion !== undefined || closesBatch) {
        try {
          qualityGate = validateQualityGate(await readJsonInput2(args.qualityGateJson, repoRoot), {
            repoRoot,
            fs: QUALITY_GATE_FS,
            reviewerSurface: dependencies?.surface ?? resolveToolkitSurface(),
            ...plan.evidenceLayoutVersion === 2 ? { currentAttemptDir: ulwLoopAttemptEvidenceDir(goal.id, goal.attempt, scope) } : {}
          });
          requireBatchGate(plan, goal, qualityGate);
        } catch (error) {
          if (!(error instanceof UlwLoopError) || codexValidationError === undefined)
            throw error;
          throw combineCheckpointValidationErrors(codexValidationError, error);
        }
      }
      if (codexValidationError !== undefined)
        throw codexValidationError;
      goal.status = "complete";
      goal.completedAt = now;
      goal.evidence = evidence;
      delete goal.failedAt;
      delete goal.failureReason;
      clearGoalBlockerFields(goal);
      if (plan.activeGoalId === goal.id)
        delete plan.activeGoalId;
    } else
      applyBlockedOrFailed(goal, plan, args.status, evidence, now);
    goal.updatedAt = now;
    if (aggregateCompletion !== undefined)
      plan.aggregateCompletion = aggregateCompletion;
    if (aggregateCompletion !== undefined)
      nextActions = [...nextActions, 'aggregate complete — now update_goal({status:"complete"})'];
    plan.updatedAt = now;
    const ledgerEntry = buildLedger(now, args, goal, qualityGate, codexGoal, aggregateCompletion);
    const entries = [ledgerEntry];
    const closedBatch = args.status === "complete" ? batchClosedBy(plan, goal.id) : undefined;
    if (closedBatch !== undefined)
      entries.push({ at: now, kind: "batch_closed", goalId: goal.id, message: closedBatch.batchId });
    await commit(repoRoot, scope, { plan, entries });
    return aggregateCompletion === undefined ? { plan, goal, ledgerEntry, nextActions, warnings } : { plan, goal, ledgerEntry, aggregateCompletion, nextActions, warnings };
  });
}

// components/ulw-loop/src/checkpoint-template.ts
function artifactPath(base, name) {
  return `${base}/${name}`;
}
function gateTemplate(surface, base) {
  const artifacts = [
    {
      id: "artifact-cli",
      kind: "cli-transcript",
      description: "<replace:artifact description>",
      path: artifactPath(base, "cli-transcript.txt")
    },
    {
      id: "artifact-data",
      kind: "data-diff",
      description: "<replace:artifact description>",
      path: artifactPath(base, "data-diff.txt")
    }
  ];
  const manualQa = {
    by: "main-session",
    status: "passed",
    evidence: "<replace:manual QA evidence>",
    surfaceEvidence: [
      {
        id: "surface-cli",
        criterionRef: "<replace:criterion id>",
        surface: "cli",
        invocation: "<replace:command>",
        verdict: "passed",
        artifactRefs: ["artifact-cli"]
      },
      {
        id: "surface-data",
        criterionRef: "<replace:criterion id>",
        surface: "data",
        invocation: "<replace:command>",
        verdict: "passed",
        artifactRefs: ["artifact-data"]
      }
    ],
    adversarialCases: [
      {
        id: "<replace:adversarial case id>",
        criterionRef: "<replace:criterion id>",
        scenario: "<replace:scenario>",
        expectedBehavior: "<replace:expected behavior>",
        verdict: "not_applicable",
        reason: "<replace:reason>",
        artifactRefs: ["artifact-cli"]
      }
    ],
    artifactRefs: artifacts
  };
  const common = {
    manualQa,
    gateReview: {
      by: surface === "omo-senpi" ? "category:deep-high" : "main-session",
      recommendation: "APPROVE",
      reportPath: artifactPath(base, "gate-review.md"),
      evidence: "<replace:gate review evidence>",
      blockers: [],
      notes: []
    },
    iteration: {
      fullRerun: true,
      status: "passed",
      rerunCommands: ["<replace:verification command>"],
      evidence: "<replace:iteration evidence>"
    },
    criteriaCoverage: {
      totalCriteria: 0,
      passCount: 0,
      originalIntent: "<replace:original intent>",
      desiredOutcome: "<replace:desired outcome>",
      userOutcomeReview: "<replace:user outcome review>",
      adversarialClassesCovered: ["<replace:adversarial class>"]
    }
  };
  return common;
}
async function checkpointTemplate(repoRoot, scope, goalId, dependencies) {
  const plan = await readUlwLoopPlan(repoRoot, scope);
  const surface = dependencies?.surface ?? resolveToolkitSurface();
  const targetId = goalId ?? plan.activeGoalId;
  const active = plan.goals.find((goal) => goal.id === targetId);
  if (goalId !== undefined && active === undefined)
    throw new UlwLoopError(`Unknown ulw-loop id: ${goalId}.`, "ULW_LOOP_GOAL_NOT_FOUND", { details: { goalId } });
  const hasAttempt = plan.evidenceLayoutVersion === 2 && active !== undefined;
  const attemptDir = hasAttempt ? ulwLoopAttemptEvidenceDir(active.id, active.attempt, scope) : ".omo/evidence";
  const guidance = [
    "codex-goal-json requires goal.objective to equal the plan's codexObjective verbatim; do not paraphrase it.",
    "Fill every <replace:...> value with plausible non-empty evidence and use real, non-empty artifact files.",
    'Passing codex-goal-json example: {"goal":{"objective":"<plan codexObjective verbatim>","status":"complete"}}.',
    'Passing quality-gate-json example requires gateReview {"by":"category:deep-high","recommendation":"APPROVE","evidence":"review passed","reportPath":"<attemptDir>/gate-review.md","blockers":[],"notes":[]}, manualQa.artifactRefs objects, iteration, and criteriaCoverage.',
    ...surface === "lazycodex" ? [
      "Self-review defaults: manualQa.by and gateReview.by are main-session. Alternatives: manualQa.by accepts lazycodex-qa-executor; gateReview.by accepts lazycodex-gate-reviewer, category:deep-high, category:deep-low, category:unspecified-high, or category:unspecified-low. Optional codeReview.by accepts lazycodex-code-reviewer or main-session."
    ] : [],
    ...hasAttempt ? [] : ["This plan is evidence-layout v1; artifacts go under .omo/evidence/."]
  ].join(" ");
  return {
    qualityGateTemplate: gateTemplate(surface, attemptDir),
    codexGoalTemplate: {
      goal: { objective: plan.codexObjective ?? "<replace:codex objective>", status: "complete" }
    },
    guidance,
    ...hasAttempt ? { attemptDir } : {}
  };
}

// components/ulw-loop/src/cli-output.ts
var ULW_LOOP_HELP = `Usage:
  omo-agent-toolkit hook user-prompt-submit [--with-ultrawork]  (Codex UserPromptSubmit hook)
  omo-agent-toolkit help | --help | -h                          (this message)
  omo-agent-toolkit ulw-loop help
  omo-agent-toolkit ulw-loop create-goals --brief "..." [--brief-file <path>] [--from-stdin] [--codex-goal-mode aggregate|per_story] [--validation-batch-json <json-or-path>] [--force] [--json]
  omo-agent-toolkit ulw-loop status [--json]
  omo-agent-toolkit ulw-loop complete-goals [--retry-failed] [--json]
  omo-agent-toolkit ulw-loop criteria --goal-id <id> [--json]
  omo-agent-toolkit ulw-loop record-evidence --goal-id <id> --criterion-id <id> --status pass|fail|blocked --evidence "..." [--notes "..."] [--json]
  omo-agent-toolkit ulw-loop checkpoint --print-template [--goal-id <id>] [--json]
  omo-agent-toolkit ulw-loop checkpoint --goal-id <id> --status complete|failed|blocked --evidence "..." --codex-goal-json <...> [--quality-gate-json <...>] [--no-advance] [--json]
  omo-agent-toolkit ulw-loop steer --kind <kind> ... --evidence "..." --rationale "..." [--proposals-json <json-or-path>] [--json]
  omo-agent-toolkit ulw-loop add-goal --title "..." --objective "..." [--json]
  omo-agent-toolkit ulw-loop record-review-blockers --goal-id <id> --title "..." --objective "..." --evidence "..." --codex-goal-json <...> [--json]

Every state subcommand needs a session scope: [--session-id <id>] or the session env (OMO_ULW_LOOP_SESSION_ID / CODEX_SESSION_ID / CODEX_THREAD_ID / PI_SESSION_ID); state lives under .omo/ulw-loop/<id>/ and the unscoped root is never used implicitly. status --json exposes the currentAttemptDir; put all quality-gate artifacts under it.
Every subcommand accepts --help | -h to print its own usage line.`;
function subcommandHelp(subcommand) {
  const lines = ULW_LOOP_HELP.split(`
`).filter((line) => line.trimStart().startsWith(`omo-agent-toolkit ulw-loop ${subcommand}`));
  if (lines.length === 0)
    return ULW_LOOP_HELP;
  return ["Usage:", ...lines].join(`
`);
}
function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}
`);
}
function printJsonError(error) {
  if (error instanceof UlwLoopError) {
    printJson({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...error.details === undefined ? {} : { details: error.details }
      }
    });
    return;
  }
  if (error instanceof Error) {
    printJson({ ok: false, error: { code: "ULW_LOOP_UNEXPECTED", message: error.message } });
    return;
  }
  printJson({ ok: false, error: { code: "ULW_LOOP_UNKNOWN", message: "unknown error" } });
}
function criteriaCounts(goal) {
  let pass = 0;
  for (const criterion of goal.successCriteria)
    if (criterion.status === "pass")
      pass += 1;
  return { pass, total: goal.successCriteria.length };
}
function printStatus(plan) {
  let totalCriteria = 0;
  let passCriteria = 0;
  const lines = ["ulw-loop status", "", "goals:"];
  for (const goal of plan.goals) {
    const counts = criteriaCounts(goal);
    totalCriteria += counts.total;
    passCriteria += counts.pass;
    const marker = goal.id === plan.activeGoalId ? "*" : "-";
    lines.push(`${marker} ${goal.id} [${goal.status}] ${goal.title} (criteria: ${counts.pass}/${counts.total})`);
  }
  lines.push("", "summary:", `total goals: ${plan.goals.length}`, `criteria: ${passCriteria}/${totalCriteria} pass`);
  process.stdout.write(`${lines.join(`
`)}
`);
}
function blockedDecisionHandoff(plan) {
  const blocked = plan.goals.find((goal) => goal.status === "needs_user_decision" && goal.nonRetriable);
  if (blocked === undefined)
    return "";
  return [
    "ulw-loop: blocked on repeated external authorization; no retryable failed goals remain.",
    `Goal: ${blocked.id} - ${blocked.title}`,
    `Required external decision: ${blocked.requiredExternalDecision ?? "provide the missing authorization or choose a different unblock path"}.`,
    "Do not run complete-goals --retry-failed again until external state changes or the user authorizes an unblock path."
  ].join(`
`);
}
function normalizeCodexGoalMode(value) {
  if (value === undefined)
    return "aggregate";
  if (value === "aggregate" || value === "per_story")
    return value;
  throw new UlwLoopError("Invalid --codex-goal-mode; expected aggregate or per_story.", "ULW_LOOP_CODEX_GOAL_MODE_INVALID", { details: { value } });
}

// components/ulw-loop/src/codex-goal-instruction.ts
function buildCodexGoalInstruction(args) {
  const mode = codexGoalMode(args.plan);
  const createGoal = buildCreateGoalPayload(args.plan, args.goal);
  const isFinal = args.isFinal ?? isFinalRunCompletionCandidate(args.plan, args.goal);
  const surface = args.surface ?? resolveToolkitSurface();
  return { text: buildText(mode, args.plan, args.goal, createGoal, isFinal, surface), json: createGoal };
}
function buildCreateGoalPayload(plan, goal) {
  return { objective: expectedCodexObjective(plan, goal) };
}
function buildText(mode, plan, goal, createGoal, isFinal, surface) {
  return joinLines([
    mode === "aggregate" ? "UlwLoop aggregate-goal handoff" : "UlwLoop active-goal handoff",
    `Mode: ${mode}`,
    `Plan: ${plan.goalsPath}`,
    `Ledger: ${plan.ledgerPath}`,
    `Goal: ${goal.id} — ${goal.title}`,
    "",
    ...activeGoalLines(goal),
    "",
    ...successCriteriaLines(goal.successCriteria),
    "",
    "Codex goal integration constraints:",
    "- Use the create_goal payload exactly as rendered: objective only.",
    "- Goals are unlimited. Do not add numeric limits.",
    ...modeConstraintLines(mode, isFinal),
    ...evidenceLayoutLines(plan),
    finalSection(plan, goal, isFinal, mode === "aggregate", surface),
    ...checkpointLines(plan, mode),
    "",
    "create_goal payload:",
    JSON.stringify(createGoal, null, 2)
  ]);
}
function modeConstraintLines(mode, isFinal) {
  if (mode === "per_story") {
    return [
      "- First call get_goal. If no active goal exists, call create_goal with the payload below.",
      "- If a different active Codex goal exists, finish/checkpoint that goal before starting this ulw-loop.",
      "- Work only this goal until its completion audit passes."
    ];
  }
  return [
    "- Codex goal = the whole omo-agent-toolkit ulw-loop run; OMO G001/G002/etc. = ledger stories.",
    "- First call get_goal. If no active goal exists, call create_goal with the aggregate payload below.",
    "- If get_goal reports the same aggregate objective as active, continue this OMO story without creating a new Codex goal.",
    "- If a different active or incomplete Codex goal exists, finish/checkpoint that goal before starting this ulw-loop.",
    isFinal ? "- This is the final story; update_goal is allowed only after the mandatory quality gate passes." : "- This is not the final story: do not call update_goal mid-aggregate; checkpoint this OMO ledger story and continue the remaining stories. update_goal is reserved for the final story after the mandatory quality gate passes."
  ];
}
function checkpointLines(plan, mode) {
  const failureLine = `- If blocked or failed, checkpoint with --status failed and the failure evidence; rerun complete-goals${sessionOption(plan)} --retry-failed to resume.`;
  if (mode === "per_story")
    return [failureLine];
  return [
    "- Checkpoint this OMO story with a fresh get_goal snapshot whose objective matches the aggregate payload.",
    failureLine
  ];
}
function activeGoalLines(goal) {
  return ["Active goal:", `- id: ${goal.id}`, `- title: ${goal.title}`, `- objective: ${goal.objective}`];
}
function successCriteriaLines(criteria) {
  if (criteria.length === 0)
    return ["Success criteria:", "- No success criteria recorded for this goal."];
  return ["Success criteria:", ...criteria.map(formatCriterionLine)];
}
function formatCriterionLine(criterion) {
  const remainingWork = criterion.status === "pending" ? " remaining work:" : "";
  const marker = isEssentialCriterion(criterion) ? "essential" : "non-essential";
  return `-${remainingWork} [${criterion.id}] [${marker}] (${criterion.userModel}) ${criterion.scenario} — expect: ${criterion.expectedEvidence} — status: ${criterion.status}`;
}
function evidenceLayoutLines(plan) {
  if (plan.evidenceLayoutVersion !== 2)
    return [];
  return [
    "- Evidence layout v2: write every artifact for the active goal (QA matrix, review reports, receipts) under the current attempt directory — read currentAttemptDir from `omo-agent-toolkit ulw-loop status --json` (.omo/evidence/ulw/<session>/<goalId>/a<attempt>). The final checkpoint rejects quality-gate artifacts outside that directory."
  ];
}
function finalSection(plan, goal, isFinal, aggregate, surface) {
  const roles = reviewerRolesFor(surface);
  if (!isFinal)
    return "- This is not the final ulw-loop story; do not run the final reviewer/manual-QA/gate-review quality gate yet.";
  const option = sessionOption(plan);
  if (surface === "omo-senpi")
    return senpiFinalSection(plan, goal, aggregate);
  const blockerCommand = `omo-agent-toolkit ulw-loop record-review-blockers${option} --goal-id ${goal.id} --title "Resolve final code-review blockers" --objective "<blocker-resolution objective>" --evidence "<review findings>" --codex-goal-json "<active get_goal JSON or path>"`;
  const checkpointCommand = `omo-agent-toolkit ulw-loop checkpoint${option} --goal-id ${goal.id} --status complete --evidence "<targeted verification/manualQa/gateReview evidence>" --codex-goal-json "<fresh complete get_goal JSON or path>" --quality-gate-json "<quality gate JSON or path>"`;
  return joinLines([
    "Final story — self-review and manual QA are the default; use the quality gate before update_goal:",
    "- Run targeted verification for changed behavior.",
    "- Confirm every manualQa artifact path exists and has non-zero size.",
    `- Run manual QA yourself and write its artifact under currentAttemptDir. Only if the user explicitly demands strict, rigorous, or high-accuracy review, spawn ${roles.gateReview}, optionally also ${roles.codeReview} and ${roles.manualQa}; otherwise set manualQa.by and gateReview.by to "main-session".`,
    "- Require passed manualQa, approved gateReview, passed iteration, and complete criteriaCoverage; include codeReview only when strict review was requested. criteriaCoverage must summarize originalIntent, desiredOutcome, and userOutcomeReview; counts alone are not approval.",
    "- On a reviewer REJECT, fix only the cited blockers, rerun the affected verification/Manual-QA, and re-review the delta at most TWICE; if blockers remain, record them and surface to the user.",
    "- If codeQualityStatus is WATCH, include the WATCH notes verbatim in your final user-facing message.",
    "- If any reviewer is blocked/inconclusive or the quality gate is not clean, do not call update_goal. Record blocker work first:",
    `  ${blockerCommand}`,
    aggregate ? '- If the quality gate is clean, call update_goal({status: "complete"}), call get_goal again, then checkpoint the aggregate story:' : '- If the quality gate is clean, call update_goal({status: "complete"}), call get_goal again, then checkpoint:',
    `  ${checkpointCommand}`
  ]);
}
function senpiFinalSection(plan, goal, aggregate) {
  const option = sessionOption(plan);
  const checkpointCommand = `omo-agent-toolkit ulw-loop checkpoint${option} --goal-id ${goal.id} --status complete --evidence "<manualQa/gateReview evidence>" --codex-goal-json "<fresh complete get_goal JSON or path>" --quality-gate-json "$(omo-agent-toolkit ulw-loop checkpoint${option} --print-template)"`;
  return joinLines([
    "Final story — run the single-reviewer quality gate before update_goal:",
    '- Run manual QA yourself and write the non-empty artifact under currentAttemptDir; set manualQa.by to "main-session".',
    '- Spawn exactly one gate reviewer with task(category: "deep-high").',
    "- If that task fails with any model_unavailable failure, retry with category:deep-low, then category:unspecified-high, then category:unspecified-low.",
    "- Set gateReview.by to the exact category:<name> literal used for the successful task.",
    "- Build the gate JSON with omo-agent-toolkit ulw-loop checkpoint --print-template, then fill manualQa, gateReview, iteration, and criteriaCoverage.",
    '- Require passed manualQa, approved gateReview, passed iteration, and complete criteriaCoverage before update_goal({status: "complete"}).',
    aggregate ? `- If the gate is clean, call update_goal({status: "complete"}), call get_goal again, then checkpoint the aggregate story: ${checkpointCommand}` : `- If the gate is clean, call update_goal({status: "complete"}), call get_goal again, then checkpoint: ${checkpointCommand}`
  ]);
}
function sessionOption(plan) {
  const prefix = ".omo/ulw-loop/";
  const suffix = "/goals.json";
  if (!plan.goalsPath.startsWith(prefix) || !plan.goalsPath.endsWith(suffix))
    return "";
  const sessionId = plan.goalsPath.slice(prefix.length, -suffix.length);
  return sessionId.length === 0 ? "" : ` --session-id ${sessionId}`;
}
function joinLines(lines) {
  return lines.join(`
`);
}

// components/ulw-loop/src/success-criteria-input.ts
function invalid2(message, details) {
  throw new UlwLoopError(`Invalid successCriteria: ${message}`, "ULW_LOOP_ARGUMENT_INVALID", { details });
}
function isUserModel(value) {
  return typeof value === "string" && ULW_LOOP_SUCCESS_CRITERION_USER_MODELS.some((model) => model === value);
}
function requireText(value, field, index) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || invalid2(`entry ${index + 1} needs a non-empty ${field}.`, { index, field });
}
function criterionId(index) {
  return `C${String(index + 1).padStart(3, "0")}`;
}
function criteriaFromInput(input) {
  if (input.length === 0)
    invalid2("provide at least one criterion or omit the field for placeholders.", { count: 0 });
  return input.map((entry, index) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry))
      return invalid2(`entry ${index + 1} must be an object.`, { index });
    const record = { ...entry };
    const userModel = record["userModel"] ?? "happy";
    if (!isUserModel(userModel))
      return invalid2(`entry ${index + 1} userModel must be one of ${ULW_LOOP_SUCCESS_CRITERION_USER_MODELS.join(", ")}.`, {
        index,
        userModel: String(userModel)
      });
    const essential = record["essential"];
    if (essential !== undefined && typeof essential !== "boolean")
      return invalid2(`entry ${index + 1} essential must be a boolean.`, { index });
    return {
      id: criterionId(index),
      scenario: requireText(record["scenario"], "scenario", index),
      userModel,
      expectedEvidence: requireText(record["expectedEvidence"], "expectedEvidence", index),
      essential: essential ?? true,
      capturedEvidence: null,
      status: "pending"
    };
  });
}

// components/ulw-loop/src/plan-goal-factory.ts
function cleanLine(line) {
  return line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, "").trim();
}
function normalizeObjective2(value) {
  return value.replace(/\s+/g, " ").trim();
}
function titleFromObjective(objective, fallback) {
  const firstLine = objective.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? fallback;
  return firstLine.length > 72 ? `${firstLine.slice(0, 69).trimEnd()}...` : firstLine;
}
function normalizeGoalId(title, index) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36).replace(/-+$/g, "");
  return `G${String(index + 1).padStart(3, "0")}${slug ? `-${slug}` : ""}`;
}
function assertNonEmpty(value, label) {
  const trimmed = value?.trim();
  if (!trimmed)
    throw new UlwLoopError(`Missing ${label}.`, "ULW_LOOP_ARGUMENT_MISSING");
  return trimmed;
}
function truncateObjective(objective) {
  return objective.length > 80 ? `${objective.slice(0, 77).trimEnd()}...` : objective;
}
function replaceVia(goalId, id, surface) {
  return surface === "omo-senpi" ? `Replace via agentToolkit.steer({ kind: "revise_criterion", source: "finding", goalId: "${goalId}", criterionId: "${id}", scenario, expectedEvidence, evidence, rationale }) (or pass successCriteria to addGoal)` : `Replace via omo-agent-toolkit ulw-loop steer --kind revise_criterion --goal-id ${goalId} --criterion-id ${id} --scenario "<scenario>" --expected-evidence "<proof>" --evidence "<why>" --rationale "<why>"`;
}
function seedDefaultSuccessCriteria(goalIndex, objective, options = {}) {
  const subject = truncateObjective(normalizeObjective2(objective) || `Goal ${goalIndex + 1}`);
  const goalId = options.goalId ?? `G${String(goalIndex + 1).padStart(3, "0")}`;
  const surface = options.surface ?? "lazycodex";
  const rows = [
    ["happy", `happy path for: ${subject}`, `observable happy-path proof for goal ${goalIndex + 1}`, true],
    ["edge", "edge case (boundary/empty/malformed)", `boundary or malformed-input proof for: ${subject}`, true],
    [
      "regression",
      "regression: adjacent surface still works",
      `regression proof for neighboring behavior after: ${subject}`,
      false
    ]
  ];
  return rows.map(([userModel, scenario, proof, essential], index) => {
    const id = criterionId(index);
    return {
      id,
      scenario,
      userModel,
      expectedEvidence: `${replaceVia(goalId, id, surface)} with ${proof}.`,
      essential,
      capturedEvidence: null,
      status: "pending"
    };
  });
}
function deriveGoalCandidates(brief) {
  const bulletGoals = brief.split(/\r?\n/).map((line) => ({ original: line, cleaned: normalizeObjective2(cleanLine(line)) })).filter(({ cleaned }) => cleaned.length > 0 && cleaned.length <= 1200).filter(({ original, cleaned }, index, all) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(original) && all.findIndex((candidate) => candidate.cleaned === cleaned) === index).map(({ cleaned }) => cleaned);
  const paragraphs = brief.split(/\n\s*\n/).map(normalizeObjective2).filter((paragraph) => paragraph.length > 0 && !paragraph.startsWith("#"));
  const selected = (bulletGoals.length > 0 ? bulletGoals : paragraphs).length > 0 ? bulletGoals.length > 0 ? bulletGoals : paragraphs : ["Complete the requested project objective."];
  return selected.map((objective, index) => ({
    title: titleFromObjective(objective, `Goal ${index + 1}`),
    objective
  }));
}
function makeGoal(title, objective, index, now, options = {}) {
  const cleanTitle = assertNonEmpty(title, "title");
  const cleanObjective = assertNonEmpty(objective, "objective");
  const id = normalizeGoalId(cleanTitle, index);
  const successCriteria = options.successCriteria === undefined ? seedDefaultSuccessCriteria(index, cleanObjective, {
    goalId: id,
    ...options.surface === undefined ? {} : { surface: options.surface }
  }) : criteriaFromInput(options.successCriteria);
  return {
    id,
    title: cleanTitle,
    objective: cleanObjective,
    status: "pending",
    successCriteria,
    attempt: 0,
    createdAt: now,
    updatedAt: now
  };
}
function appendGoalToPlan(plan, title, objective, now, options = {}) {
  const goal = makeGoal(title, objective, plan.goals.length, now, options);
  plan.goals.push(goal);
  plan.updatedAt = now;
  return goal;
}

// components/ulw-loop/src/plan-crud.ts
function isScheduleEligible(goal) {
  return goal.steeringStatus !== "superseded" && goal.steeringStatus !== "blocked";
}
function clearGoalBlockerFields2(goal) {
  for (const key of [
    "blockedReason",
    "blockerSignature",
    "blockerOccurrenceCount",
    "requiredExternalDecision",
    "nonRetriable",
    "failedAt",
    "failureReason"
  ])
    delete goal[key];
}
async function createUlwLoopPlan(repoRoot, args, scope, surface = "lazycodex") {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    let existing;
    if (planExists(repoRoot, scope)) {
      try {
        existing = await readUlwLoopPlan(repoRoot, scope);
      } catch (error) {
        if (!args.force)
          throw error;
      }
    }
    if (!args.force && existing !== undefined) {
      if (isUlwLoopDone(existing))
        throw completedPlanExistsError(scope, surface);
      throw new UlwLoopError(`Refusing to overwrite existing ${ulwLoopGoalsRelativePath(scope)}; pass --force to recreate it.`, "ULW_LOOP_PLAN_EXISTS");
    }
    const now = iso();
    const goals = deriveGoalCandidates(args.brief).map((goal, index) => makeGoal(goal.title, goal.objective, index, now, { surface }));
    const plan = {
      version: 1,
      revision: existing?.revision ?? 0,
      ledgerResetRevision: (existing?.revision ?? 0) + 1,
      brief: args.brief.endsWith(`
`) ? args.brief : `${args.brief}
`,
      evidenceLayoutVersion: 2,
      createdAt: now,
      updatedAt: now,
      briefPath: ulwLoopBriefRelativePath(scope),
      goalsPath: ulwLoopGoalsRelativePath(scope),
      ledgerPath: ulwLoopLedgerRelativePath(scope),
      codexGoalMode: args.codexGoalMode ?? "aggregate",
      goals
    };
    const validationBatches = await parseValidationBatches(args.validationBatchesJson, goals);
    if (validationBatches !== undefined)
      plan.validationBatches = validationBatches;
    if (plan.codexGoalMode === "aggregate")
      plan.codexObjective = aggregateCodexObjectiveForScope(scope);
    await beforePlanMutation();
    await commit(repoRoot, scope, {
      plan,
      entries: [{ at: now, kind: "plan_created", message: `${goals.length} goal(s) created` }]
    });
    return plan;
  });
}
function completedPlanExistsError(scope, surface) {
  return new UlwLoopError([
    `Existing ulw-loop aggregate is already complete at ${ulwLoopGoalsRelativePath(scope)}.`,
    ...surface === "omo-senpi" ? [
      "Start a new run under a fresh session id (a new senpi session) or call agentToolkit.createGoals({ brief, force: true }) to recreate."
    ] : [
      "Start a new run with `omo-agent-toolkit ulw-loop create-goals --session-id <new-id> ...` to isolate fresh state.",
      "Use --force only when you intentionally want to overwrite the completed evidence."
    ]
  ].join(" "), "ULW_LOOP_PLAN_EXISTS_COMPLETE");
}
async function addUlwLoopGoal(repoRoot, args, scope, surface = "lazycodex") {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const now = iso();
    const goal = appendGoalToPlan(plan, args.title, args.objective, now, {
      surface,
      ...args.successCriteria === undefined ? {} : { successCriteria: args.successCriteria }
    });
    await commit(repoRoot, scope, {
      plan,
      entries: [{ at: now, kind: "goal_added", goalId: goal.id, status: goal.status, message: goal.title }]
    });
    return { plan, goal };
  });
}
async function startNextUlwLoop(repoRoot, args = {}, scope) {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const now = iso();
    if (plan.aggregateCompletion?.status === "complete")
      return { done: true, plan };
    const existing = plan.goals.find((goal) => goal.status === "in_progress" && isScheduleEligible(goal));
    if (existing)
      return { plan, goal: existing, resumed: true };
    const entries = [];
    let next = plan.goals.find((goal) => goal.status === "pending" && isScheduleEligible(goal));
    if (!next && args.retryFailed) {
      next = plan.goals.find((goal) => goal.status === "failed" && !goal.nonRetriable && isScheduleEligible(goal));
      if (next)
        entries.push({
          at: now,
          kind: "goal_retried",
          goalId: next.id,
          status: "pending",
          ...next.failureReason ? { message: next.failureReason } : {}
        });
    }
    if (!next)
      return { done: true, plan };
    next.status = "in_progress";
    next.attempt += 1;
    next.startedAt = now;
    clearGoalBlockerFields2(next);
    next.updatedAt = now;
    plan.activeGoalId = next.id;
    plan.updatedAt = now;
    entries.push({
      at: now,
      kind: "goal_started",
      goalId: next.id,
      status: next.status,
      message: `Attempt ${next.attempt}`
    });
    await commit(repoRoot, scope, { plan, entries });
    return { plan, goal: next, resumed: false };
  });
}
function summarizeUlwLoopPlan(plan) {
  const countStatus = (status) => plan.goals.filter((goal) => goal.status === status).length;
  const countCriteria = (status) => plan.goals.reduce((sum, goal) => sum + goal.successCriteria.filter((criterion) => criterion.status === status).length, 0);
  return {
    total: plan.goals.length,
    pending: countStatus("pending"),
    in_progress: countStatus("in_progress"),
    complete: countStatus("complete"),
    failed: countStatus("failed"),
    blocked: countStatus("blocked"),
    review_blocked: countStatus("review_blocked"),
    needs_user_decision: countStatus("needs_user_decision"),
    superseded: plan.goals.filter((goal) => goal.steeringStatus === "superseded").length,
    criteria: {
      total: plan.goals.reduce((sum, goal) => sum + goal.successCriteria.length, 0),
      pass: countCriteria("pass"),
      pending: countCriteria("pending"),
      fail: countCriteria("fail"),
      blocked: countCriteria("blocked")
    }
  };
}

// components/ulw-loop/src/checkpoint-continuation.ts
async function checkpointAndContinue(repoRoot, args, scope) {
  const result = await checkpointUlwLoop(repoRoot, args, scope);
  if (args.status !== "complete" || result.aggregateCompletion !== undefined || !args.advance)
    return result;
  const next = await startNextUlwLoop(repoRoot, {}, scope);
  if ("done" in next)
    return { ...result, plan: next.plan, next: doneNext(next.plan) };
  const instruction = buildCodexGoalInstruction({ plan: next.plan, goal: next.goal });
  return { ...result, plan: next.plan, next: { resumed: next.resumed, goal: next.goal, instruction } };
}
async function checkpoint(repoRoot, argv, json, scope) {
  if (hasFlag(argv, "--print-template")) {
    const template = await checkpointTemplate(repoRoot, scope, readValue(argv, "--goal-id"));
    if (json)
      printJson({ ok: true, ...template });
    else
      printJson(template);
    return 0;
  }
  const goalId = required2(argv, "--goal-id");
  const statusValue = checkpointStatus(required2(argv, "--status"));
  const evidence = required2(argv, "--evidence");
  const codexGoalJson = await parseCodexGoalJson(readValue(argv, "--codex-goal-json"));
  const qualityGateJson = readValue(argv, "--quality-gate-json");
  const args = {
    goalId,
    status: statusValue,
    evidence,
    advance: !hasFlag(argv, "--no-advance"),
    ...codexGoalJson === undefined ? {} : { codexGoalJson },
    ...qualityGateJson === undefined ? {} : { qualityGateJson }
  };
  const result = await checkpointAndContinue(repoRoot, args, scope);
  if (json)
    printJson({ ok: true, ...result, summary: summarizeUlwLoopPlan(result.plan) });
  else
    printCheckpointText(result);
  return 0;
}
function printCheckpointText(result) {
  process.stdout.write(`ulw-loop checkpoint: ${result.goal.id} -> ${result.goal.status}
`);
  if (result.next === undefined)
    return;
  if ("instruction" in result.next)
    process.stdout.write(`${result.next.instruction.text}
`);
  else
    process.stdout.write(`${result.next.handoff || "ulw-loop: all goals complete"}
`);
}
function doneNext(plan) {
  const handoff = blockedDecisionHandoff(plan);
  return { done: true, blocked: handoff.length > 0, handoff };
}
function required2(argv, flag) {
  const value = readValue(argv, flag)?.trim();
  if (value)
    return value;
  throw new UlwLoopError(`Missing ${flag}.`, "ULW_LOOP_ARGUMENT_MISSING", { details: { flag } });
}
function checkpointStatus(value) {
  if (value === "complete" || value === "failed" || value === "blocked")
    return value;
  throw new UlwLoopError("Missing or invalid --status; expected complete, failed, or blocked.", "ULW_LOOP_STATUS_INVALID", { details: { status: value } });
}

// components/ulw-loop/src/cli-subcommands.ts
import { readFile as readFile4 } from "node:fs/promises";

// components/ulw-loop/src/cli-steering.ts
var SOURCES = ["user_prompt_submit", "finding", "cli"];
var STEERING_KIND_HELP = [
  `Allowed --kind values: ${ULW_LOOP_STEERING_MUTATION_KINDS.join(", ")}`,
  "Kind-specific required flags:",
  "  add_subgoal: --title, --objective, --evidence, --rationale",
  "  split_subgoal: --goal-id, --children, --evidence, --rationale",
  "  reorder_pending: --order, --evidence, --rationale",
  "  revise_pending_wording: --goal-id, --title or --objective, --evidence, --rationale",
  "  revise_criterion: --goal-id, --criterion-id, one of --scenario/--expected-evidence/--user-model, --evidence, --rationale",
  "  annotate_ledger: --evidence, --rationale",
  "  mark_blocked_superseded: --goal-id, optional --replacements, --evidence, --rationale",
  'Example: omo-agent-toolkit ulw-loop steer --kind annotate_ledger --evidence "observed behavior" --rationale "why this changes the plan" --json'
].join(`
`);
function isKind(value) {
  return value !== undefined && ULW_LOOP_STEERING_MUTATION_KINDS.some((kind) => kind === value);
}
function isSource(value) {
  return value !== undefined && SOURCES.some((source) => source === value);
}
function isModel(value) {
  return ULW_LOOP_SUCCESS_CRITERION_USER_MODELS.some((model) => model === value);
}
function fail3(message, code, details) {
  throw new UlwLoopError(message, code, { details });
}
function kindMessage(prefix) {
  return `${prefix}

${STEERING_KIND_HELP}`;
}
function text2(value, field) {
  if (value === undefined)
    return;
  const trimmed = value.trim();
  if (trimmed.length > 0)
    return trimmed;
  return fail3(`Empty ${field}.`, "ULW_LOOP_STEERING_FIELD_EMPTY", { field });
}
function required3(argv, flag) {
  const value = text2(readValue(argv, flag), flag);
  return value ?? fail3(`Missing ${flag}.`, "ULW_LOOP_STEERING_FIELD_REQUIRED", { flag });
}
function requiredGoal(argv) {
  const value = text2(parseGoalArg(argv), "--goal-id");
  return value ?? fail3("Missing --goal-id.", "ULW_LOOP_GOAL_ID_REQUIRED", { flag: "--goal-id" });
}
function readObject(value, key) {
  return Object.entries(value).find(([name]) => name === key)?.[1];
}
function isPlain(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function objectText(value, key) {
  const candidate = readObject(value, key);
  return typeof candidate === "string" ? candidate : undefined;
}
function objectStrings(value, key) {
  const candidate = readObject(value, key);
  return Array.isArray(candidate) && candidate.every((item) => typeof item === "string") ? candidate : undefined;
}
function objectChildren(value, key) {
  const candidate = readObject(value, key);
  if (!Array.isArray(candidate))
    return;
  const parsed = [];
  for (const item of candidate) {
    const next = child(item);
    if (next === null)
      return fail3(`${key} entries require title/objective.`, "ULW_LOOP_STEERING_CHILD_INVALID", { key });
    parsed.push(next);
  }
  return parsed;
}
function isProposalKind(value) {
  return typeof value === "string" && ULW_LOOP_STEERING_MUTATION_KINDS.some((kind) => kind === value);
}
function isProposalSource(value) {
  return typeof value === "string" && SOURCES.some((source) => source === value);
}
function parseSteeringKind(argv) {
  const value = readValue(argv, "--kind");
  if (isKind(value))
    return value;
  return value === undefined ? fail3(kindMessage("Missing --kind."), "ULW_LOOP_STEERING_KIND_REQUIRED", { flag: "--kind", expected: ULW_LOOP_STEERING_MUTATION_KINDS, usage: STEERING_KIND_HELP }) : fail3(kindMessage(`Invalid --kind: ${value}.`), "ULW_LOOP_STEERING_KIND_INVALID", { value, expected: ULW_LOOP_STEERING_MUTATION_KINDS, usage: STEERING_KIND_HELP });
}
function parseSteeringSource(argv) {
  const value = readValue(argv, "--source");
  if (value === undefined)
    return "cli";
  return isSource(value) ? value : fail3(`Invalid --source: ${value}.`, "ULW_LOOP_STEERING_SOURCE_INVALID", { value, expected: SOURCES });
}
function child(value) {
  if (!isPlain(value))
    return null;
  const title = text2(objectText(value, "title"), "title");
  const objective = text2(objectText(value, "objective"), "objective");
  if (title === undefined || objective === undefined)
    return null;
  return { title, objective };
}
async function children(argv, flag, needed) {
  const input = needed ? required3(argv, flag) : text2(readValue(argv, flag), flag);
  if (input === undefined)
    return [];
  const raw = await readJsonInput(input);
  if (!Array.isArray(raw))
    return fail3(`${flag} must be a JSON array.`, "ULW_LOOP_STEERING_JSON_ARRAY_REQUIRED", { flag });
  const parsed = [];
  for (const item of raw) {
    const next = child(item);
    if (next === null)
      return fail3(`${flag} entries require title/objective.`, "ULW_LOOP_STEERING_CHILD_INVALID", { flag });
    parsed.push(next);
  }
  return parsed;
}
async function stringArray2(argv, flag) {
  const raw = await readJsonInput(required3(argv, flag));
  if (!Array.isArray(raw))
    return fail3(`${flag} must be a JSON array.`, "ULW_LOOP_STEERING_JSON_ARRAY_REQUIRED", { flag });
  const values = [];
  for (const item of raw) {
    if (typeof item !== "string")
      return fail3(`${flag} entries must be strings.`, "ULW_LOOP_STEERING_STRING_ARRAY_REQUIRED", { flag });
    values.push(text2(item, flag) ?? "");
  }
  return values;
}
function model(value) {
  const trimmed = text2(value, "--user-model");
  if (trimmed === undefined)
    return;
  return isModel(trimmed) ? trimmed : fail3(`Invalid --user-model: ${trimmed}.`, "ULW_LOOP_STEERING_USER_MODEL_INVALID", { value: trimmed, expected: ULW_LOOP_SUCCESS_CRITERION_USER_MODELS });
}
function neverKind(kind) {
  return fail3(`Unsupported steering kind: ${String(kind)}.`, "ULW_LOOP_STEERING_KIND_UNSUPPORTED", { kind });
}
async function parseSteeringProposal(argv) {
  const kind = parseSteeringKind(argv);
  const source = parseSteeringSource(argv);
  const idempotencyKey = text2(readValue(argv, "--idempotency-key"), "--idempotency-key");
  const base = { kind, source, evidence: required3(argv, "--evidence"), rationale: required3(argv, "--rationale"), ...idempotencyKey === undefined ? {} : { idempotencyKey } };
  switch (kind) {
    case "add_subgoal":
      return normalizeSteeringProposal({ ...base, title: required3(argv, "--title"), objective: required3(argv, "--objective") });
    case "split_subgoal": {
      const goalId = requiredGoal(argv);
      return normalizeSteeringProposal({ ...base, goalId, targetGoalId: goalId, childGoals: await children(argv, "--children", true) });
    }
    case "reorder_pending":
      return normalizeSteeringProposal({ ...base, pendingOrder: await stringArray2(argv, "--order") });
    case "revise_pending_wording": {
      const goalId = requiredGoal(argv);
      const revisedTitle = readValue(argv, "--title");
      const revisedObjective = readValue(argv, "--objective");
      if (revisedTitle === undefined && revisedObjective === undefined)
        return fail3("revise_pending_wording requires --title or --objective.", "ULW_LOOP_STEERING_UPDATE_REQUIRED", { kind });
      return normalizeSteeringProposal({ ...base, goalId, targetGoalId: goalId, ...revisedTitle === undefined ? {} : { revisedTitle }, ...revisedObjective === undefined ? {} : { revisedObjective } });
    }
    case "revise_criterion": {
      const goalId = requiredGoal(argv);
      const criterionId = required3(argv, "--criterion-id");
      const scenario = readValue(argv, "--scenario");
      const expectedEvidence = readValue(argv, "--expected-evidence");
      const userModel = model(readValue(argv, "--user-model"));
      if (scenario === undefined && expectedEvidence === undefined && userModel === undefined)
        return fail3("revise_criterion requires scenario, expected-evidence, or user-model.", "ULW_LOOP_STEERING_UPDATE_REQUIRED", { kind });
      return normalizeSteeringProposal({ ...base, goalId, targetGoalId: goalId, criterionId, ...scenario === undefined ? {} : { scenario }, ...expectedEvidence === undefined ? {} : { expectedEvidence }, ...userModel === undefined ? {} : { userModel } });
    }
    case "annotate_ledger":
      return normalizeSteeringProposal(base);
    case "mark_blocked_superseded": {
      const goalId = requiredGoal(argv);
      const childGoals = await children(argv, "--replacements", false);
      return normalizeSteeringProposal({ ...base, goalId, targetGoalId: goalId, ...childGoals.length === 0 ? {} : { childGoals } });
    }
    default:
      return neverKind(kind);
  }
}
function normalizedChildren(values) {
  if (values === undefined)
    return;
  return values.map((item) => ({ title: text2(item.title, "child.title") ?? "", objective: text2(item.objective, "child.objective") ?? "" }));
}
function normalizedStrings(values, field) {
  if (values === undefined)
    return;
  return values.map((value) => text2(value, field) ?? "");
}
function normalizeSteeringProposal(proposal) {
  const evidence = text2(proposal.evidence, "evidence") ?? "";
  const rationale = text2(proposal.rationale, "rationale") ?? "";
  const goalId = text2(proposal.goalId, "goalId");
  const targetGoalId = text2(proposal.targetGoalId, "targetGoalId");
  const targetGoalIds = normalizedStrings(proposal.targetGoalIds, "targetGoalIds");
  const criterionId = text2(proposal.criterionId, "criterionId");
  const title = text2(proposal.title, "title");
  const objective = text2(proposal.objective, "objective");
  const revisedTitle = text2(proposal.revisedTitle, "revisedTitle");
  const revisedObjective = text2(proposal.revisedObjective, "revisedObjective");
  const blockedReason = text2(proposal.blockedReason, "blockedReason");
  const directiveText = text2(proposal.directiveText, "directiveText");
  const promptSignature = text2(proposal.promptSignature, "promptSignature");
  const idempotencyKey = text2(proposal.idempotencyKey, "idempotencyKey");
  const scenario = text2(proposal.scenario, "scenario");
  const expectedEvidence = text2(proposal.expectedEvidence, "expectedEvidence");
  const childGoals = normalizedChildren(proposal.childGoals);
  const pendingOrder = normalizedStrings(proposal.pendingOrder, "pendingOrder");
  return { kind: proposal.kind, source: proposal.source, evidence, rationale, ...goalId === undefined ? {} : { goalId }, ...targetGoalId === undefined ? {} : { targetGoalId }, ...targetGoalIds === undefined ? {} : { targetGoalIds }, ...criterionId === undefined ? {} : { criterionId }, ...title === undefined ? {} : { title }, ...objective === undefined ? {} : { objective }, ...childGoals === undefined ? {} : { childGoals }, ...revisedTitle === undefined ? {} : { revisedTitle }, ...revisedObjective === undefined ? {} : { revisedObjective }, ...pendingOrder === undefined ? {} : { pendingOrder }, ...blockedReason === undefined ? {} : { blockedReason }, ...proposal.after === undefined ? {} : { after: proposal.after }, ...directiveText === undefined ? {} : { directiveText }, ...promptSignature === undefined ? {} : { promptSignature }, ...idempotencyKey === undefined ? {} : { idempotencyKey }, ...proposal.now === undefined ? {} : { now: proposal.now }, ...scenario === undefined ? {} : { scenario }, ...expectedEvidence === undefined ? {} : { expectedEvidence }, ...proposal.userModel === undefined ? {} : { userModel: proposal.userModel } };
}
async function parseSteeringProposals(argv) {
  const input = text2(readValue(argv, "--proposals-json"), "--proposals-json");
  if (input === undefined)
    return [await parseSteeringProposal(argv)];
  if (readValue(argv, "--kind") !== undefined)
    return fail3("--kind and --proposals-json are mutually exclusive.", "ULW_LOOP_STEERING_BATCH_CONFLICT", { flags: ["--kind", "--proposals-json"] });
  const raw = await readJsonInput(input);
  if (!Array.isArray(raw) || raw.length === 0)
    return fail3("--proposals-json must be a non-empty JSON array.", "ULW_LOOP_STEERING_BATCH_ARRAY_REQUIRED", { flag: "--proposals-json" });
  const proposals = [];
  for (const item of raw)
    proposals.push(normalizeSteeringProposal(proposalFromObject(item)));
  return proposals;
}
function proposalFromObject(value) {
  if (!isPlain(value))
    return fail3("--proposals-json entries must be objects.", "ULW_LOOP_STEERING_BATCH_ITEM_INVALID", { flag: "--proposals-json" });
  const kind = readObject(value, "kind");
  const source = readObject(value, "source") ?? "cli";
  if (!isProposalKind(kind))
    return fail3(`Invalid batch steering kind: ${String(kind)}.`, "ULW_LOOP_STEERING_KIND_INVALID", { value: kind });
  if (!isProposalSource(source))
    return fail3(`Invalid batch steering source: ${String(source)}.`, "ULW_LOOP_STEERING_SOURCE_INVALID", { value: source });
  let proposal = { kind, source, evidence: objectText(value, "evidence") ?? "", rationale: objectText(value, "rationale") ?? "" };
  const goalId = objectText(value, "goalId");
  const targetGoalId = objectText(value, "targetGoalId");
  const criterionId = objectText(value, "criterionId");
  const title = objectText(value, "title");
  const objective = objectText(value, "objective");
  const revisedTitle = objectText(value, "revisedTitle");
  const revisedObjective = objectText(value, "revisedObjective");
  const scenario = objectText(value, "scenario");
  const expectedEvidence = objectText(value, "expectedEvidence");
  const idempotencyKey = objectText(value, "idempotencyKey");
  const targetGoalIds = objectStrings(value, "targetGoalIds");
  const pendingOrder = objectStrings(value, "pendingOrder");
  const childGoals = objectChildren(value, "childGoals");
  if (goalId !== undefined)
    proposal = { ...proposal, goalId };
  if (targetGoalId !== undefined)
    proposal = { ...proposal, targetGoalId };
  if (criterionId !== undefined)
    proposal = { ...proposal, criterionId };
  if (title !== undefined)
    proposal = { ...proposal, title };
  if (objective !== undefined)
    proposal = { ...proposal, objective };
  if (revisedTitle !== undefined)
    proposal = { ...proposal, revisedTitle };
  if (revisedObjective !== undefined)
    proposal = { ...proposal, revisedObjective };
  if (scenario !== undefined)
    proposal = { ...proposal, scenario };
  if (expectedEvidence !== undefined)
    proposal = { ...proposal, expectedEvidence };
  if (idempotencyKey !== undefined)
    proposal = { ...proposal, idempotencyKey };
  if (targetGoalIds !== undefined)
    proposal = { ...proposal, targetGoalIds };
  if (pendingOrder !== undefined)
    proposal = { ...proposal, pendingOrder };
  if (childGoals !== undefined)
    proposal = { ...proposal, childGoals };
  return proposal;
}
function printSteerResult(result, json) {
  if (json) {
    printJson({ ok: result.accepted, accepted: result.accepted, rejectedReasons: result.rejectedReasons, deduped: result.deduped, audit: result.audit, plan: result.plan });
    return;
  }
  const outcome = result.deduped ? "deduped" : result.accepted ? "accepted" : "rejected";
  process.stdout.write(`ulw-loop steer: ${outcome} ${result.audit.kind}
`);
  if (result.rejectedReasons.length > 0)
    process.stdout.write(`rejected: ${result.rejectedReasons.join("; ")}
`);
  if (result.audit.idempotencyKey !== undefined)
    process.stdout.write(`idempotency-key: ${result.audit.idempotencyKey}
`);
  printStatus(result.plan);
}
function printSteerBatchResult(result, json) {
  if (json) {
    printJson({ ok: result.accepted, accepted: result.accepted, rejectedReasons: result.rejectedReasons, results: result.results, plan: result.plan });
    return;
  }
  process.stdout.write(`ulw-loop steer batch: ${result.accepted ? "accepted" : "rejected"} ${result.results.length} proposal(s)
`);
  if (result.rejectedReasons.length > 0)
    process.stdout.write(`rejected: ${result.rejectedReasons.join("; ")}
`);
  printStatus(result.plan);
}

// components/ulw-loop/src/review-blockers.ts
var BLOCKER_FIELDS = "blockedReason blockerSignature blockerOccurrenceCount requiredExternalDecision nonRetriable failedAt failureReason completedAt blocker blockerEvidence blockerOccurrences blockedAt".split(" ");
function ulwLoopError(message, code) {
  throw new UlwLoopError(message, code);
}
function nextGoalId(plan) {
  const max = plan.goals.reduce((current, goal) => {
    const digits = /^G(\d+)/u.exec(goal.id)?.[1];
    return digits === undefined ? current : Math.max(current, Number(digits));
  }, 0);
  return `G${String(max + 1).padStart(3, "0")}`;
}
function appendBlockerGoal(plan, args, now) {
  const index = plan.goals.length;
  const id = nextGoalId(plan);
  const goal = {
    id,
    title: args.title,
    objective: args.objective,
    status: "pending",
    successCriteria: seedDefaultSuccessCriteria(index, args.objective, { goalId: id }),
    attempt: 0,
    createdAt: now,
    updatedAt: now
  };
  plan.goals.push(goal);
  return goal;
}
async function recordFinalReviewBlockers(repoRoot, args, scope) {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const goal = plan.goals.find((candidate) => candidate.id === args.goalId);
    if (goal === undefined)
      ulwLoopError(`Unknown ulw-loop id: ${args.goalId}`, "ulw_loop_goal_not_found");
    if (goal.status !== "in_progress")
      ulwLoopError(`${goal.id} is ${goal.status}.`, "ulw_loop_goal_not_in_progress");
    if (!isFinalRunCompletionCandidate(plan, goal))
      ulwLoopError(`${goal.id} is not final.`, "ulw_loop_not_final_story");
    const snapshot = await readCodexGoalSnapshotInput(args.codexGoalJson, repoRoot);
    const reconciliation = reconcileCodexGoalSnapshot(snapshot, {
      expectedObjective: expectedCodexObjective(plan, goal),
      acceptedObjectives: compatibleCodexObjectives(plan),
      acknowledgedObjectives: acknowledgedDriverObjectives(plan)
    });
    if (!reconciliation.ok)
      throw new CodexGoalSnapshotError(formatCodexGoalReconciliation(reconciliation));
    acknowledgeDriverObjective(plan, reconciliation.unacknowledgedObjective);
    const now = iso();
    for (const field of BLOCKER_FIELDS)
      Reflect.deleteProperty(goal, field);
    goal.status = "review_blocked";
    goal.reviewBlockedAt = now;
    goal.evidence = args.evidence;
    goal.updatedAt = now;
    if (plan.activeGoalId === goal.id)
      delete plan.activeGoalId;
    const newGoal = appendBlockerGoal(plan, args, now);
    plan.updatedAt = now;
    const codexGoal = snapshot?.raw;
    const blockedEntry = { at: now, kind: "goal_review_blocked", goalId: goal.id, status: goal.status, evidence: args.evidence, codexGoal };
    const addedEntry = { at: now, kind: "goal_added", goalId: newGoal.id, status: newGoal.status, evidence: args.evidence, message: newGoal.title };
    const summaryEntry = { at: now, kind: "goal_review_blocked", goalId: goal.id, status: goal.status, evidence: args.evidence, codexGoal, message: `Review blockers recorded; appended ${newGoal.id}.` };
    Reflect.set(summaryEntry, "kind", "blocker_recorded");
    const ledgerEntries = [blockedEntry, addedEntry, summaryEntry];
    await commit(repoRoot, scope, { plan, entries: ledgerEntries });
    return {
      plan,
      blockedGoal: goal,
      newGoal,
      ledgerEntries,
      nextActions: reconciliation.nextActions,
      warnings: reconciliation.warnings
    };
  });
}

// components/ulw-loop/src/status-next-actions.ts
function statusNextActions(plan, surface = "lazycodex") {
  const actions = [];
  const active = plan.goals.find((goal) => goal.id === plan.activeGoalId);
  if (plan.goals.length === 0)
    actions.push(`No goals yet: bootstrap with \`${createGoalsAction(surface)}\`.`);
  else if (active !== undefined)
    actions.push(...activeGoalActions(plan, active, surface));
  for (const goal of plan.goals.filter((candidate) => candidate.status === "review_blocked"))
    actions.push(surface === "omo-senpi" ? `${goal.id} is review_blocked: capture the reviewer verdict with \`agentToolkit.recordReviewBlockers({ goalId: "${goal.id}", title: "<title>", objective: "<objective>", evidence: "<verdict>" })\`.` : `${goal.id} is review_blocked: capture the reviewer verdict with \`omo-agent-toolkit ulw-loop record-review-blockers --goal-id ${goal.id} --title "<title>" --objective "<objective>" --evidence "<verdict>" --codex-goal-json '<get_goal json>'\`.`);
  if (plan.evidenceLayoutVersion !== 2 || active === undefined)
    actions.push("plan is evidence-layout v1; artifacts go under .omo/evidence/");
  return actions;
}
function activeGoalActions(plan, active, surface) {
  const unresolved = active.successCriteria.filter((criterion) => criterion.status !== "pass");
  if (unresolved.length > 0)
    return [
      surface === "omo-senpi" ? `${active.id} has ${unresolved.length} unresolved criterion(s) (${unresolved.map((criterion) => criterion.id).join(", ")}): record proof with \`agentToolkit.recordEvidence({ goalId: "${active.id}", criterionId: "<id>", status: "pass", evidence: "<observable proof>" })\`.` : `${active.id} has ${unresolved.length} unresolved criterion(s) (${unresolved.map((criterion) => criterion.id).join(", ")}): record proof with \`omo-agent-toolkit ulw-loop record-evidence --goal-id ${active.id} --criterion-id <id> --status pass --evidence "<observable proof>"\`.`
    ];
  if (hasAllCriteriaPass(active) && isFinalRunCompletionCandidate(plan, active))
    return [
      surface === "omo-senpi" ? `${active.id} passes every criterion and is the final story: complete the driver goal, then call \`agentToolkit.checkpoint({ goalId: "${active.id}", printTemplate: true })\` to build the final quality gate. Use status().result.currentAttemptDir for all quality-gate artifacts.` : `${active.id} passes every criterion and is the final story: update_goal complete, then checkpoint --print-template to build the final quality gate. Use status --json's currentAttemptDir for all quality-gate artifacts.`
    ];
  return [
    surface === "omo-senpi" ? `${active.id} passes every criterion: close it with \`agentToolkit.checkpoint({ goalId: "${active.id}", status: "complete", evidence: "<proof>" })\`. Put quality-gate artifacts under status().result.currentAttemptDir.` : `${active.id} passes every criterion: close it with \`omo-agent-toolkit ulw-loop checkpoint --goal-id ${active.id} --status complete --evidence "<proof>" --codex-goal-json '<get_goal json>'\`. Put quality-gate artifacts under the currentAttemptDir shown by status --json.`
  ];
}

// components/ulw-loop/src/steering-mutations.ts
var read2 = (value, key) => Object.entries(value).find(([name]) => name === key)?.[1];
var isText = (value) => typeof value === "string" && value.trim().length > 0;
var text3 = (value, key) => {
  const candidate = read2(value, key);
  return isText(candidate) ? candidate.trim() : undefined;
};
var isModel2 = (value) => typeof value === "string" && ULW_LOOP_SUCCESS_CRITERION_USER_MODELS.some((model) => model === value);
var after = (proposal) => {
  const candidate = read2(proposal, "after");
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate) ? candidate : undefined;
};
var revised = (proposal, direct, nested) => text3(proposal, direct) ?? text3(after(proposal) ?? proposal, nested);
var targets = (proposal) => proposal.targetGoalIds ?? [proposal.targetGoalId ?? text3(proposal, "goalId") ?? ""].filter(Boolean);
var child2 = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const title = text3(value, "title");
  const objective = text3(value, "objective");
  return title === undefined || objective === undefined ? null : { title, objective };
};
var children2 = (proposal) => {
  const direct = proposal.childGoals;
  if (direct !== undefined && direct.length > 0)
    return direct;
  const nested = after(proposal);
  const fromAfter = nested === undefined ? undefined : read2(nested, "children");
  return Array.isArray(fromAfter) ? fromAfter.map(child2).filter((item) => item !== null) : [];
};
var goal = (plan, id) => id === undefined ? undefined : plan.goals.find((item) => item.id === id);
function nextId(plan, offset) {
  const max = plan.goals.reduce((current, item) => {
    const digits = /^G(\d+)(?:-|$)/u.exec(item.id)?.[1];
    return digits === undefined ? current : Math.max(current, Number(digits));
  }, 0);
  return `G${String(max + offset).padStart(3, "0")}`;
}
function makeGoal2(plan, childGoal, evidence, now, offset, surface = "lazycodex") {
  const id = nextId(plan, offset);
  const digits = /^G(\d+)/u.exec(id)?.[1];
  const goalIndex = digits === undefined ? plan.goals.length + offset - 1 : Number(digits) - 1;
  return { id, title: childGoal.title, objective: childGoal.objective, status: "pending", successCriteria: seedDefaultSuccessCriteria(goalIndex, childGoal.objective, { goalId: id, surface }), attempt: 0, createdAt: now, updatedAt: now, evidence };
}
function reviseWording(plan, proposal, now) {
  const target = goal(plan, targets(proposal)[0]);
  if (target === undefined)
    return;
  target.title = revised(proposal, "revisedTitle", "title") ?? target.title;
  target.objective = revised(proposal, "revisedObjective", "objective") ?? target.objective;
  target.steeringEvidence = proposal.evidence;
  target.steeringRationale = proposal.rationale;
  target.updatedAt = now;
}
function splitOrBlock(plan, proposal, now, surface = "lazycodex") {
  const target = goal(plan, targets(proposal)[0]);
  if (target === undefined)
    return;
  const replacements = children2(proposal).map((item, index) => makeGoal2(plan, item, proposal.evidence, now, index + 1, surface));
  target.steeringEvidence = proposal.evidence;
  target.steeringRationale = proposal.rationale;
  target.updatedAt = now;
  if (replacements.length === 0) {
    target.status = "blocked";
    target.steeringStatus = "blocked";
    target.blockedReason = proposal.blockedReason ?? proposal.rationale;
  } else {
    target.steeringStatus = "superseded";
    target.supersededBy = replacements.map((item) => item.id);
    for (const item of replacements)
      item.supersedes = [target.id];
    plan.goals.splice(plan.goals.indexOf(target) + 1, 0, ...replacements);
    updateBatchesAfterSupersede(plan, target.id, replacements.map((item) => item.id));
  }
  if (plan.activeGoalId === target.id)
    delete plan.activeGoalId;
}
function reviseCriterion(plan, proposal, now) {
  const target = goal(plan, targets(proposal)[0]);
  const index = target?.successCriteria.findIndex((item) => item.id === proposal.criterionId) ?? -1;
  const current = target?.successCriteria[index];
  if (target === undefined || current === undefined)
    return;
  const model = read2(proposal, "userModel");
  target.successCriteria[index] = { ...current, scenario: text3(proposal, "scenario") ?? current.scenario, expectedEvidence: text3(proposal, "expectedEvidence") ?? current.expectedEvidence, userModel: isModel2(model) ? model : current.userModel };
  target.updatedAt = now;
}

// components/ulw-loop/src/steering-snapshot.ts
function buildSteeringPlanSnapshot(plan, changedGoalIds) {
  const snapshot = {
    updatedAt: plan.updatedAt,
    goalCount: plan.goals.length,
    goalIds: plan.goals.map((goal) => goal.id),
    goals: plan.goals.filter((goal) => changedGoalIds.has(goal.id))
  };
  return plan.activeGoalId === undefined ? snapshot : { ...snapshot, activeGoalId: plan.activeGoalId };
}
function changedGoalIdsBetween(before, after) {
  const beforeById = new Map(before.goals.map((goal) => [goal.id, goal]));
  const changed = new Set;
  for (const goal of after.goals) {
    const prior = beforeById.get(goal.id);
    if (prior === undefined || JSON.stringify(prior) !== JSON.stringify(goal))
      changed.add(goal.id);
    beforeById.delete(goal.id);
  }
  for (const id of beforeById.keys())
    changed.add(id);
  return changed;
}

// components/ulw-loop/src/steering.ts
var SOURCES2 = ["user_prompt_submit", "finding", "cli"];
var PROTECTED = new Set(["aggregateCompletion", "codexObjective", "codexObjectiveAliases", "acknowledgedDriverObjectives", "originalConstraints", "qualityGate", "status", "completedAt", "completionStatus"]);
var isObject2 = (value) => typeof value === "object" && value !== null;
var isPlain2 = (value) => isObject2(value) && !Array.isArray(value);
var read3 = (value, key) => Object.entries(value).find(([name]) => name === key)?.[1];
var isText2 = (value) => typeof value === "string" && value.trim().length > 0;
var text4 = (value, key) => {
  const candidate = read3(value, key);
  return isText2(candidate) ? candidate.trim() : undefined;
};
var isKind2 = (value) => typeof value === "string" && ULW_LOOP_STEERING_MUTATION_KINDS.some((kind) => kind === value);
var isSource2 = (value) => typeof value === "string" && SOURCES2.some((source) => source === value);
var isModel3 = (value) => typeof value === "string" && ULW_LOOP_SUCCESS_CRITERION_USER_MODELS.some((model) => model === value);
var texts = (value, key) => {
  const candidate = read3(value, key);
  return Array.isArray(candidate) && candidate.every((item) => typeof item === "string") ? candidate : [];
};
function targets2(proposal) {
  const many = texts(proposal, "targetGoalIds");
  const one = text4(proposal, "targetGoalId") ?? text4(proposal, "goalId");
  return many.length > 0 ? many : one === undefined ? [] : [one];
}
var after2 = (proposal) => {
  const candidate = read3(proposal, "after");
  return isPlain2(candidate) ? candidate : undefined;
};
var revised2 = (proposal, direct, nested) => text4(proposal, direct) ?? text4(after2(proposal) ?? proposal, nested);
function child3(value) {
  if (!isPlain2(value))
    return null;
  const title = text4(value, "title");
  const objective = text4(value, "objective");
  if (title === undefined || objective === undefined)
    return null;
  return { title, objective };
}
function childValues(proposal) {
  const direct = read3(proposal, "childGoals");
  if (Array.isArray(direct) && direct.length > 0)
    return direct;
  const nested = after2(proposal);
  const fromAfter = nested === undefined ? undefined : read3(nested, "children");
  return Array.isArray(fromAfter) ? fromAfter : [];
}
var pendingOrder = (proposal) => {
  const direct = texts(proposal, "pendingOrder");
  return direct.length > 0 ? direct : texts(after2(proposal) ?? proposal, "pendingGoalIds");
};
function hasProtected(value) {
  if (!isObject2(value))
    return false;
  for (const [key, childValue] of Object.entries(value))
    if (PROTECTED.has(key) || key.toLowerCase().includes("complete") || hasProtected(childValue))
      return true;
  return false;
}
function allText(value) {
  if (typeof value === "string")
    return value;
  return isObject2(value) ? Object.values(value).map(allText).filter(Boolean).join(`
`) : "";
}
function weakens(value) {
  const valueText = allText(value).toLowerCase();
  return /\b(skip|bypass|weaken|remove|omit|auto[-\s]?complete|mark complete|complete faster)\b/.test(valueText) && /\b(test|tests|verification|review|quality gate|complete|completion)\b/.test(valueText);
}
function auditFor(proposal, reasons) {
  const object = isPlain2(proposal) ? proposal : undefined;
  const kindRaw = object === undefined ? undefined : read3(object, "kind");
  const sourceRaw = object === undefined ? undefined : read3(object, "source");
  const evidence = object === undefined ? "" : text4(object, "evidence") ?? "";
  const rationale = object === undefined ? "" : text4(object, "rationale") ?? "";
  const audit = { kind: isKind2(kindRaw) ? kindRaw : "annotate_ledger", source: isSource2(sourceRaw) ? sourceRaw : "cli", targetGoalIds: object === undefined ? [] : targets2(object), evidence, rationale, invariant: { accepted: reasons.length === 0, structuralInvariantAccepted: reasons.length === 0, evidenceBackedNecessity: evidence.length > 0 && rationale.length > 0, noEasierCompletion: !weakens(proposal), rejectedReasons: reasons, reasons } };
  if (object === undefined)
    return audit;
  const criterionId = text4(object, "criterionId");
  const directiveText = text4(object, "directiveText");
  const promptSignature = text4(object, "promptSignature");
  const idempotencyKey = text4(object, "idempotencyKey");
  if (criterionId !== undefined)
    audit.criterionId = criterionId;
  if (directiveText !== undefined)
    audit.directiveText = directiveText;
  if (promptSignature !== undefined)
    audit.promptSignature = promptSignature;
  if (idempotencyKey !== undefined)
    audit.idempotencyKey = idempotencyKey;
  return audit;
}
function validateUlwLoopSteeringProposal(plan, proposal) {
  const reasons = [];
  if (!isPlain2(proposal))
    reasons.push("proposal must be an object");
  const object = isPlain2(proposal) ? proposal : {};
  const kind = read3(object, "kind");
  if (!isKind2(kind))
    reasons.push(`invalid kind: ${String(kind)}`);
  if (!isSource2(read3(object, "source")))
    reasons.push(`invalid source: ${String(read3(object, "source"))}`);
  if (text4(object, "evidence") === undefined)
    reasons.push("missing evidence");
  if (text4(object, "rationale") === undefined)
    reasons.push("missing rationale");
  if (hasProtected(proposal))
    reasons.push("protected payload");
  if (weakens(proposal))
    reasons.push("weakened completion");
  if (isUlwLoopDone(plan))
    reasons.push("plan already complete");
  if (isKind2(kind))
    validateKind(plan, object, kind, reasons);
  return auditFor(proposal, reasons);
}
function goal2(plan, id) {
  return id === undefined ? undefined : plan.goals.find((item) => item.id === id);
}
function validateKind(plan, proposal, kind, reasons) {
  const target = goal2(plan, targets2(proposal)[0]);
  if (kind === "add_subgoal" && (text4(proposal, "title") === undefined || text4(proposal, "objective") === undefined))
    reasons.push("add_subgoal requires title/objective");
  if ((kind === "split_subgoal" || kind === "revise_pending_wording" || kind === "mark_blocked_superseded") && target === undefined)
    reasons.push(`${kind} requires target`);
  if ((kind === "split_subgoal" || kind === "revise_pending_wording") && target !== undefined && target.status !== "pending")
    reasons.push(`${kind} requires pending target`);
  const rawChildren = childValues(proposal);
  if (kind === "split_subgoal" && rawChildren.length === 0)
    reasons.push("split_subgoal requires children");
  if ((kind === "split_subgoal" || kind === "mark_blocked_superseded") && rawChildren.some((item) => child3(item) === null))
    reasons.push(`${kind} children require title/objective`);
  if (kind === "reorder_pending")
    validateOrder(plan, proposal, reasons);
  if (kind === "revise_pending_wording" && revised2(proposal, "revisedTitle", "title") === undefined && revised2(proposal, "revisedObjective", "objective") === undefined)
    reasons.push("revise_pending_wording requires update");
  if (kind === "revise_criterion")
    validateCriterion(plan, proposal, reasons);
}
function validateOrder(plan, proposal, reasons) {
  const requested = pendingOrder(proposal);
  const pending = plan.goals.filter((item) => item.status === "pending" && item.steeringStatus === undefined).map((item) => item.id);
  if (requested.length === 0)
    reasons.push("reorder_pending requires ids");
  if (new Set(requested).size !== requested.length)
    reasons.push("duplicate pending id");
  if (requested.some((id) => !pending.includes(id)))
    reasons.push("unknown pending id");
}
function validateCriterion(plan, proposal, reasons) {
  const target = goal2(plan, targets2(proposal)[0]);
  const criterionId = text4(proposal, "criterionId");
  if (target === undefined)
    reasons.push("revise_criterion requires goalId");
  else if (criterionId === undefined || target.successCriteria.every((item) => item.id !== criterionId))
    reasons.push("revise_criterion requires criterionId");
  const model = read3(proposal, "userModel");
  if (read3(proposal, "scenario") === undefined && read3(proposal, "expectedEvidence") === undefined && model === undefined)
    reasons.push("revise_criterion requires update");
  if (model !== undefined && !isModel3(model))
    reasons.push("invalid userModel");
}
function applySteeringMutation(plan, proposal, audit, surface = "lazycodex") {
  const next = structuredClone(plan);
  if (!audit.invariant.accepted)
    return next;
  const now = proposal.now?.toISOString() ?? iso();
  if (proposal.kind === "add_subgoal")
    next.goals.push(makeGoal2(next, { title: proposal.title ?? "", objective: proposal.objective ?? "" }, proposal.evidence, now, 1, surface));
  if (proposal.kind === "reorder_pending") {
    const order = pendingOrder(proposal);
    next.goals = [...order.map((id) => goal2(next, id)).filter((item) => item !== undefined), ...next.goals.filter((item) => !order.includes(item.id))];
  }
  if (proposal.kind === "revise_pending_wording")
    reviseWording(next, proposal, now);
  if (proposal.kind === "split_subgoal" || proposal.kind === "mark_blocked_superseded")
    splitOrBlock(next, proposal, now, surface);
  if (proposal.kind === "revise_criterion")
    reviseCriterion(next, proposal, now);
  if (proposal.kind !== "annotate_ledger")
    next.updatedAt = now;
  return next;
}
function isProposal(value) {
  return isPlain2(value) && isKind2(read3(value, "kind")) && isSource2(read3(value, "source")) && isText2(read3(value, "evidence")) && isText2(read3(value, "rationale"));
}
function parseUlwLoopSteeringDirective(text) {
  const match = /(?:^|\s)(?:OMO_ULW_LOOP_STEER|omo\.ulw-loop\.steer|omo ulw-loop steer|omo-agent-toolkit ulw-loop steer):\s*([\s\S]+)$/u.exec(text);
  if (match?.[1] === undefined)
    return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    return isProposal(parsed) ? parsed : null;
  } catch (error) {
    if (error instanceof SyntaxError)
      return null;
    throw error;
  }
}
async function steerUlwLoop(repoRoot, proposal, scope, surface = "lazycodex") {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const key = proposal.idempotencyKey ?? proposal.promptSignature;
    const prior = key === undefined ? undefined : await findAcceptedSteeringLedgerEntry(repoRoot, key, scope);
    if (prior?.steering !== undefined) {
      const { before: _before, after: _after, ...compactPrior } = prior.steering;
      return { plan, accepted: true, audit: { ...compactPrior, deduped: true }, rejectedReasons: [], deduped: true };
    }
    const audit = validateUlwLoopSteeringProposal(plan, proposal);
    const accepted = audit.invariant.accepted;
    const next = accepted ? applySteeringMutation(plan, proposal, audit, surface) : plan;
    const finalAudit = { ...audit };
    if (accepted) {
      const changed = changedGoalIdsBetween(plan, next);
      finalAudit.before = buildSteeringPlanSnapshot(plan, changed);
      finalAudit.after = buildSteeringPlanSnapshot(next, changed);
    }
    const at = proposal.now?.toISOString() ?? iso();
    const batchEntry = accepted ? batchUpdateLedgerEntry(plan, next, at) : null;
    const entries = [ledgerEntry(proposal, finalAudit, at)];
    if (batchEntry !== null)
      entries.push(batchEntry);
    await commit(repoRoot, scope, { plan: next, entries });
    return { plan: next, accepted, audit: finalAudit, rejectedReasons: audit.invariant.rejectedReasons, deduped: false };
  });
}
function ledgerEntry(proposal, audit, at) {
  const entry = { at, kind: audit.invariant.accepted ? proposal.kind === "revise_criterion" ? "criteria_revised" : "steering_accepted" : "steering_rejected", evidence: proposal.evidence, message: proposal.rationale, steering: audit, mutationKind: proposal.kind };
  const goalId = audit.targetGoalIds[0];
  if (goalId !== undefined)
    entry.goalId = goalId;
  if (proposal.criterionId !== undefined)
    entry.criterionId = proposal.criterionId;
  if (proposal.idempotencyKey !== undefined)
    entry.idempotencyKey = proposal.idempotencyKey;
  return entry;
}

// components/ulw-loop/src/sdk/manifest.ts
var CRITERION_INPUT = '{ scenario: string, expectedEvidence: string, userModel?: "happy" | "edge" | "regression" | "adversarial", essential?: boolean }';
var STEER_KINDS = '"add_subgoal" | "split_subgoal" | "reorder_pending" | "revise_pending_wording" | "revise_criterion" | "annotate_ledger" | "mark_blocked_superseded"';
var ULW_LOOP_MANIFEST = {
  version: 1,
  name: "ulw-loop",
  operations: [
    {
      name: "help",
      method: "help",
      mutating: false,
      description: "Return this manifest: every operation with its method name, argument fields, and what it does.",
      args: {}
    },
    {
      name: "create-goals",
      method: "createGoals",
      mutating: true,
      description: "Create the session plan from a brief; one goal per bullet, each seeded with placeholder criteria until revised.",
      args: {
        brief: "string",
        codexGoalMode: '"aggregate" | "per_story"?',
        force: "boolean?",
        validationBatchesJson: "string?"
      }
    },
    {
      name: "status",
      method: "status",
      mutating: false,
      description: "Read the plan, its summary, structured nextActions, the stable evidenceRoot, and the active goal's currentAttemptDir.",
      args: {}
    },
    {
      name: "complete-goals",
      method: "completeGoals",
      mutating: true,
      description: "Acquire the next eligible goal or resume the in-progress one; returns { done: true } once the aggregate is complete.",
      args: { retryFailed: "boolean?" }
    },
    {
      name: "checkpoint",
      method: "checkpoint",
      mutating: true,
      description: "Close the goal as complete, failed, or blocked with evidence; the final goal also needs the quality gate. printTemplate returns that gate's template instead.",
      args: {
        goalId: "string",
        status: '"complete" | "failed" | "blocked"',
        evidence: "string",
        codexGoalJson: "string?",
        qualityGateJson: "string?",
        printTemplate: "true? (with goalId? only)"
      }
    },
    {
      name: "steer",
      method: "steer",
      mutating: true,
      description: "Propose an evidence-backed plan mutation; revise_criterion replaces a criterion's scenario, expectedEvidence, or userModel.",
      args: {
        kind: STEER_KINDS,
        source: '"finding" | "user_prompt_submit" | "cli"',
        evidence: "string",
        rationale: "string",
        goalId: "string?",
        criterionId: "string? (revise_criterion)",
        scenario: "string? (revise_criterion)",
        expectedEvidence: "string? (revise_criterion)",
        userModel: '"happy" | "edge" | "regression" | "adversarial"? (revise_criterion)',
        title: "string? (add_subgoal)",
        objective: "string? (add_subgoal)",
        childGoals: "{ title: string, objective: string }[]? (split_subgoal)",
        revisedTitle: "string? (revise_pending_wording)",
        revisedObjective: "string? (revise_pending_wording)",
        pendingOrder: "string[]? (reorder_pending)",
        blockedReason: "string? (mark_blocked_superseded)",
        idempotencyKey: "string?"
      }
    },
    {
      name: "add-goal",
      method: "addGoal",
      mutating: true,
      description: "Append a goal; pass successCriteria to define its criteria in the same call, otherwise placeholders name the revise call.",
      args: { title: "string", objective: "string", successCriteria: `${CRITERION_INPUT}[]?` }
    },
    {
      name: "criteria",
      method: "criteria",
      mutating: false,
      description: "List one goal's success criteria with their status and captured evidence.",
      args: { goalId: "string" }
    },
    {
      name: "record-evidence",
      method: "recordEvidence",
      mutating: true,
      description: "Record a criterion's pass, fail, or blocked evidence; artifacts must exist (resolved against the session cwd) and are stored with the criterion and the ledger entry.",
      args: {
        goalId: "string",
        criterionId: "string",
        status: '"pass" | "fail" | "blocked"',
        evidence: "string",
        notes: "string?",
        artifacts: "string[]?"
      }
    },
    {
      name: "record-review-blockers",
      method: "recordReviewBlockers",
      mutating: true,
      description: "Mark the final goal review_blocked and append the blocker goal the reviewer verdict names.",
      args: { goalId: "string", title: "string", objective: "string", evidence: "string", codexGoalJson: "string?" }
    }
  ]
};

// components/ulw-loop/src/sdk/factory.ts
function validateCodexGoalJson(raw) {
  if (raw === undefined)
    return;
  try {
    JSON.parse(raw);
  } catch (error) {
    throw new UlwLoopError(`Invalid codexGoal: ${error instanceof Error ? error.message : "not valid JSON"}`, "ULW_LOOP_CODEX_GOAL_JSON_INVALID", { cause: error });
  }
}
function validateContext(context) {
  if (!context.cwd.trim())
    throw new UlwLoopError("cwd is required.", "ULW_LOOP_CWD_REQUIRED");
  const sessionId = context.sessionId.trim();
  if (!sessionId)
    throw new UlwLoopError("ULW_LOOP_SESSION_ID_REQUIRED: sessionId is required.", "ULW_LOOP_SESSION_ID_REQUIRED");
  const normalizedSessionId = normalizeUlwLoopSessionId(sessionId);
  if (normalizedSessionId === null || /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(sessionId))
    throw new UlwLoopError("ULW_LOOP_SESSION_ID_INVALID: sessionId normalizes to null.", "ULW_LOOP_SESSION_ID_INVALID");
  if (context.surface !== "omo-senpi" && context.surface !== "lazycodex")
    throw new UlwLoopError("surface must be omo-senpi or lazycodex.", "ULW_LOOP_SURFACE_INVALID");
}
function errorDetails(error) {
  const details = error.details === undefined ? undefined : Object.fromEntries(Object.entries(error.details).map(([key, value]) => [key, String(value)]));
  return details === undefined ? { code: error.code, message: error.message } : { code: error.code, message: error.message, details };
}
function failure(operation, error) {
  return { ok: false, operation, error: errorDetails(error) };
}
function caught(operation, error) {
  return failure(operation, error instanceof UlwLoopError ? error : new UlwLoopError(error.message, "ULW_LOOP_ERROR"));
}
function isKnownRequest(request) {
  return ULW_LOOP_MANIFEST.operations.some((operation) => operation.name === request.operation);
}
function unreachable(value) {
  throw new UlwLoopError(`Unhandled operation: ${String(value)}`, "ULW_LOOP_OPERATION_UNHANDLED");
}
function stringsFrom(result, key) {
  if (!(key in result))
    return [];
  const value = Object.entries(result).find(([name]) => name === key)?.[1];
  return Array.isArray(value) ? value.filter((item) => typeof item === "string").slice(0, 8) : [];
}
function checkpointWithValidatedSnapshot(context, scope, args) {
  validateCodexGoalJson(args.codexGoalJson);
  return checkpointUlwLoop(context.cwd, args, scope, { surface: context.surface });
}
function createAgentToolkit(context, deps = {}) {
  validateContext(context);
  const scope = { sessionId: context.sessionId };
  const notify = async (operation, response) => {
    if (deps.hooks?.onOperation !== undefined)
      await deps.hooks.onOperation({ operation, context, response });
    return response;
  };
  const invoke = async (operation, fn) => {
    try {
      const result = await fn();
      const nextActions = typeof result === "object" && result !== null ? stringsFrom(result, "nextActions") : [];
      const warnings = typeof result === "object" && result !== null ? stringsFrom(result, "warnings") : [];
      return await notify(operation, {
        ok: true,
        operation,
        result,
        nextActions,
        ...warnings.length === 0 ? {} : { warnings }
      });
    } catch (error) {
      if (error instanceof UlwLoopError && error.code === "ULW_LOOP_PLAN_MISSING" && context.surface === "omo-senpi")
        return notify(operation, failure(operation, planMissingError(ulwLoopGoalsRelativePath(scope), listUlwLoopSessionIds(context.cwd), context.surface)));
      const response = caught(operation, error instanceof Error ? error : new Error("ULW_LOOP_ERROR"));
      return notify(operation, response);
    }
  };
  const toolkit = {
    dispatch: async (request) => {
      if (!isKnownRequest(request))
        return failure(request.operation, new UlwLoopError(`Unknown operation: ${request.operation}`, "ULW_LOOP_OPERATION_UNKNOWN"));
      switch (request.operation) {
        case "help":
          return toolkit.help();
        case "create-goals":
          return toolkit.createGoals(request.args);
        case "status":
          return toolkit.status();
        case "complete-goals":
          return toolkit.completeGoals(request.args);
        case "checkpoint":
          return toolkit.checkpoint(request.args);
        case "steer":
          return toolkit.steer(request.args);
        case "add-goal":
          return toolkit.addGoal(request.args);
        case "criteria":
          return toolkit.criteria(request.args);
        case "record-evidence":
          return toolkit.recordEvidence(request.args);
        case "record-review-blockers":
          return toolkit.recordReviewBlockers(request.args);
        default:
          return unreachable(request);
      }
    },
    help: () => invoke("help", async () => ULW_LOOP_MANIFEST),
    createGoals: (args) => invoke("create-goals", () => createUlwLoopPlan(context.cwd, args, scope, context.surface)),
    status: () => invoke("status", async () => {
      const plan = await readUlwLoopPlan(context.cwd, scope);
      const active = plan.goals.find((goal) => goal.id === plan.activeGoalId);
      return {
        plan,
        summary: summarizeUlwLoopPlan(plan),
        nextActions: statusNextActions(plan, context.surface),
        evidenceRoot: ulwLoopEvidenceRoot(scope),
        ...active === undefined || plan.evidenceLayoutVersion !== 2 ? {} : { currentAttemptDir: ulwLoopAttemptEvidenceDir(active.id, active.attempt, scope) }
      };
    }),
    completeGoals: (args = {}) => invoke("complete-goals", () => startNextUlwLoop(context.cwd, args, scope)),
    checkpoint: (args) => invoke("checkpoint", () => args.printTemplate === true ? checkpointTemplate(context.cwd, scope, args.goalId, { surface: context.surface }) : checkpointWithValidatedSnapshot(context, scope, args)),
    steer: (args) => invoke("steer", () => steerUlwLoop(context.cwd, args, scope, context.surface)),
    addGoal: (args) => invoke("add-goal", () => addUlwLoopGoal(context.cwd, args, scope, context.surface)),
    criteria: (args) => invoke("criteria", async () => {
      const plan = await readUlwLoopPlan(context.cwd, scope);
      const goal = plan.goals.find((candidate) => candidate.id === args.goalId);
      if (goal === undefined)
        throw new UlwLoopError(`Unknown ulw-loop id: ${args.goalId}.`, "ULW_LOOP_GOAL_NOT_FOUND");
      return { goalId: goal.id, criteria: goal.successCriteria };
    }),
    recordEvidence: (args) => invoke("record-evidence", () => recordEvidence(context.cwd, args, scope)),
    recordReviewBlockers: (args) => invoke("record-review-blockers", () => recordFinalReviewBlockers(context.cwd, args, scope))
  };
  return toolkit;
}
// components/ulw-loop/src/steering-batch.ts
async function steerUlwLoopBatch(repoRoot, proposals, scope) {
  return withUlwLoopMutationLock(repoRoot, scope, async () => {
    const plan = await readUlwLoopPlan(repoRoot, scope);
    const prepared = await prepareBatch(repoRoot, plan, proposals, scope);
    const failed = prepared.results.find((item) => !item.accepted);
    if (failed !== undefined) {
      const entry = rejectedLedgerEntry(prepared.results);
      await commit(repoRoot, scope, { plan, entries: [entry] });
      return rejected(plan, prepared.results, failed.rejectedReasons);
    }
    let next = plan;
    for (const item of prepared.items)
      if (item.kind === "fresh")
        next = item.prepared.next;
    const fresh = prepared.items.filter((item) => item.kind === "fresh");
    if (fresh.length > 0) {
      const entries = fresh.map((item) => ledgerEntry2(item.prepared.proposal, item.prepared.audit, item.prepared.proposal.now?.toISOString() ?? iso()));
      const batchEntry = batchUpdateLedgerEntry(plan, next, iso());
      await commit(repoRoot, scope, { plan: next, entries: batchEntry === null ? entries : [...entries, batchEntry] });
    }
    return { plan: next, accepted: true, results: prepared.results, rejectedReasons: [] };
  });
}
async function prepareBatch(repoRoot, plan, proposals, scope) {
  const items = [];
  const results = [];
  let current = plan;
  for (const proposal of proposals) {
    const key = proposal.idempotencyKey ?? proposal.promptSignature;
    const prior = key === undefined ? undefined : await findAcceptedSteeringLedgerEntry(repoRoot, key, scope);
    if (prior?.steering !== undefined) {
      const result = { accepted: true, deduped: true, audit: { ...prior.steering, deduped: true }, rejectedReasons: [] };
      items.push({ kind: "deduped", result });
      results.push(result);
      continue;
    }
    const audit = validateUlwLoopSteeringProposal(current, proposal);
    if (!audit.invariant.accepted) {
      const result = { accepted: false, deduped: false, audit, rejectedReasons: audit.invariant.rejectedReasons };
      items.push({ kind: "deduped", result });
      results.push(result);
      continue;
    }
    const next = applySteeringMutation(current, proposal, audit);
    const changed = changedGoalIdsBetween(current, next);
    const finalAudit = { ...audit, before: buildSteeringPlanSnapshot(current, changed), after: buildSteeringPlanSnapshot(next, changed) };
    const result = { accepted: true, deduped: false, audit: finalAudit, rejectedReasons: [] };
    items.push({ kind: "fresh", prepared: { proposal, audit: finalAudit, before: current, next } });
    results.push(result);
    current = next;
  }
  return { items, results };
}
function rejected(plan, results, rejectedReasons) {
  return { plan, accepted: false, results, rejectedReasons };
}
function rejectedLedgerEntry(results) {
  const rejectedItems = results.map((result, index) => ({ result, index })).filter((item) => !item.result.accepted);
  return { at: iso(), kind: "steering_rejected", message: rejectedItems.map((item) => `index ${item.index}: ${item.result.rejectedReasons.join(", ")}`).join("; ") };
}
function ledgerEntry2(proposal, audit, at) {
  const entry = {
    at,
    kind: proposal.kind === "revise_criterion" ? "criteria_revised" : "steering_accepted",
    evidence: proposal.evidence,
    message: proposal.rationale,
    steering: audit,
    mutationKind: proposal.kind
  };
  const goalId = audit.targetGoalIds[0];
  if (goalId !== undefined)
    entry.goalId = goalId;
  if (proposal.criterionId !== undefined)
    entry.criterionId = proposal.criterionId;
  if (proposal.idempotencyKey !== undefined)
    entry.idempotencyKey = proposal.idempotencyKey;
  return entry;
}

// components/ulw-loop/src/cli-subcommands.ts
async function createGoals(repoRoot, argv, json, scope) {
  const briefFile = readValue(argv, "--brief-file");
  const brief = readValue(argv, "--brief") ?? (briefFile === undefined ? undefined : await readFile4(briefFile, "utf8")) ?? (hasFlag(argv, "--from-stdin") ? await readStdin() : undefined) ?? positionalText(argv);
  if (!brief.trim()) {
    throw new UlwLoopError("Missing brief text. Pass --brief, --brief-file, --from-stdin, or positional text.", "ULW_LOOP_BRIEF_REQUIRED");
  }
  const validationBatchesJson = readValue(argv, "--validation-batch-json");
  const plan = unwrap(await toolkitFor(repoRoot, scope).createGoals({
    brief,
    codexGoalMode: normalizeCodexGoalMode(readValue(argv, "--codex-goal-mode")),
    force: hasFlag(argv, "--force"),
    ...validationBatchesJson === undefined ? {} : { validationBatchesJson }
  }));
  if (json)
    printJson({ ok: true, plan, summary: summarizeUlwLoopPlan(plan) });
  else {
    process.stdout.write(`ulw-loop plan created: ${plan.goals.length} goal(s)
brief: ${plan.briefPath}
goals: ${plan.goalsPath}
ledger: ${plan.ledgerPath}
`);
  }
  return 0;
}
async function status(repoRoot, json, scope) {
  const status = unwrap(await toolkitFor(repoRoot, scope).status());
  if (json)
    printJson({ ok: true, ...status });
  else
    printStatus(status.plan);
  return 0;
}
async function completeGoals(repoRoot, argv, json, scope) {
  const result = unwrap(await toolkitFor(repoRoot, scope).completeGoals({ retryFailed: hasFlag(argv, "--retry-failed") }));
  if ("done" in result) {
    const handoff = blockedDecisionHandoff(result.plan);
    if (json) {
      printJson({
        ok: true,
        done: true,
        blocked: handoff.length > 0,
        handoff,
        summary: summarizeUlwLoopPlan(result.plan),
        plan: result.plan
      });
    } else
      process.stdout.write(`${handoff || "ulw-loop: all goals complete"}
`);
    return 0;
  }
  const instruction = buildCodexGoalInstruction({ plan: result.plan, goal: result.goal });
  if (json)
    printJson({ ok: true, resumed: result.resumed, goal: result.goal, instruction, plan: result.plan });
  else
    process.stdout.write(`${instruction.text}
`);
  return 0;
}
async function steer(repoRoot, argv, json, scope) {
  const proposals = await parseSteeringProposals(argv);
  const single = proposals[0];
  if (single !== undefined && proposals.length === 1 && readValue(argv, "--proposals-json") === undefined) {
    const result = unwrap(await toolkitFor(repoRoot, scope).steer(single));
    printSteerResult(result, json);
    return result.accepted ? 0 : 1;
  }
  const result = await steerUlwLoopBatch(repoRoot, proposals, scope);
  printSteerBatchResult(result, json);
  return result.accepted ? 0 : 1;
}
async function addGoal(repoRoot, argv, json, scope) {
  const result = unwrap(await toolkitFor(repoRoot, scope).addGoal({
    title: required4(argv, "--title"),
    objective: required4(argv, "--objective")
  }));
  if (json)
    printJson({ ok: true, plan: result.plan, goal: result.goal, summary: summarizeUlwLoopPlan(result.plan) });
  else {
    process.stdout.write(`ulw-loop added goal: ${result.goal.id}
`);
    printStatus(result.plan);
  }
  return 0;
}
async function criteria(repoRoot, argv, json, scope) {
  const goalId = required4(argv, "--goal-id");
  const result = unwrap(await toolkitFor(repoRoot, scope).criteria({ goalId }));
  if (json)
    printJson({ ok: true, goalId: result.goalId, criteria: result.criteria });
  else {
    process.stdout.write(`criteria for ${result.goalId}:
${result.criteria.map(formatCriterionForCli).join(`
`)}
`);
  }
  return 0;
}
async function captureEvidence(repoRoot, argv, json, scope) {
  const result = unwrap(await toolkitFor(repoRoot, scope).recordEvidence(parseRecordEvidenceArgs(argv)));
  if (json)
    printJson({ ok: true, ...result, summary: summarizeUlwLoopPlan(result.plan) });
  else {
    process.stdout.write(`ulw-loop evidence recorded: ${result.goal.id}/${result.criterion.id} -> ${result.criterion.status}
`);
  }
  return 0;
}
async function reviewBlockers(repoRoot, argv, json, scope) {
  const codexGoalJson = await parseCodexGoalJson(required4(argv, "--codex-goal-json"));
  if (codexGoalJson === undefined) {
    throw new UlwLoopError("Missing --codex-goal-json.", "ULW_LOOP_CODEX_GOAL_JSON_REQUIRED");
  }
  const result = unwrap(await toolkitFor(repoRoot, scope).recordReviewBlockers({
    goalId: required4(argv, "--goal-id"),
    title: required4(argv, "--title"),
    objective: required4(argv, "--objective"),
    evidence: required4(argv, "--evidence"),
    codexGoalJson
  }));
  if (json) {
    printJson({
      ok: true,
      plan: result.plan,
      blockedGoal: result.blockedGoal,
      goal: result.newGoal,
      ledgerEntries: result.ledgerEntries,
      nextActions: result.nextActions,
      warnings: result.warnings,
      summary: summarizeUlwLoopPlan(result.plan)
    });
  } else {
    process.stdout.write(`ulw-loop final review blockers recorded: ${result.blockedGoal.id} -> review_blocked; added ${result.newGoal.id}
`);
  }
  return 0;
}
function toolkitFor(repoRoot, scope) {
  const sessionId = scope?.sessionId?.trim();
  if (sessionId === undefined || sessionId.length === 0) {
    throw new UlwLoopError("Missing --session-id.", "ULW_LOOP_SESSION_ID_REQUIRED", {
      details: { flag: "--session-id" }
    });
  }
  return createAgentToolkit({ cwd: repoRoot, sessionId, surface: resolveToolkitSurface() });
}
function unwrap(response) {
  if (response.ok)
    return response.result;
  throw new UlwLoopError(response.error.message, response.error.code);
}
function formatCriterionForCli(criterion) {
  const marker = isEssentialCriterion(criterion) ? "essential" : "non-essential";
  return `- ${criterion.id} [${criterion.status}] [${marker}] (${criterion.userModel}) ${criterion.scenario} evidence: ${criterion.capturedEvidence ?? "pending"}`;
}
function required4(argv, flag) {
  const value = readValue(argv, flag)?.trim();
  if (value)
    return value;
  throw new UlwLoopError(`Missing ${flag}.`, "ULW_LOOP_ARGUMENT_MISSING", { details: { flag } });
}

// components/ulw-loop/src/cli-commands.ts
var ULW_LOOP_SUBCOMMANDS = [
  "help",
  "create-goals",
  "status",
  "complete-goals",
  "checkpoint",
  "steer",
  "add-goal",
  "criteria",
  "record-evidence",
  "record-review-blockers"
];
function isUlwLoopSubcommand(value) {
  return ULW_LOOP_SUBCOMMANDS.includes(value);
}
async function ulwLoopCommand(argv) {
  const head = argv[0] ?? "help";
  const command = head === "--help" || head === "-h" ? "help" : head;
  const rest = argv.slice(1);
  const repoRoot = process.cwd();
  const json = hasFlag(rest, "--json");
  try {
    if (!isUlwLoopSubcommand(command)) {
      if (json) {
        printJsonError(new UlwLoopError(`Unknown ulw-loop subcommand: ${command}.`, "ULW_LOOP_SUBCOMMAND_UNKNOWN", {
          details: { command }
        }));
        return 1;
      }
      process.stdout.write(`${ULW_LOOP_HELP}
`);
      return 1;
    }
    if (command !== "help" && (hasFlag(rest, "--help") || hasFlag(rest, "-h"))) {
      process.stdout.write(`${subcommandHelp(command)}
`);
      return 0;
    }
    if (command === "help") {
      process.stdout.write(`${ULW_LOOP_HELP}
`);
      return 0;
    }
    const scope = commandScope(repoRoot, rest);
    switch (command) {
      case "create-goals":
        return await createGoals(repoRoot, rest, json, scope);
      case "status":
        return await status(repoRoot, json, scope);
      case "complete-goals":
        return await completeGoals(repoRoot, rest, json, scope);
      case "checkpoint":
        return await checkpoint(repoRoot, rest, json, scope);
      case "steer":
        return await steer(repoRoot, rest, json, scope);
      case "add-goal":
        return await addGoal(repoRoot, rest, json, scope);
      case "criteria":
        return await criteria(repoRoot, rest, json, scope);
      case "record-evidence":
        return await captureEvidence(repoRoot, rest, json, scope);
      case "record-review-blockers":
        return await reviewBlockers(repoRoot, rest, json, scope);
      default:
        return unhandledSubcommand(command);
    }
  } catch (error) {
    if (json) {
      printJsonError(error);
      return 1;
    }
    if (error instanceof UlwLoopError)
      process.stderr.write(`[ulw-loop] ${error.message}
`);
    else if (error instanceof Error)
      process.stderr.write(`[ulw-loop] unexpected: ${error.message}
`);
    else
      process.stderr.write(`[ulw-loop] unknown error
`);
    return 1;
  }
}
function unhandledSubcommand(command) {
  throw new UlwLoopError(`Unhandled ulw-loop subcommand: ${String(command)}.`, "ULW_LOOP_SUBCOMMAND_UNHANDLED");
}
var SESSION_ID_FLAG = "--session-id";
function sessionIdFlagPresent(argv) {
  return hasFlag(argv, SESSION_ID_FLAG) || argv.some((arg) => arg.startsWith(`${SESSION_ID_FLAG}=`));
}
function commandScope(repoRoot, argv) {
  if (sessionIdFlagPresent(argv)) {
    const sessionId = readValue(argv, SESSION_ID_FLAG)?.trim();
    if (!sessionId) {
      throw new UlwLoopError(sessionIdRequiredMessage(SESSION_ID_FLAG), "ULW_LOOP_SESSION_ID_REQUIRED", {
        details: { flag: SESSION_ID_FLAG }
      });
    }
    return { sessionId };
  }
  const sessionId = resolveUlwLoopSessionIdFromEnv();
  if (sessionId !== null)
    return { sessionId };
  const existingSessionIds = listUlwLoopSessionIds(repoRoot);
  throw new UlwLoopError(sessionScopeRequiredMessage(SESSION_ID_FLAG, existingSessionIds), "ULW_LOOP_SESSION_SCOPE_REQUIRED", { details: { flag: SESSION_ID_FLAG, existingSessionIds } });
}

// components/ulw-loop/src/ultrawork-directive.ts
import { readFileSync as readFileSync5 } from "node:fs";

// components/ulw-loop/src/ultrawork-skill-pointer.ts
import { existsSync as existsSync6, readFileSync as readFileSync4 } from "node:fs";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var ULTRAWORK_SKILL_POINTER_TEMPLATE = `<ultrawork-mode>
ULTRAWORK MODE IS ACTIVE FOR THIS TASK.

MANDATORY BOOTSTRAP: do all three steps, in order, before anything else.

1. First user-visible line this turn MUST be exactly:
\`ULTRAWORK MODE ENABLED!\`

2. Call \`create_goal\` NOW with \`objective\` set to the user's request.
Send \`objective\` only: no \`status\`, no budget fields. If the
\`create_goal\` tool is unavailable, open your reply with a binding
\`# Goal\` block instead. Never skip this step.

3. Read the FULL ultrawork directive NOW, before any other tool call,
plan, or edit. It is the \`ultrawork\` skill, stored at:

{{ULTRAWORK_SKILL_PATH}}

Read the whole file. If a read result comes back truncated, keep
reading the remaining line ranges until you have seen every line.
Every rule in that file is binding for this entire task: no
compromise, no summarizing from memory, no skipping. If the file does
not exist, tell the user the omo ultrawork skill is missing and
continue with steps 1 and 2 plus evidence-bound execution.

Do not start the requested work until all three steps are complete.
</ultrawork-mode>
`;
var ULTRAWORK_SKILL_PATH_PLACEHOLDER = "{{ULTRAWORK_SKILL_PATH}}";
var ULTRAWORK_SKILL_FILE_URL = new URL("../../../skills/ultrawork/SKILL.md", import.meta.url);
var ULTRAWORK_DIRECTIVE = readFileSync4(new URL("../directive.md", import.meta.url), "utf8");
function resolveUltraworkSkillFilePath() {
  return fileURLToPath2(ULTRAWORK_SKILL_FILE_URL);
}
function buildUltraworkSkillPointer(skillFilePath) {
  return ULTRAWORK_SKILL_POINTER_TEMPLATE.replace(ULTRAWORK_SKILL_PATH_PLACEHOLDER, skillFilePath);
}
function buildUltraworkAdditionalContext(options = {}) {
  const skillFilePath = options.skillFilePath === undefined ? resolveUltraworkSkillFilePath() : options.skillFilePath;
  if (skillFilePath !== null && existsSync6(skillFilePath)) {
    return buildUltraworkSkillPointer(skillFilePath);
  }
  return ULTRAWORK_DIRECTIVE;
}

// components/ulw-loop/src/ultrawork-directive.ts
var ULTRAWORK_CURRENT_PROMPT_PATTERN = /(?:ultrawork|ulw)/i;
var ULTRAWORK_DIRECTIVE_MARKER = "<ultrawork-mode>";
var TRANSCRIPT_SEARCH_BYTES = 512000;
var CONTEXT_PRESSURE_MARKERS = [
  "context compacted",
  "context_length_exceeded",
  "skill descriptions were shortened",
  "context_too_large",
  "codex ran out of room in the model's context window",
  "your input exceeds the context window",
  "long threads and multiple compactions"
];
function buildUltraworkDirectiveOutput(input, options = {}) {
  if (isContextPressureRecoveryPrompt(input.prompt))
    return "";
  if (hasUltraworkDirectiveAlreadyInTranscript(input.transcript_path))
    return "";
  if (isContextPressureTranscript(input.transcript_path))
    return "";
  return isUltraworkPrompt(input.prompt) ? formatAdditionalContextOutput(buildUltraworkAdditionalContext(options)) : "";
}
function hasUltraworkDirectiveAlreadyInTranscript(transcriptPath) {
  if (transcriptPath === undefined || transcriptPath === null)
    return false;
  try {
    const rawTranscript = readTranscriptTail(transcriptPath);
    for (const line of rawTranscript.split(/\r?\n/)) {
      const parsed = parseJsonLine(line);
      if (!isRecord3(parsed))
        continue;
      const hookSpecificOutput = parsed["hookSpecificOutput"];
      if (!isRecord3(hookSpecificOutput))
        continue;
      if (hookSpecificOutput["hookEventName"] !== "UserPromptSubmit")
        continue;
      if (typeof hookSpecificOutput["additionalContext"] === "string" && hookSpecificOutput["additionalContext"].includes(ULTRAWORK_DIRECTIVE_MARKER)) {
        return true;
      }
    }
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
  return false;
}
function readTranscriptTail(transcriptPath) {
  const rawTranscript = readFileSync5(transcriptPath);
  return rawTranscript.subarray(Math.max(0, rawTranscript.byteLength - TRANSCRIPT_SEARCH_BYTES)).toString("utf8");
}
function isUltraworkPrompt(prompt) {
  return ULTRAWORK_CURRENT_PROMPT_PATTERN.test(prompt);
}
function isContextPressureRecoveryPrompt(prompt) {
  const normalizedPrompt = prompt.toLowerCase();
  return CONTEXT_PRESSURE_MARKERS.some((marker) => normalizedPrompt.includes(marker));
}
function isContextPressureTranscript(transcriptPath) {
  if (transcriptPath === undefined || transcriptPath === null)
    return false;
  try {
    return isContextPressureRecoveryPrompt(readTranscriptTail(transcriptPath));
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
}
function formatAdditionalContextOutput(additionalContext) {
  const normalizedContext = normalizeAdditionalContext(additionalContext);
  if (normalizedContext.length === 0)
    return "";
  const output = {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: normalizedContext
    }
  };
  return `${JSON.stringify(output)}
`;
}
function normalizeAdditionalContext(additionalContext) {
  return additionalContext.replace(/\r\n/g, `
`).replace(/\r/g, `
`).trim();
}
function parseJsonLine(line) {
  if (line.trim().length === 0)
    return null;
  try {
    const parsed = JSON.parse(line);
    return parsed;
  } catch (error) {
    if (error instanceof Error)
      return null;
    throw error;
  }
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// components/ulw-loop/src/codex-hook.ts
var CREATE_GOAL_TOOL_NAME = "create_goal";
var CREATE_GOAL_PAYLOAD_WARNING = "Use create_goal with objective only. Omit token_budget so the goal stays unlimited, and put lifecycle status changes on update_goal.";
function parseUserPromptSubmitPayload(raw) {
  if (raw.trim().length === 0)
    return null;
  try {
    const parsed = JSON.parse(raw);
    return isUserPromptSubmitPayload(parsed) ? parsed : null;
  } catch (error) {
    if (error instanceof SyntaxError)
      return null;
    return null;
  }
}
function parsePreToolUsePayload(raw) {
  if (raw.trim().length === 0)
    return null;
  try {
    const parsed = JSON.parse(raw);
    return isPreToolUsePayload(parsed) ? parsed : null;
  } catch (error) {
    if (error instanceof SyntaxError)
      return null;
    return null;
  }
}
async function applyUserPromptUlwLoopSteering(payload, options = {}) {
  try {
    if (payload.hook_event_name !== "UserPromptSubmit")
      return "";
    const proposal = parseUlwLoopSteeringDirective(payload.prompt);
    if (proposal === null) {
      if (hasSteeringDirectiveMarker(payload.prompt))
        return "";
      if (!options.includeUltraworkDirective)
        return "";
      return options.ultraworkSkillFilePath === undefined ? buildUltraworkDirectiveOutput(payload) : buildUltraworkDirectiveOutput(payload, { skillFilePath: options.ultraworkSkillFilePath });
    }
    const result = await steerUlwLoop(payload.cwd, proposal, payloadScope(payload));
    if (!result.accepted)
      return "";
    return JSON.stringify({
      status: "accepted",
      kind: result.audit.kind,
      source: result.audit.source,
      deduped: result.deduped
    });
  } catch (error) {
    if (error instanceof Error)
      return "";
    return "";
  }
}
function hasSteeringDirectiveMarker(prompt) {
  return /(?:^|\s)(?:OMO_ULW_LOOP_STEER|omo\.ulw-loop\.steer|omo ulw-loop steer|omo-agent-toolkit ulw-loop steer):/u.test(prompt);
}
function payloadScope(payload) {
  return { sessionId: payload.session_id };
}
function applyPreToolUseGoalBudgetGuard(payload) {
  if (payload.hook_event_name !== "PreToolUse")
    return "";
  if (payload.tool_name !== CREATE_GOAL_TOOL_NAME)
    return "";
  if (!hasInvalidCreateGoalInput(payload.tool_input))
    return "";
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: CREATE_GOAL_PAYLOAD_WARNING,
      additionalContext: CREATE_GOAL_PAYLOAD_WARNING
    }
  };
  return `${JSON.stringify(output)}
`;
}
async function runUlwLoopHookCli(stdin, stdout, options = {}) {
  try {
    const payload = parseUserPromptSubmitPayload(await readAll(stdin));
    if (payload === null)
      return;
    const output = await applyUserPromptUlwLoopSteering(payload, options);
    if (output.length > 0)
      stdout.write(output);
  } catch (error) {
    if (error instanceof Error)
      return;
    return;
  }
}
async function runPreToolUseGoalBudgetGuardCli(stdin, stdout) {
  try {
    const payload = parsePreToolUsePayload(await readAll(stdin));
    if (payload === null)
      return;
    const output = applyPreToolUseGoalBudgetGuard(payload);
    if (output.length > 0)
      stdout.write(output);
  } catch (error) {
    if (error instanceof Error)
      return;
    return;
  }
}
function isUserPromptSubmitPayload(value) {
  if (!isRecord4(value))
    return false;
  return value["hook_event_name"] === "UserPromptSubmit" && typeof value["cwd"] === "string" && typeof value["prompt"] === "string" && typeof value["session_id"] === "string" && ["model", "permission_mode", "turn_id"].every((key) => optionalString(value[key])) && (value["transcript_path"] === undefined || value["transcript_path"] === null || typeof value["transcript_path"] === "string");
}
function isPreToolUsePayload(value) {
  if (!isRecord4(value))
    return false;
  return value["hook_event_name"] === "PreToolUse" && typeof value["cwd"] === "string" && typeof value["model"] === "string" && typeof value["permission_mode"] === "string" && typeof value["session_id"] === "string" && typeof value["tool_name"] === "string" && typeof value["tool_use_id"] === "string" && (value["transcript_path"] === null || typeof value["transcript_path"] === "string") && typeof value["turn_id"] === "string" && Object.hasOwn(value, "tool_input");
}
function hasInvalidCreateGoalInput(value) {
  return isRecord4(value) && Object.keys(value).some((key) => key !== "objective");
}
function isRecord4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function optionalString(value) {
  return value === undefined || typeof value === "string";
}
function readAll(stdin) {
  return new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk instanceof Buffer ? chunk.toString() : String(chunk);
    });
    stdin.once("error", reject);
    stdin.once("end", () => resolve(data));
  });
}

// components/ulw-loop/src/spawn-guard.ts
import { mkdirSync as mkdirSync3 } from "node:fs";
import { join as join8 } from "node:path";

// components/ulw-loop/src/registered-agent-roles.ts
import { readdirSync as readdirSync3, readFileSync as readFileSync6 } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname as dirname3, join as join6, resolve as resolve5 } from "node:path";
var NAME_LINE = /^\s*name\s*=\s*"([^"\n]+)"\s*(?:#.*)?$/m;
var AGENT_TABLE = /^\s*\[agents\.(?:"([^"\n]+)"|([A-Za-z0-9_-]+))\]\s*(?:#.*)?$/gm;
function readText(path) {
  try {
    return readFileSync6(path, "utf8");
  } catch {
    return null;
  }
}
function standaloneRoleNames(agentsDir) {
  let entries;
  try {
    entries = readdirSync3(agentsDir);
  } catch {
    return [];
  }
  const names = [];
  for (const entry of entries) {
    if (!entry.endsWith(".toml"))
      continue;
    const text = readText(join6(agentsDir, entry));
    if (text === null)
      continue;
    names.push(text.match(NAME_LINE)?.[1] ?? basename(entry, ".toml"));
  }
  return names;
}
function configTableRoleNames(configPath) {
  const text = readText(configPath);
  if (text === null)
    return [];
  return [...text.matchAll(AGENT_TABLE)].map((match) => match[1] ?? match[2] ?? "").filter(Boolean);
}
function codexDirs(cwd, env) {
  const dirs = [resolve5(env["CODEX_HOME"]?.trim() || join6(homedir(), ".codex"))];
  for (let dir = resolve5(cwd);; dir = dirname3(dir)) {
    dirs.push(join6(dir, ".codex"));
    if (dirname3(dir) === dir)
      break;
  }
  return [...new Set(dirs)];
}
function registeredAgentRoles(cwd, env = process.env) {
  const names = new Set;
  for (const dir of codexDirs(cwd, env)) {
    for (const name of standaloneRoleNames(join6(dir, "agents")))
      names.add(name);
    for (const name of configTableRoleNames(join6(dir, "config.toml")))
      names.add(name);
  }
  return names;
}

// components/ulw-loop/src/spawn-budget-io.ts
import { randomBytes } from "node:crypto";
import { existsSync as existsSync7, readFileSync as readFileSync7, renameSync as renameSync2, statSync as statSync3, writeFileSync as writeFileSync2 } from "node:fs";
import { dirname as dirname4, join as join7 } from "node:path";
function readAdmissionBreaker(sessionId) {
  const dataDir = process.env["PLUGIN_DATA"];
  if (typeof dataDir !== "string")
    return null;
  try {
    const value = JSON.parse(readFileSync7(join7(dataDir, "spawn-breaker", `${sessionId}.json`), "utf8"));
    return typeof value === "object" && value !== null && "reason" in value && typeof value.reason === "string" ? value.reason : "capacity limit";
  } catch {
    return null;
  }
}
function atomicWriteJson(targetPath, data) {
  const tmp = join7(dirname4(targetPath), `.tmp-${randomBytes(6).toString("hex")}`);
  writeFileSync2(tmp, JSON.stringify(data));
  renameSync2(tmp, targetPath);
}
function isNonEmptyFile(path) {
  try {
    return existsSync7(path) && statSync3(path).size > 0;
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
}
function readCount(counterPath) {
  try {
    const parsed = JSON.parse(readFileSync7(counterPath, "utf8"));
    return typeof parsed === "object" && parsed !== null && "count" in parsed && typeof parsed.count === "number" && parsed.count >= 0 ? parsed.count : 0;
  } catch (error) {
    if (error instanceof Error)
      return 0;
    throw error;
  }
}
function readCounts(counterPath) {
  try {
    const parsed = JSON.parse(readFileSync7(counterPath, "utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return {};
    const counts = {};
    for (const [key, value] of Object.entries(parsed))
      if (typeof value === "number" && value >= 0)
        counts[key] = value;
    return counts;
  } catch (error) {
    if (error instanceof Error)
      return {};
    throw error;
  }
}

// components/ulw-loop/src/spawn-role-guard.ts
var LAZYCODEX_SPAWN_ROLES = new Set([
  "explorer",
  "lazycodex-clone-fidelity-reviewer",
  "lazycodex-code-reviewer",
  "lazycodex-gate-reviewer",
  "lazycodex-qa-executor",
  "lazycodex-worker-high",
  "lazycodex-worker-low",
  "lazycodex-worker-medium",
  "librarian",
  "metis",
  "momus",
  "plan"
]);
function spawnRoleDenial(input, registeredRoles = () => new Set) {
  const role = typeof input === "object" && input !== null && "agent_type" in input ? input.agent_type : undefined;
  if (typeof role === "string" && LAZYCODEX_SPAWN_ROLES.has(role))
    return null;
  const registered = typeof role === "string" && role.trim() !== "" ? registeredRoles() : new Set;
  if (typeof role === "string" && registered.has(role))
    return null;
  const known = [...new Set([...LAZYCODEX_SPAWN_ROLES, ...registered])];
  return `LazyCodex requires an explicit registered agent_type: ${known.join(", ")}. Received ${JSON.stringify(role) ?? "no agent_type"}. Use the matching role and fork_turns: "none" (V2) or fork_context: false (V1), unless full history is deliberately required. The hook cannot see the tool schema; if agent_type is unavailable, stop and report incompatible role routing rather than spawning a generic agent. Describing a role in message does not select its TOML.`;
}

// components/ulw-loop/src/spawn-guard.ts
var SPAWN_TOOL_TOKENS = new Set([
  "spawn_agent",
  "multi_agent_v1.spawn_agent",
  "collaborationspawn_agent",
  "collaboration.spawn_agent"
]);
var DEFAULT_FANOUT_LIMIT = 24;
var DEFAULT_REVIEW_SPAWN_LIMIT = 3;
var GATE_MESSAGE_PATTERN = /lazycodex-gate-reviewer|omo-native-gate-reviewer|omo-senpi-gate-reviewer|final gate review/i;
var REVIEW_AGENT_TYPES = [
  ...Object.values(REVIEWER_ROLES_BY_SURFACE).map((roles) => roles.gateReview),
  ...Object.values(REVIEWER_ROLES_BY_SURFACE).map((roles) => roles.codeReview),
  ...Object.values(REVIEWER_ROLES_BY_SURFACE).map((roles) => roles.manualQa),
  ...Object.keys(LEGACY_REVIEWER_AGENT_ALIASES)
];
var REVIEW_AGENT_TYPE_SET = new Set(REVIEW_AGENT_TYPES);
function applySpawnGuards(payload, options = {}) {
  if (payload.hook_event_name !== "PreToolUse" || !SPAWN_TOOL_TOKENS.has(payload.tool_name))
    return "";
  if (resolveToolkitSurface() === "lazycodex") {
    const reason = spawnRoleDenial(payload.tool_input, () => registeredAgentRoles(payload.cwd));
    if (reason !== null)
      return deny(reason);
  }
  return applySpawnBudgetGuards(payload, options);
}
function applySpawnBudgetGuards(payload, options = {}) {
  if (payload.hook_event_name !== "PreToolUse" || !SPAWN_TOOL_TOKENS.has(payload.tool_name))
    return "";
  const breaker = readAdmissionBreaker(payload.session_id);
  if (breaker !== null)
    return deny(`Subagent admission failed earlier in this session (${breaker}). Do not spawn more workers or reviewers; report the capacity block and wait for the user.`);
  const scope = { sessionId: payload.session_id };
  const stateDir = ulwLoopDir(payload.cwd, scope);
  const plan = readPlan(payload.cwd, payload.session_id);
  if (plan === null)
    return "";
  const lockOptions = options.lockTimeoutMs === undefined ? {} : { timeoutMs: options.lockTimeoutMs };
  try {
    return withStateLockSync(ulwLoopStateLockPath(payload.cwd, scope), () => evaluateGuards(payload, plan, stateDir), lockOptions);
  } catch (error) {
    if (isStateLockTimeout(error))
      return deny(`ulw-loop spawn guard could not take the session state lock: ${error.message}`);
    throw error;
  }
}
function evaluateGuards(payload, plan, stateDir) {
  const fanOutPeek = peekFanOutBudget(stateDir);
  if (fanOutPeek !== null)
    return deny(fanOutPeek);
  const missingArtifact = missingGateArtifact(payload, plan);
  if (missingArtifact !== null)
    return deny(`record manual QA first; gate audits its artifacts: missing ${missingArtifact}`);
  const reviewDenial = consumeReviewSpawnBudget(payload, plan, stateDir);
  if (reviewDenial !== null)
    return deny(reviewDenial);
  const fanOutDenial = consumeFanOutBudget(stateDir);
  if (fanOutDenial !== null)
    return deny(fanOutDenial);
  return "";
}
async function runSpawnAdmissionRecorderCli(stdin, stdout) {
  const chunks = [];
  for await (const chunk of stdin)
    chunks.push(Buffer.from(chunk));
  try {
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const response = typeof payload["tool_response"] === "string" ? payload["tool_response"] : JSON.stringify(payload["tool_response"] ?? "");
    if (!/too many active cells|AgentLimitReached|max_threads|max_concurrent_threads_per_session/i.test(response))
      return;
    const dataDir = process.env["PLUGIN_DATA"];
    if (typeof dataDir !== "string" || typeof payload["session_id"] !== "string")
      return;
    const markerDir = join8(dataDir, "spawn-breaker");
    try {
      mkdirSync3(markerDir, { recursive: true });
      atomicWriteJson(join8(markerDir, `${payload["session_id"]}.json`), {
        reason: response,
        at: new Date().toISOString()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`[ulw-loop] spawn-guard: could not persist admission failure: ${message}
`);
    }
  } catch {}
}
async function runSpawnGuardCli(stdin, stdout) {
  try {
    const chunks = [];
    for await (const chunk of stdin)
      chunks.push(Buffer.from(chunk));
    const payload = parsePreToolUsePayload(Buffer.concat(chunks).toString("utf8"));
    if (payload === null) {
      stdout.write(deny("LazyCodex spawn guard received an invalid hook payload; role routing was not verified."));
      return;
    }
    const output = applySpawnGuards(payload);
    if (output.length > 0)
      stdout.write(output);
  } catch (error) {
    stdout.write(deny(`LazyCodex spawn guard failed: ${error instanceof Error ? error.message : String(error)}`));
  }
}
function peekFanOutBudget(stateDir) {
  const counterPath = join8(stateDir, "spawn-count.json");
  const count = readCount(counterPath) + 1;
  const limit = fanOutLimit();
  if (count <= limit)
    return null;
  return `ulw-loop spawn fan-out cap reached (${count}/${limit}). Consolidate work into the agents already running, or raise OMO_SPAWN_FANOUT_LIMIT if this volume is intentional.`;
}
function consumeFanOutBudget(stateDir) {
  const counterPath = join8(stateDir, "spawn-count.json");
  const count = readCount(counterPath) + 1;
  atomicWriteJson(counterPath, { count });
  const limit = fanOutLimit();
  if (count <= limit)
    return null;
  return `ulw-loop spawn fan-out cap reached (${count}/${limit}). Consolidate work into the agents already running, or raise OMO_SPAWN_FANOUT_LIMIT if this volume is intentional.`;
}
function consumeReviewSpawnBudget(payload, plan, stateDir) {
  const agentType = reviewAgentType(payload.tool_input);
  if (agentType === null)
    return null;
  const goal = plan.goals.find((candidate) => candidate.id === plan.activeGoalId) ?? plan.goals.find((candidate) => isFinalRunCompletionCandidate(plan, candidate));
  if (goal === undefined)
    return null;
  const counterPath = join8(stateDir, "review-spawn-counts.json");
  const limit = reviewSpawnLimit();
  const counts = readCounts(counterPath);
  const key = `${agentType}:${goal.id}:a${goal.attempt}`;
  const count = (counts[key] ?? 0) + 1;
  if (count > limit)
    return `ulw-loop reviewer no-progress cap reached (${agentType} ${count}/${limit}) for ${goal.id} attempt ${goal.attempt}. Consolidate existing review findings, or checkpoint and start a new attempt after concrete progress.`;
  counts[key] = count;
  atomicWriteJson(counterPath, counts);
  return null;
}
function missingGateArtifact(payload, plan) {
  if (!isGateReviewerSpawn(payload.tool_input))
    return null;
  const goal = plan.goals.find((candidate) => isFinalRunCompletionCandidate(plan, candidate));
  if (goal === undefined || goal.status === "complete")
    return null;
  if (!goal.successCriteria.every((criterion) => criterion.status === "pass"))
    return null;
  const scope = { sessionId: payload.session_id };
  const requiredArtifacts = [`${goal.id}-manual-qa.md`];
  if (plan.evidenceLayoutVersion === 2) {
    const attemptDir = ulwLoopAttemptEvidenceDir(goal.id, goal.attempt, scope);
    for (const name of requiredArtifacts) {
      const relative = `${attemptDir}/${name}`;
      if (!isNonEmptyFile(join8(payload.cwd, relative)))
        return relative;
    }
    return null;
  }
  const manualQa = `.omo/evidence/${goal.id}-manual-qa.md`;
  return isNonEmptyFile(join8(payload.cwd, manualQa)) ? null : manualQa;
}
function isGateReviewerSpawn(toolInput) {
  const agentType = reviewAgentType(toolInput);
  return agentType !== null && GATE_REVIEWER_AGENT_NAMES.has(agentType);
}
function reviewAgentType(toolInput) {
  if (typeof toolInput !== "object" || toolInput === null)
    return null;
  const record = toolInput;
  const agentType = record["agent_type"];
  if (typeof agentType === "string") {
    if (!REVIEW_AGENT_TYPE_SET.has(agentType))
      return null;
    return activeSurfaceReviewerAlias(agentType);
  }
  const message = record["message"];
  if (typeof message !== "string")
    return null;
  const normalizedMessage = message.toLowerCase();
  const allRoleNames = [...REVIEW_AGENT_TYPES];
  const explicitAssignment = allRoleNames.map((name) => ({
    name,
    index: normalizedMessage.search(new RegExp(`\\bact as (?:an? )?${name}\\b`))
  })).filter(({ index }) => index >= 0).sort((left, right) => left.index - right.index)[0];
  if (explicitAssignment !== undefined)
    return activeSurfaceReviewerAlias(explicitAssignment.name);
  const nonReviewerActAs = /\bact as (?:an? )?\S+/.test(normalizedMessage);
  if (nonReviewerActAs)
    return null;
  const namedReviewer = REVIEW_AGENT_TYPES.find((name) => normalizedMessage.includes(name));
  if (namedReviewer !== undefined)
    return activeSurfaceReviewerAlias(namedReviewer);
  return GATE_MESSAGE_PATTERN.test(message) ? reviewerRolesFor(resolveToolkitSurface()).gateReview : null;
}
function activeSurfaceReviewerAlias(reviewer) {
  const canonical = canonicalReviewerAgentName(reviewer);
  const activeRoles = reviewerRolesFor(resolveToolkitSurface());
  for (const roles of Object.values(REVIEWER_ROLES_BY_SURFACE)) {
    if (canonical === roles.codeReview)
      return activeRoles.codeReview;
    if (canonical === roles.manualQa)
      return activeRoles.manualQa;
    if (canonical === roles.gateReview)
      return activeRoles.gateReview;
  }
  return canonical;
}
function deny(reason) {
  return `${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
      additionalContext: reason
    }
  })}
`;
}
function fanOutLimit() {
  const raw = process.env["OMO_SPAWN_FANOUT_LIMIT"];
  if (raw === undefined)
    return DEFAULT_FANOUT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FANOUT_LIMIT;
}
function reviewSpawnLimit() {
  const raw = process.env["OMO_ULW_LOOP_REVIEW_SPAWN_LIMIT"];
  if (raw === undefined)
    return DEFAULT_REVIEW_SPAWN_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REVIEW_SPAWN_LIMIT;
}
function readPlan(repoRoot, sessionId) {
  try {
    return readUlwLoopPlanSync(repoRoot, { sessionId });
  } catch (error) {
    if (error instanceof Error)
      return null;
    throw error;
  }
}

// components/ulw-loop/src/stop-resume-hook.ts
import { existsSync as existsSync8, readFileSync as readFileSync8, writeFileSync as writeFileSync3 } from "node:fs";
import { isAbsolute as isAbsolute3, join as join9, resolve as resolve6, sep as sep3 } from "node:path";
var RESUME_CAP = 2;
var CONTEXT_PRESSURE_MARKERS2 = [
  "context compacted",
  "context_length_exceeded",
  "skill descriptions were shortened",
  "context_too_large",
  "codex ran out of room in the model's context window",
  "your input exceeds the context window",
  "long threads and multiple compactions"
];
function runStopResumeHook(input) {
  const payload = parseStopPayload(input);
  if (payload === null || payload.stop_hook_active)
    return "";
  if (transcriptShowsContextPressure(payload.transcript_path))
    return "";
  if (boulderContinuationWillFire(payload.cwd, payload.session_id))
    return "";
  const scope = { sessionId: payload.session_id };
  const stateDir = ulwLoopDir(payload.cwd, scope);
  const plan = readPlan2(payload.cwd, payload.session_id);
  if (plan === null || plan.aggregateCompletion?.status === "complete")
    return "";
  const goal = resumableGoal(plan);
  if (goal === undefined)
    return "";
  if (!consumeResumeBudgetLocked(ulwLoopStateLockPath(payload.cwd, scope), stateDir, goal.id))
    return "";
  const output = {
    decision: "block",
    reason: renderResumeDirective(plan, goal, payload.session_id)
  };
  return JSON.stringify(output);
}
async function runStopResumeHookCli(stdin, stdout) {
  try {
    const chunks = [];
    for await (const chunk of stdin)
      chunks.push(Buffer.from(chunk));
    const output = runStopResumeHook(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (output.length > 0)
      stdout.write(output);
  } catch (error) {
    if (error instanceof Error)
      return;
  }
}
function resumableGoal(plan) {
  const active = plan.goals.find((goal) => goal.id === plan.activeGoalId);
  if (active !== undefined && isResumableStatus(active.status))
    return active;
  return plan.goals.find((goal) => isResumableStatus(goal.status));
}
function isResumableStatus(status) {
  return status === "pending" || status === "in_progress";
}
function consumeResumeBudgetLocked(lockPath, stateDir, goalId) {
  try {
    return withStateLockSync(lockPath, () => consumeResumeBudget(stateDir, goalId));
  } catch (error) {
    if (isStateLockTimeout(error))
      return false;
    throw error;
  }
}
function consumeResumeBudget(stateDir, goalId) {
  const ledgerLineCount = readLedgerAt(stateDir).length;
  const counterPath = resolve6(stateDir, `auto-resume-${goalId}.json`);
  const stuckPath = resolve6(stateDir, `auto-resume-${goalId}.stuck`);
  if (!isInsideDir(stateDir, counterPath) || !isInsideDir(stateDir, stuckPath))
    return false;
  const previous = readCounter(counterPath);
  const count = previous !== null && previous.ledgerLineCount === ledgerLineCount ? previous.count : 0;
  if (count >= RESUME_CAP) {
    writeFileSync3(stuckPath, `no ledger progress after ${count} resumes
`);
    return false;
  }
  writeFileSync3(counterPath, JSON.stringify({ count: count + 1, ledgerLineCount }));
  return true;
}
function isInsideDir(dir, candidate) {
  return candidate.startsWith(resolve6(dir) + sep3);
}
function renderResumeDirective(plan, goal, sessionId) {
  const normalized = normalizeUlwLoopSessionId(sessionId);
  const option = normalized !== null && plan.goalsPath.includes(`/${normalized}/`) ? ` --session-id ${normalized}` : "";
  return [
    `The ulw-loop run in this session still has unfinished goals (next: ${goal.id} — ${goal.title}).`,
    "The turn ended before the loop completed. Resume it now:",
    `1. Run \`omo-agent-toolkit ulw-loop status${option} --json\` to reload the plan, the active goal, and currentAttemptDir.`,
    "2. Continue the active goal's remaining success criteria, recording evidence with record-evidence.",
    `3. Checkpoint through \`omo-agent-toolkit ulw-loop checkpoint${option}\` when the goal's criteria are proven; a complete checkpoint prints the next goal instruction.`,
    "If the loop is genuinely blocked on the user, checkpoint the goal as blocked with the reason instead."
  ].join(`
`);
}
function readPlan2(repoRoot, sessionId) {
  try {
    return readUlwLoopPlanSync(repoRoot, { sessionId });
  } catch (error) {
    if (error instanceof Error)
      return null;
    throw error;
  }
}
function readCounter(counterPath) {
  try {
    if (!existsSync8(counterPath))
      return null;
    const parsed = JSON.parse(readFileSync8(counterPath, "utf8"));
    if (typeof parsed["count"] !== "number" || typeof parsed["ledgerLineCount"] !== "number")
      return null;
    return { count: parsed["count"], ledgerLineCount: parsed["ledgerLineCount"] };
  } catch (error) {
    if (error instanceof Error)
      return null;
    throw error;
  }
}
function boulderContinuationWillFire(cwd, sessionId) {
  try {
    const raw = JSON.parse(readFileSync8(join9(cwd, ".omo", "boulder.json"), "utf8"));
    const works = raw["works"];
    const entries = typeof works === "object" && works !== null ? Object.values(works) : [raw];
    return entries.some((work) => {
      if (typeof work !== "object" || work === null)
        return false;
      const entry = work;
      const sessionIds = Array.isArray(entry["session_ids"]) ? entry["session_ids"] : [];
      const continuable = entry["status"] === "active" || entry["status"] === "paused";
      return continuable && sessionIds.includes(`codex:${sessionId}`) && boulderPlanHasChecklist(cwd, entry);
    });
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
}
function transcriptShowsContextPressure(transcriptPath) {
  try {
    const transcript = readFileSync8(transcriptPath, "utf8").toLowerCase();
    return CONTEXT_PRESSURE_MARKERS2.some((marker) => transcript.includes(marker));
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
}
function boulderPlanHasChecklist(cwd, entry) {
  const activePlan = entry["active_plan"];
  if (typeof activePlan !== "string" || activePlan.trim().length === 0)
    return false;
  const planPath = isAbsolute3(activePlan) ? activePlan : join9(cwd, activePlan);
  const worktree = entry["worktree_path"];
  const candidates = typeof worktree === "string" && worktree.trim().length > 0 && !isAbsolute3(activePlan) ? [join9(isAbsolute3(worktree) ? worktree : join9(cwd, worktree), activePlan), planPath] : [planPath];
  for (const candidate of candidates) {
    try {
      return readFileSync8(candidate, "utf8").split(/\r?\n/).some((line) => line.startsWith("- [ ] ") || line.startsWith("- [x] ") || line.startsWith("- [X] "));
    } catch (error) {
      if (!(error instanceof Error))
        throw error;
    }
  }
  return false;
}
function parseStopPayload(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const record = value;
  const optionalMessage = record["last_assistant_message"];
  const valid = record["hook_event_name"] === "Stop" && typeof record["session_id"] === "string" && typeof record["turn_id"] === "string" && typeof record["transcript_path"] === "string" && typeof record["cwd"] === "string" && typeof record["model"] === "string" && typeof record["permission_mode"] === "string" && typeof record["stop_hook_active"] === "boolean" && (optionalMessage === undefined || typeof optionalMessage === "string");
  if (!valid)
    return null;
  return {
    session_id: record["session_id"],
    cwd: record["cwd"],
    transcript_path: record["transcript_path"],
    stop_hook_active: record["stop_hook_active"]
  };
}

// components/ulw-loop/src/cli.ts
async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (command === undefined || command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(`${ULW_LOOP_HELP}
`);
    return 0;
  }
  if (command === "ulw-loop")
    return ulwLoopCommand(argv.slice(1));
  if (command === "hook") {
    const sub = argv[1];
    if (sub === "user-prompt-submit") {
      await runUlwLoopHookCli(process.stdin, process.stdout, {
        includeUltraworkDirective: argv.includes("--with-ultrawork")
      });
      return 0;
    }
    if (sub === "pre-tool-use") {
      await runPreToolUseGoalBudgetGuardCli(process.stdin, process.stdout);
      return 0;
    }
    if (sub === "stop") {
      await runStopResumeHookCli(process.stdin, process.stdout);
      return 0;
    }
    if (sub === "post-tool-use-spawn") {
      await runSpawnAdmissionRecorderCli(process.stdin, process.stdout);
      return 0;
    }
    if (sub === "pre-tool-use-spawn") {
      await runSpawnGuardCli(process.stdin, process.stdout);
      return 0;
    }
    process.stderr.write(`[omo] unknown hook subcommand: ${sub ?? "(none)"}
`);
    return 1;
  }
  if (isUlwLoopSubcommand(command))
    return ulwLoopCommand(argv);
  process.stderr.write(`[omo] unknown command: ${command}
${ULW_LOOP_HELP}
`);
  return 1;
}
main().then((code) => {
  process.exit(code);
}).catch((error) => {
  process.stderr.write(`[omo] ${error instanceof Error ? error.message : String(error)}
`);
  process.exit(1);
});

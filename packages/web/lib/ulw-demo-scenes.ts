/**
 * Source-grounded scene data for the interactive Ultrawork demo.
 *
 * Every visible string traces to OMO/LazyCodex source truth via
 * `.omo/reference/source-ledger.md` (workflow beats → omo source lines) and
 * `content/docs/{ultrawork,ulw-loop,manual-qa}.md`. Do not invent beats,
 * metrics, or command flags here — extend the ledger first.
 */

export type UlwLane =
  | "root"
  | "explore"
  | "library"
  | "plan"
  | "todo"
  | "execute"
  | "test"
  | "qa"
  | "review"
  | "continuation";

export type UlwScene = {
  readonly key: string;
  readonly tab: string;
  readonly command: string;
  readonly status: string;
  readonly title: string;
  readonly body: string;
  readonly composer: string;
  readonly sideTitle: string;
  readonly sideBody: string;
  readonly ledger: string;
  readonly json: string;
  readonly lanes: readonly UlwLane[];
  readonly proof: number;
  readonly elapsed: string;
};

export type UlwStep = { readonly heading: string; readonly detail: string };

export type UlwWorker = {
  readonly name: string;
  readonly role: string;
  readonly lane: UlwLane;
  readonly glyph: string;
};

export const ULW_DEMO_STEPS = [
  { heading: "Explorer + Librarian swarm", detail: "Call parallel subagents to find repo truth, docs, commands, and inaccurate claims to avoid." },
  { heading: "Plan agent / Prometheus", detail: "Combine research into a decision-complete plan before implementation begins." },
  { heading: "TodoWrite + task system", detail: "Register atomic tasks and blockedBy edges; `.omo/ulw-loop/goals.json` stores criteria." },
  { heading: "$start-work assigns lanes", detail: "Executor, QA Executor, reviewer, and gate workers receive bounded deliverables." },
  { heading: "TDD red", detail: "Capture the failing-first proof before production code changes." },
  { heading: "GREEN + record-evidence", detail: "Make the smallest fix, pass the test, and record criterion-scoped evidence." },
  { heading: "QA fail -> goal_retried", detail: "Manual QA can fail the run; ULW records the failure and retries the same criterion." },
  { heading: "Quality gate + checkpoint", detail: "Only code review, manualQa, gateReview, iteration, and coverage evidence close the story." },
] as const satisfies readonly UlwStep[];

export const ULW_DEMO_PROOFS = [
  "research facts",
  "plan artifact",
  "TodoWrite",
  "worker lanes",
  "TDD red",
  "record-evidence",
  "QA fail retry",
  "checkpoint complete",
] as const satisfies readonly string[];

export const ULW_DEMO_WORKERS = [
  { name: "Root Orchestrator", role: "holding goal", lane: "root", glyph: "R" },
  { name: "Explorer the 53rd", role: "repo scan", lane: "explore", glyph: "X" },
  { name: "Explorer the 54th", role: "tests", lane: "explore", glyph: "X" },
  { name: "Librarian the 24th", role: "docs", lane: "library", glyph: "L" },
  { name: "Librarian the 25th", role: "contracts", lane: "library", glyph: "L" },
  { name: "Plan agent / Prometheus", role: "waiting", lane: "plan", glyph: "P" },
  { name: "TodoWrite adapter", role: "tasks", lane: "todo", glyph: "T" },
  { name: "Executor the 23rd", role: "implementation", lane: "execute", glyph: "E" },
  { name: "TDD Executor the 12th", role: "red/green", lane: "test", glyph: "T" },
  { name: "QA Executor the 23rd", role: "Manual QA", lane: "qa", glyph: "Q" },
  { name: "lazycodex-code-reviewer", role: "codeReview", lane: "review", glyph: "C" },
  { name: "lazycodex-gate-reviewer", role: "gateReview", lane: "review", glyph: "G" },
  { name: "Stop/SubagentStop hook", role: "continue", lane: "continuation", glyph: "S" },
] as const satisfies readonly UlwWorker[];

export const ULW_DEMO_SCENES = [
  {
    key: "research",
    tab: "01 Research",
    command: 'task(subagent_type="explorer") + task(subagent_type="librarian")',
    status: "Research wave · Explorer and Librarian gather source truth",
    title: "Ultrawork starts by fanning out research.",
    body: "Root does not guess. Explorer reads the local implementation, Librarian checks docs and contracts, and their findings become the input to the Plan agent.",
    composer: "Root is waiting for Explorer and Librarian findings before the Plan agent writes anything.",
    sideTitle: "Research lanes are live.",
    sideBody: "Explorer reads the local implementation while Librarian checks docs and skill contracts. Root waits for both before planning.",
    ledger: "plan_created pending research facts",
    json: '{ "activeGoalId": null, "criteria": "pending" }',
    lanes: ["root", "explore", "library"],
    proof: 0,
    elapsed: "3d 2h 14m",
  },
  {
    key: "plan",
    tab: "02 Plan",
    command: "$ulw-plan .omo/plans/ultrawork-demo.md",
    status: "Planning · Plan agent / Prometheus synthesizes the lanes",
    title: "Plan first, then execute with evidence.",
    body: "The Plan agent merges Explorer and Librarian findings into a decision-complete plan: references, acceptance criteria, QA channel, evidence path, and workers.",
    composer: "Plan agent is writing the handoff surface; no product code is touched here.",
    sideTitle: "Plan agent is planner-only.",
    sideBody: "The safe claim is planning, not execution. Implementation begins only after start-work or ulw-loop picks up the plan.",
    ledger: "plan_created .omo/plans/ultrawork-demo.md\nsteering_accepted research findings",
    json: '{ "briefPath": ".omo/ulw-loop/brief.md", "goalsPath": ".omo/ulw-loop/goals.json" }',
    lanes: ["root", "explore", "library", "plan"],
    proof: 1,
    elapsed: "3d 4h 51m",
  },
  {
    key: "todo",
    tab: "03 Todo",
    command: "TodoWrite -> task_create + omo ulw-loop create-goals",
    status: "Todo registration · file-backed tasks and success criteria",
    title: "The todo list becomes durable state.",
    body: "TodoWrite commits atomic work before generation. In OMO, ulw-loop persists goals, criteria, and the append-only ledger under `.omo/ulw-loop/`.",
    composer: "Registering G001 with C001 happy, C002 edge, and C003 regression criteria.",
    sideTitle: "TodoWrite is not decoration.",
    sideBody: "Tasks are marked complete only after their matching artifact lands; multi-agent work uses dependencies instead of loose memory.",
    ledger: "plan_created 1 goal(s) created\nG001 status=pending\nC001/C002/C003 status=pending",
    json: '{ "activeGoalId": null, "goals": [{ "id": "G001-ultrawork-demo", "status": "pending" }] }',
    lanes: ["root", "plan", "todo"],
    proof: 2,
    elapsed: "3d 7h 33m",
  },
  {
    key: "assign",
    tab: "04 Assign",
    command: "$start-work .omo/plans/ultrawork-demo.md",
    status: "Assignment · subagents receive bounded tasks",
    title: "Root assigns work instead of doing it all directly.",
    body: "Executor owns implementation, TDD Executor owns the failing-first proof, QA Executor owns the real browser scenario, and reviewers own the final gate.",
    composer: "Executor, TDD, QA, and review lanes are active; root watches dependencies and drift.",
    sideTitle: "Subagents are visible work lanes.",
    sideBody: "The roster makes delegation observable: each worker owns a narrow deliverable and returns artifact-backed evidence.",
    ledger: "goal_started G001-ultrawork-demo Attempt 1\nactiveGoalId=G001-ultrawork-demo",
    json: '{ "activeGoalId": "G001-ultrawork-demo", "attempt": 1, "status": "in_progress" }',
    lanes: ["root", "todo", "execute", "test", "qa", "review", "continuation"],
    proof: 3,
    elapsed: "3d 11h 06m",
  },
  {
    key: "red",
    tab: "05 TDD RED",
    command: "bun test ultrawork-demo.test.ts  # TDD red",
    status: "TDD red · failing-first proof captured",
    title: "The first proof is allowed to fail.",
    body: "A behavior change gets a RED proof before the fix. ULW treats a hollow test as non-evidence, so the failure has to match the user-facing contract.",
    composer: "TDD Executor captured RED for the right reason; Executor can now make the smallest GREEN change.",
    sideTitle: "TDD red is a gate, not theater.",
    sideBody: "The run records the failing proof before production changes, then routes the fix to the right worker.",
    ledger: "criterion_failed G001 C001\nmessage=TDD red captured before fix",
    json: '{ "C001": { "status": "fail", "capturedEvidence": "TDD red" } }',
    lanes: ["root", "execute", "test"],
    proof: 4,
    elapsed: "3d 15h 48m",
  },
  {
    key: "green",
    tab: "06 GREEN",
    command: 'omo ulw-loop record-evidence --goal-id G001 --criterion-id C001 --status pass --evidence "GREEN unit proof + cleanup receipt"',
    status: "GREEN · criterion-scoped evidence is recorded",
    title: "GREEN lands only with recorded evidence.",
    body: "After the smallest fix, ULW records non-empty evidence against the exact criterion. The ledger entry is `evidence_captured`, not a vague done message.",
    composer: "Executor returned GREEN; root is recording C001 evidence before moving to real-surface QA.",
    sideTitle: "record-evidence is append-only proof.",
    sideBody: "The criterion now has status pass, capturedEvidence, capturedAt, and a ledger entry.",
    ledger: "evidence_captured G001 C001 status=pass\ncapturedEvidence=GREEN unit proof",
    json: '{ "C001": { "status": "pass", "capturedEvidence": "GREEN unit proof" } }',
    lanes: ["root", "execute", "test", "todo"],
    proof: 5,
    elapsed: "3d 19h 22m",
  },
  {
    key: "qa-retry",
    tab: "07 QA retry",
    command: "browser QA -> QA fail -> omo ulw-loop complete-goals --retry-failed",
    status: "QA fail · retry the same criterion until the surface passes",
    title: "Manual QA can send the work back.",
    body: "Tests prove the unit contract; browser/manual QA proves the real surface. If QA fails, ULW records failure evidence, retries the goal, and keeps the loop moving.",
    composer: "QA Executor found a real-surface mismatch; root records goal_failed and resumes with --retry-failed.",
    sideTitle: "QA fail is part of the loop.",
    sideBody: "The demo should show retry, not pretend the first pass is final.",
    ledger: "goal_failed G001 evidence=QA fail\ncriterion_failed C002 real surface mismatch\ngoal_retried G001 Attempt 2",
    json: '{ "status": "in_progress", "attempt": 2, "failureReason": "QA fail" }',
    lanes: ["root", "execute", "test", "qa", "continuation"],
    proof: 6,
    elapsed: "3d 22h 57m",
  },
  {
    key: "checkpoint",
    tab: "08 Checkpoint",
    command: 'omo ulw-loop checkpoint --goal-id G001 --status complete --evidence "manual QA + review + criteria evidence" --codex-goal-json .omo/evidence/get-goal-complete.json --quality-gate-json .omo/evidence/quality-gate.json',
    status: "Checkpoint · quality gate closes the story",
    title: "Done means the quality gate passes.",
    body: "The final story needs codeReview, manualQa, gateReview, iteration, criteriaCoverage, and artifact-backed evidence before checkpointing complete.",
    composer: "Root has code review, Manual QA screenshots, gate review, iteration proof, and criteria coverage.",
    sideTitle: "checkpoint --status complete is the close.",
    sideBody: "Only after the quality gate is clean does the run checkpoint the story and write aggregate completion evidence.",
    ledger: "evidence_captured C002/C003 status=pass\naggregate_completed G001\ncheckpoint --status complete",
    json: '{ "aggregateCompletion": { "status": "complete" }, "qualityGate": "clean" }',
    lanes: ["root", "qa", "review", "todo"],
    proof: 7,
    elapsed: "4d 2h 41m",
  },
] as const satisfies readonly UlwScene[];

export const ULW_DEMO_ENVIRONMENT: readonly (readonly [string, string])[] = [
  ["Changes", "scoped"],
  [".omo/ulw-loop", "ledger"],
  ["Mode", "ulw ulw ulw"],
] as const;

/* ---- v10 chat-replay timeline (derived — every string above is reused
   verbatim; the only new strings are the user ask, sourced from
   SITE_CONFIG.ultraworkExample at the consumer, and the mode flag that
   already ships in the window chrome). ---- */

export type UlwEntryKind = "mode" | "status" | "prose" | "tool" | "code";

export type UlwEntry = {
  readonly id: string;
  readonly kind: UlwEntryKind;
  readonly heading?: string;
  readonly text: string;
  readonly phase: number;
};

export const ULW_DEMO_TIMELINE: readonly UlwEntry[] = [
  { id: "mode", kind: "mode", text: "ULTRAWORK MODE ENABLED!", phase: 0 },
  ...ULW_DEMO_SCENES.flatMap((scene, phase) => [
    { id: `${scene.key}-status`, kind: "status" as const, text: scene.status, phase },
    { id: `${scene.key}-cmd`, kind: "code" as const, text: scene.command, phase },
    {
      id: `${scene.key}-prose`,
      kind: "prose" as const,
      heading: scene.title,
      text: scene.body,
      phase,
    },
    ...scene.ledger.split("\n").map((line, i) => ({
      id: `${scene.key}-tool-${i}`,
      kind: "tool" as const,
      text: line,
      phase,
    })),
    { id: `${scene.key}-json`, kind: "code" as const, text: scene.json, phase },
  ]),
];

/** Cadence of the replay: one appended entry per tick. */
export const ULW_DEMO_ENTRY_MS = 900;

/** Entries visible in the server-rendered opening state (ask + mode + first activity). */
export const ULW_DEMO_INITIAL_ENTRIES = 4;

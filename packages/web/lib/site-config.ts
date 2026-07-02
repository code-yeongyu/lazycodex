export const SITE_CONFIG = {
  installCommand: "npx lazycodex-ai install",
  installCommandAutonomous: "npx lazycodex-ai install --no-tui --codex-autonomous",
  installEquivalent: "npx --yes --package oh-my-openagent omo install --platform=codex",
  githubUrl: "https://github.com/code-yeongyu/lazycodex",
  githubStarsUrl: "https://github.com/code-yeongyu/lazycodex/stargazers",
  omoUrl: "https://github.com/code-yeongyu/oh-my-openagent",
  siteUrl: "https://lazycodex.ai",
  docsPath: "/docs",
  version: "v0.2.2",
  eyebrow: "A LIGHT PORT OF OMO'S HEPHAESTUS, FOR CODEX",
  wordmark: "LazyCodex",
  heroLineA: "The Hephaestus deep-worker agent, ported light into Codex.",
  heroLineB: {
    prefix: "A focused slice of ",
    slot: "OmO",
    suffix: " — goals not recipes, ",
    keyword: "verified completion",
    period: ".",
  },
  harnessPillars: ["goals not recipes", "parallel exploration", "verified completion"],
  ultraworkExample: "ulw add authentication",
  omoIntro: {
    kicker: "Where it comes from",
    title: "A light port of OmO's Hephaestus",
    body: "OmO is the full agent harness — a primary orchestrator, a deep worker, specialist agents, multi-model routing, and dozens of lifecycle hooks. LazyCodex does not ship all of that. It ports one role, Hephaestus, into Codex as a focused, repeatable setup: the deep worker plus the workflows that keep its runs honest.",
    omoLabel: "OmO — the full harness",
    omoPoints: [
      "Sisyphus orchestrator with boulder.json session continuity",
      "Hephaestus deep worker + specialist agents",
      "54+ lifecycle hooks, multi-model routing, team mode",
    ],
    lazyLabel: "LazyCodex — the Hephaestus port",
    lazyPoints: [
      "Hephaestus only: goals, not step-by-step recipes",
      "$ulw-plan / $start-work / $ulw-loop workflows",
      "Skills, hooks, and verification defaults for Codex",
    ],
  },
  hephaestus: {
    badge: "Deep Worker",
    title: "Hephaestus",
    headline: "Give it a goal, not a recipe",
    description:
      "Named after the Greek god of the forge. Methodical, thorough, obsessive. Fires parallel explore subagents before writing any code, then runs a tight loop until the work is proven. Built for deep architectural reasoning, complex debugging, and cross-domain synthesis.",
    loop: [
      { step: "Explore", text: "Map the terrain — read with tools, never speculate." },
      { step: "Plan", text: "Chart the course — files to change, specific edits, dependencies." },
      { step: "Implement", text: "Build with precision — surgical edits that match codebase style." },
      { step: "Verify", text: "Prove it works — LSP diagnostics, tests, build, in parallel." },
      { step: "Manually QA", text: "Drive the real surface — HTTP, tmux, browser — then report." },
    ],
    tagline: "For when good enough isn't.",
  },
  featureWorkflows: {
    kicker: "What LazyCodex wires into Codex",
    title: "Harness the whole codebase",
    intro:
      "LazyCodex installs OmO as a serious agent harness for complex repositories: project memory, planning, execution, skills, hooks, model routing, and verification defaults in one pass.",
    points: [
      {
        label: "Context that survives",
        text: "$init-deep generates hierarchical AGENTS.md context so agents start from local guidance before touching a large repository.",
      },
      {
        label: "Plans before edits",
        text: "$ulw-plan turns ambiguous work into a decision-complete plan, then $start-work executes it with durable progress tracking.",
      },
      {
        label: "Evidence at the end",
        text: "$ulw-loop keeps complex work moving until the completion promise is backed by verification, not a hopeful status update.",
      },
    ],
  },
  builtInSkills: {
    title: "Built-in skill coverage",
    summary:
      "Skills auto-activate when a task matches their domain, so you do not need to study every one first. Add a skill name to your prompt when you want to call it explicitly; ulw-research is the maximum-saturation mode for deep codebase, web, official-docs, and OSS-repo research.",
    skills: ["ulw-research", "review-work", "remove-ai-slops", "frontend", "programming", "visual-qa", "LSP", "AST-grep"],
  },
  // Copy grounded in content/docs/ultrawork.md and ulw-loop.md — see .omo/evidence/copy-ledger.md.
  ulwDemo: {
    kicker: "Ultrawork, live",
    title: "Watch an ultrawork run close the loop",
    intro:
      "Include ultrawork (or the short alias ulw) anywhere in your prompt and the harness switches to maximum-precision, outcome-first, evidence-driven orchestration. An agent saying it is done does not mean the work is done — the work is done when observable evidence verifies it.",
    quote: "Plan, execute, verify, and keep the evidence attached.",
  },
  // Copy grounded in plugins/omo/skills/teammode/SKILL.md — see .omo/evidence/copy-ledger.md.
  teamMode: {
    kicker: "Team Mode",
    title: "Run a named team of cooperating Codex threads",
    body: "One leader, durable state on disk. The main session is always the team leader: it splits the work and assigns each slice, holds live situational awareness of every member, verifies and QAs what they deliver, relays findings between members, and synthesizes the result.",
    compositionRule:
      "Members are defined by a concrete part, ownership area, or perspective — never a vague job role.",
    whenTitle: "When a team beats plain subagents",
    whenPoints: [
      "The work does not split into perfectly isolated pieces, but doing it in parallel is clearly more convenient — members need to see and react to each other's findings.",
      "One task still needs exploration, yet its goal is already clear — parallel investigation under a fixed objective.",
    ],
    stateNote:
      "A bundled cross-platform script writes the .omo/teams state plus an auto-generated member field manual.",
    threadNote: "Sent by Codex from another thread",
    memberThreads: [
      { name: "Triage feature and question issues", status: "running" },
      { name: "Review PR readiness", status: "running" },
      { name: "Triage LazyCodex issues", status: "reported" },
      { name: "Triage runtime bug reports", status: "reported" },
    ],
  },
  // Copy grounded in plugins/omo/skills/ulw-research/SKILL.md — see .omo/evidence/copy-ledger.md.
  ulwResearch: {
    kicker: "$ulw-research",
    title: "Maximum-saturation research orchestration",
    body: "Parallel explore and librarian swarms across the codebase, web, official docs, and OSS repos; a recursive expand loop driven by the leads workers return; empirical verification by running code; cited synthesis and optional reports.",
    activation:
      "Activates only on an explicit demand for research — say ulw-research or any ulw research wording in your prompt. While active, exhaustive coverage is the goal.",
    lanes: ["codebase", "web", "official docs", "OSS repos"],
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;

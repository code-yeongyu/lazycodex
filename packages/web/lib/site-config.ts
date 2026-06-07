export const SITE_CONFIG = {
  installCommand: "npx lazycodex-ai install",
  installCommandAutonomous: "npx lazycodex-ai install --no-tui --codex-autonomous",
  installEquivalent: "npx --yes --package oh-my-openagent omo install --platform=codex",
  githubUrl: "https://github.com/code-yeongyu/lazycodex",
  githubStarsUrl: "https://github.com/code-yeongyu/lazycodex/stargazers",
  omoUrl: "https://github.com/code-yeongyu/oh-my-openagent",
  sisyphusUrl: "https://sisyphuslabs.ai",
  siteUrl: "https://lazycodex.ai",
  docsPath: "/docs",
  eyebrow: "AGENT HARNESS FOR COMPLEX CODEBASES",
  wordmark: "LazyCodex",
  heroLineA: "The one and only agent harness for complex codebases.",
  heroLineB: {
    prefix: "Project memory, ",
    slot: "planning,",
    suffix: " execution, and ",
    keyword: "verified completion",
    period: ".",
  },
  harnessPillars: ["project memory", "planning", "parallel agents", "verified completion"],
  ultraworkTagline: "ultrawork turns the harness into a verified run.",
  ultraworkExample: "ulw add authentication",
  featureWorkflows: {
    kicker: "What LazyCodex wires into Codex",
    title: "Harness the whole codebase",
    intro:
      "LazyCodex installs OmO as a serious agent harness for complex repositories: project memory, planning, execution, skills, hooks, model routing, and verification defaults in one pass.",
    points: [
      {
        label: "Context that survives",
        text: "/init-deep generates hierarchical AGENTS.md context so agents start from local guidance before touching a large repository.",
      },
      {
        label: "Plans before edits",
        text: "$ulw-plan turns ambiguous work into a decision-complete plan, then $start-work executes it with durable Boulder progress and blocks completion on the global review/debugging gate.",
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
      "Skills give the harness specialist judgment for review, cleanup, UI, strict language work, LSP diagnostics, AST-grep rewrites, project rules, and comment-checker feedback.",
    skills: ["review-work", "remove-ai-slops", "frontend-ui-ux", "programming", "LSP", "AST-grep", "rules", "comment-checker"],
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;

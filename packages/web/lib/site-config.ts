export const SITE_CONFIG = {
  installCommand: "bunx lazycodex-ai install",
  installCommandAutonomous: "bunx lazycodex-ai install --no-tui --codex-autonomous",
  installEquivalent: "bunx --package oh-my-openagent omo install --platform=codex",
  githubUrl: "https://github.com/code-yeongyu/lazycodex",
  githubStarsUrl: "https://github.com/code-yeongyu/lazycodex/stargazers",
  omoUrl: "https://github.com/code-yeongyu/oh-my-openagent",
  sisyphusUrl: "https://sisyphuslabs.ai",
  siteUrl: "https://lazycodex.ai",
  docsPath: "/docs",
  eyebrow: "CODEX FOR NO-BRAINERS",
  wordmark: "LazyCodex AI",
  heroLineA: "You don't need to ultrathink.",
  heroLineB: {
    prefix: "Just prompt ",
    slot: "{your prompt}",
    suffix: " ",
    keyword: "ultrawork",
    period: ".",
  },
  ultraworkTagline: "One word. Every agent activates. Doesn't stop until done.",
  ultraworkExample: "ulw add authentication",
} as const;

export type SiteConfig = typeof SITE_CONFIG;

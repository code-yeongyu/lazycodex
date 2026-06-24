export type DocSectionId =
  | "overview"
  | "installation"
  | "getting-started"
  | "init-deep"
  | "ulw-plan"
  | "start-work"
  | "ulw-loop"
  | "ultrawork"
  | "discipline-agents"
  | "model-routing"
  | "hooks-lifecycle"
  | "git-workflow"
  | "tdd"
  | "manual-qa"
  | "skills"
  | "configuration"
  | "deploy"
  | "cli";

export type DocSection = {
  readonly id: DocSectionId;
  readonly file: string;
  readonly title: string;
  readonly group: string;
};

// Ordered list of sidebar groups. Each group renders as a category header with
// its sections nested underneath, matching the lzx.vibetip.help docs layout.
export const DOC_GROUPS: readonly string[] = [
  "Install",
  "Getting started",
  "Commands",
  "Skills",
  "Concepts",
  "Reference",
];

export const DOC_SECTIONS: readonly DocSection[] = [
  { id: "installation", file: "installation.md", group: "Install", title: "Installation" },
  { id: "overview", file: "overview.md", group: "Getting started", title: "Overview" },
  { id: "getting-started", file: "getting-started.md", group: "Getting started", title: "Getting started" },
  { id: "init-deep", file: "init-deep.md", group: "Commands", title: "$init-deep" },
  { id: "ulw-plan", file: "ulw-plan.md", group: "Commands", title: "$ulw-plan" },
  { id: "start-work", file: "start-work.md", group: "Commands", title: "$start-work" },
  { id: "ulw-loop", file: "ulw-loop.md", group: "Commands", title: "$ulw-loop" },
  { id: "skills", file: "skills.md", group: "Skills", title: "Feature coverage" },
  { id: "ultrawork", file: "ultrawork.md", group: "Concepts", title: "ultrawork mode" },
  { id: "discipline-agents", file: "discipline-agents.md", group: "Concepts", title: "Hephaestus" },
  { id: "model-routing", file: "model-routing.md", group: "Concepts", title: "Multi-model routing" },
  { id: "hooks-lifecycle", file: "hooks-lifecycle.md", group: "Concepts", title: "Hooks & Lifecycle" },
  { id: "git-workflow", file: "git-workflow.md", group: "Concepts", title: "Git workflow" },
  { id: "tdd", file: "tdd.md", group: "Concepts", title: "TDD" },
  { id: "manual-qa", file: "manual-qa.md", group: "Concepts", title: "Manual QA" },
  { id: "configuration", file: "configuration.md", group: "Reference", title: "Configuration" },
  { id: "deploy", file: "deploy.md", group: "Reference", title: "Deploy" },
  { id: "cli", file: "cli.md", group: "Reference", title: "CLI" },
] as const;

export const DOC_SECTION_IDS = DOC_SECTIONS.map((s) => s.id);

export function sectionsByGroup(group: string): readonly DocSection[] {
  return DOC_SECTIONS.filter((s) => s.group === group);
}

export function neighborSections(id: DocSectionId): {
  prev: DocSection | undefined;
  next: DocSection | undefined;
} {
  const index = DOC_SECTIONS.findIndex((s) => s.id === id);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? DOC_SECTIONS[index - 1] : undefined,
    next: index < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[index + 1] : undefined,
  };
}

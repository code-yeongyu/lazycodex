// Build-time docs pipeline: compiles content/docs/*.md to HTML and emits a
// generated TS module. Run via package.json prebuild/predev, or directly:
//   node ./scripts/generate-docs-content.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Marked } from "marked";

// Fixed, ordered section list. Key = output map key (the markdown file name).
// Grouped for the sidebar: Install / Getting started / Commands / Skills /
// Concepts / Reference.
const SECTIONS = [
  { id: "overview", file: "overview.md", group: "Getting started", title: "Overview" },
  { id: "installation", file: "installation.md", group: "Install", title: "Installation" },
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
];

const DOCS_ROOT = path.resolve(process.cwd(), "content", "docs");
const OUTPUT = path.resolve(process.cwd(), "lib", "docs-content.generated.ts");
const BANNER =
  "// AUTO-GENERATED — do not edit. Run: node ./scripts/generate-docs-content.mjs\n";

// Heading/anchor slug: lowercase, spaces to "-", drop everything that is not
// an alphanumeric or hyphen, then collapse/trim hyphens. Hyphens survive so
// multi-word section ids (ulw-loop, start-work) keep their anchors.
function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Rewrite cross-doc links (./foo.md or bare foo.md) into same-page hash
// anchors (#foo). External, absolute, and in-page (#...) links pass through.
function rewriteDocsLink(href) {
  if (!href) return href;
  const isRelative = href.startsWith("./");
  const isBareMarkdown = /^[^/#?:]+\.md(?:#.*)?$/i.test(href);
  if (!isRelative && !isBareMarkdown) return href;

  const withoutPrefix = href.replace(/^\.\//, "");
  const [pathPart] = withoutPrefix.split("#", 1);
  if (!pathPart) return href;
  const base = path.posix.basename(pathPart).replace(/\.md$/i, "");
  return `#${slugify(base)}`;
}

function createMarked() {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    walkTokens(token) {
      if (token.type !== "link") return;
      token.href = rewriteDocsLink(token.href);
    },
  });
  return marked;
}

// Inject id attributes into <h2>/<h3> and collect a table of contents for the
// section. Done as a post-parse string transform so it is robust across marked
// versions (no renderer API dependency).
function uniqueSlug(base, usedIds) {
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let suffix = 2;
  while (usedIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  const unique = `${base}-${suffix}`;
  usedIds.add(unique);
  return unique;
}

function injectHeadingIds(html, sectionId) {
  const usedIds = new Set([sectionId]);
  const toc = [];
  const withIds = html.replace(/<(h[23])>(.*?)<\/\1>/g, (match, tag, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const baseId = slugify(text);
    if (!baseId) return match;
    const id = uniqueSlug(baseId, usedIds);
    const level = tag === "h2" ? 2 : 3;
    toc.push({ level, id, text });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
  return { withIds, toc };
}

const sources = {};
const tocs = {};
for (const section of SECTIONS) {
  const markdown = await readFile(path.join(DOCS_ROOT, section.file), "utf8");
  // JSON.stringify (below) escapes backticks/${} safely — never template strings.
  const rawHtml = await createMarked().parse(markdown);
  const { withIds, toc } = injectHeadingIds(rawHtml, section.id);
  sources[section.file] = withIds;
  tocs[section.file] = toc;
}

const out =
  `${BANNER}` +
  `export const DOC_SOURCES: Record<string, string> = ${JSON.stringify(sources, null, 2)};\n\n` +
  `export type DocHeading = { level: number; id: string; text: string };\n` +
  `export const DOC_TOC: Record<string, DocHeading[]> = ${JSON.stringify(tocs, null, 2)};\n`;

async function outputIsCurrent(content) {
  try {
    return (await readFile(OUTPUT, "utf8")) === content;
  } catch {
    return false;
  }
}

if (await outputIsCurrent(out)) {
  process.stdout.write(`Docs content already current with ${SECTIONS.length} HTML-compiled docs\n`);
} else {
  await writeFile(OUTPUT, out);
  process.stdout.write(`Generated ${OUTPUT} with ${SECTIONS.length} HTML-compiled docs\n`);
}

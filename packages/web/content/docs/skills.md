LazyCodex is most useful as a harness for complex codebases: project memory, planning, execution, verified completion, skills, hooks, model routing, and diagnostics.

### Built-in workflows

Start with `/init-deep` when the repository is too large or too old to explain from memory. It generates hierarchical `AGENTS.md` context so agents can find the right files before they change code.

Use `$ulw-plan` when the work needs decisions before implementation, `$start-work` when a plan should be executed through a final review/debugging gate, and `$ulw-loop` when you want the agent to keep going until the result is verified.

### Feature coverage

The three command pillars stay simple:

- `$ulw-loop` keeps moving until verified completion
- `$ulw-plan` turns fuzzy work into a decision-complete plan
- `$start-work` executes a plan with durable Boulder progress, post-implementation review, and a debugging gate

Skills add specialist judgment around those pillars:

| Skill | Use it for |
| --- | --- |
| `review-work` | Multi-angle post-implementation review that blocks completion when any lane fails or is inconclusive |
| `remove-ai-slops` | Behavior-preserving cleanup of AI-looking code |
| `frontend-ui-ux` | Designed UI work instead of generic layout filling |
| `programming` | Strict TypeScript, Rust, Python, or Go discipline |
| `LSP` | Diagnostics, definitions, references, symbols, and renames |
| `AST-grep` | Structural search and rewrite across code |
| `rules` | Project instructions from AGENTS, rules, and instruction files |
| `comment-checker` | Feedback after edit-like operations |

### Where skills live

OmO can load skills from project and user locations such as `.opencode/skills`, `~/.config/opencode/skills`, `.claude/skills`, `.agents/skills`, and `~/.agents/skills`.

LazyCodex installs the Codex Light setup with:

```bash
npx lazycodex-ai install
```

That installer wires the Codex marketplace plugin as `omo@sisyphuslabs` while keeping the public package alias easy to remember.

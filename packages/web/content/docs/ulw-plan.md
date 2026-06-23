`$ulw-plan` is the strategic planning consultant (Prometheus). It turns an idea into a decision-complete work plan. It is a planner, NOT an implementer. When you say "do X" it produces a plan for X and never writes product code.

### The flow

1. **Socratic interview** — ask only the forks that exploration cannot resolve. When intent is fuzzy, research to best practice instead of interrogating.
2. **Parallel codebase exploration** — fan out read-only subagents to ground every decision in the actual code, never in memory.
3. **Metis gap analysis** — name every unknown the plan depends on and either close it or surface it as an explicit fork.
4. **Write the plan** to `plans/<slug>.md` — one decision-complete plan a worker executes with zero further interview.
5. **Optional Momus high-accuracy review** — an adversarial pass that tries to break the plan before it ships.

### Output

Questions, research, and a work plan whose every todo carries references, acceptance criteria, a QA plan, and a commit boundary. The plan records `status: awaiting-approval` and waits — it never begins execution itself.

### Handoff

Once you approve, hand the plan to [`$start-work`](./start-work.md), which executes it against durable Boulder state with the five evidence gates.

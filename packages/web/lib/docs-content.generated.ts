// AUTO-GENERATED — do not edit. Run: node ./scripts/generate-docs-content.mjs
export const DOC_SOURCES: Record<string, string> = {
  "overview.md": "<p>LazyCodex is a light port of <a href=\"https://github.com/code-yeongyu/oh-my-openagent\">OmO</a> into Codex. It does not ship the full harness — it ports one role, <strong>Hephaestus</strong>, the autonomous deep worker, and the workflows that keep its runs honest. Think <a href=\"https://github.com/LazyVim/LazyVim\">LazyVim</a> for <a href=\"https://github.com/folke/lazy.nvim\">lazy.nvim</a>, but for Codex.</p>\n<h3 id=\"where-it-comes-from\">Where it comes from</h3>\n<p>OmO is the full agent harness: a primary orchestrator (Sisyphus) with <code>.omo/boulder.json</code> session continuity, a deep worker (Hephaestus), specialist agents, multi-model routing, 54+ lifecycle hooks, and team mode. That is a lot. LazyCodex takes only the piece that matters for a focused Codex setup and packages it as a repeatable install.</p>\n<h3 id=\"what-you-get\">What you get</h3>\n<p>The Hephaestus deep worker, ported into Codex with:</p>\n<ul>\n<li>Goal-oriented execution — you give it objectives, not step-by-step recipes.</li>\n<li>A tight operating loop: <strong>Explore → Plan → Implement → Verify → Manually QA</strong>.</li>\n<li>Parallel explore subagents so it maps the terrain before writing anything.</li>\n<li>The <code>$ulw-plan</code>, <code>$start-work</code>, and <code>$ulw-loop</code> workflows that keep complex work moving until it is verified.</li>\n<li>Skills, hooks, model routing, and verification defaults wired into Codex in one pass.</li>\n</ul>\n<h3 id=\"the-harness-workflow\">The harness workflow</h3>\n<p>Use <code>{your prompt} ultrawork</code> when the job needs the deep worker to run as one coordinated, evidence-bound loop instead of a single turn.</p>\n<h3 id=\"how-it-fits-together\">How it fits together</h3>\n<p>LazyCodex is a thin distribution layer over <a href=\"https://github.com/code-yeongyu/oh-my-openagent\">OmO</a>. The core engine is OmO; LazyCodex packages OmO&#39;s Hephaestus for Codex.</p>\n<p>Credit: The LazyCodex name idea is inspired by <a href=\"https://github.com/LazyVim/LazyVim\">LazyVim</a>. The Ultragoal and UltraQA ideas are inspired by <a href=\"https://github.com/Yeachan-Heo/oh-my-codex\">oh-my-codex</a>, reimplemented from concept for this Codex setup.</p>\n<ul>\n<li><a href=\"https://github.com/code-yeongyu/lazycodex\">LazyCodex on GitHub</a></li>\n<li><a href=\"https://github.com/code-yeongyu/oh-my-openagent\">OmO on GitHub</a></li>\n</ul>\n",
  "installation.md": "<p>One command installs the OmO agent harness for Codex without a global package install.</p>\n<h3 id=\"install\">Install</h3>\n<pre><code class=\"language-bash\">npx lazycodex-ai install\n</code></pre>\n<p>This is exactly equivalent to <code>npx --yes --package oh-my-openagent omo install --platform=codex</code>.</p>\n<h3 id=\"autonomous-one-liner\">Autonomous one-liner</h3>\n<pre><code class=\"language-bash\">npx lazycodex-ai install --no-tui --codex-autonomous\n</code></pre>\n<h3 id=\"prerequisites\">Prerequisites</h3>\n<ul>\n<li><a href=\"https://nodejs.org\">Node.js</a> — any maintained LTS; <code>npx</code> ships with it. Bun is <strong>not</strong> required: the installer runs on plain Node.</li>\n<li>The <a href=\"https://github.com/openai/codex\">OpenAI Codex CLI</a></li>\n</ul>\n<blockquote>\n<p>Do NOT use <code>npm install -g</code> or <code>bun add -g</code>. Always invoke via <code>npx</code>.</p>\n</blockquote>\n<h3 id=\"install-from-the-codex-marketplace-experimental\">Install from the Codex marketplace (experimental)</h3>\n<p>The npx installer above stays the primary path. As an additive, experimental alternative you can install from inside Codex itself: type <code>/plugins</code>, open the <strong>Add Marketplace</strong> tab (&quot;Add a marketplace from a Git repo or local root.&quot;), and enter <code>https://github.com/code-yeongyu/lazycodex</code>, then install <code>omo</code> from the <code>sisyphuslabs</code> marketplace. Or from the CLI:</p>\n<pre><code class=\"language-bash\">codex plugin marketplace add https://github.com/code-yeongyu/lazycodex\ncodex plugin add omo@sisyphuslabs\n</code></pre>\n<p>On the next launch, approve the omo hooks in Codex&#39;s startup review — hooks never run before approval. The first approved session prints <code>LazyCodex bootstrap running in background — restart the session when it completes</code> while a background worker finishes the setup (config blocks, agent roles, bin links, a pinned <code>sg</code> binary for the <code>ast_grep</code> MCP); restart when it is done. The marketplace path never touches Codex permission settings — autonomous mode remains the explicit <code>npx lazycodex-ai install --no-tui --codex-autonomous</code> choice.</p>\n<p>Upgrade with <code>codex plugin marketplace upgrade sisyphuslabs</code>. The next startup review shows the hooks as <strong>Modified</strong> — expected after every upgrade, because the plugin files changed and the previous trust hashes no longer match — re-approve them and the following session re-runs bootstrap on the new version. If anything looks pending or degraded, <code>npx lazycodex-ai doctor</code> explains what and why.</p>\n<h3 id=\"windows\">Windows</h3>\n<p>Native Windows works with both install paths.</p>\n<ul>\n<li><strong>Node:</strong> <code>npx lazycodex-ai install</code> needs Node.js on <code>PATH</code> (LTS recommended). On marketplace installs the bootstrap step provisions a pinned Node LTS runtime into <code>%USERPROFILE%\\.codex\\runtime\\node\\</code> automatically when <code>node</code> is missing — installing Node yourself first also works and skips the download.</li>\n<li><strong>Git Bash:</strong> required for shell hooks. The installer and the marketplace bootstrap both try <code>winget install --id Git.Git -e --source winget</code> when Git Bash is missing. If Git lives somewhere custom, set <code>OMO_CODEX_GIT_BASH_PATH</code> to a path like <code>C:\\Program Files\\Git\\bin\\bash.exe</code>.</li>\n<li><strong><code>where bash</code> shows <code>C:\\Windows\\System32\\bash.exe</code>:</strong> that is the WSL launcher, not Git Bash — LazyCodex intentionally ignores <code>System32</code> and <code>WindowsApps</code> <code>bash.exe</code> shims when resolving Git Bash. Install Git for Windows or point <code>OMO_CODEX_GIT_BASH_PATH</code> at a real Git Bash so the resolver finds it.</li>\n<li><strong>Troubleshooting:</strong> the Windows marketplace bootstrap writes a transcript to <code>%USERPROFILE%\\.codex\\plugins\\data\\omo-sisyphuslabs\\bootstrap\\ps-bootstrap.log</code>; degraded lines look like <code>degraded component=node reason=... hint=npx lazycodex-ai doctor</code>. Run <code>npx lazycodex-ai doctor</code> for the full health report.</li>\n</ul>\n<h3 id=\"let-an-agent-do-it\">Let an agent do it</h3>\n<p>It is strongly recommended to let an LLM agent run the install and walk the setup for you. The agent handles subscription detection, model selection, and provider auth automatically.</p>\n",
  "getting-started.md": "<p>LazyCodex is most useful as a harness for complex codebases: project memory, planning, execution, verified completion, skills, hooks, model routing, and diagnostics. This page walks through the four commands you will reach for most often and when to pick each.</p>\n<h3 id=\"the-four-commands\">The four commands</h3>\n<table>\n<thead>\n<tr>\n<th>Command</th>\n<th>Use it when</th>\n</tr>\n</thead>\n<tbody><tr>\n<td><code>$init-deep</code></td>\n<td>The repository is too large or too old to explain from memory.</td>\n</tr>\n<tr>\n<td><code>$ulw-plan</code></td>\n<td>The work needs decisions before any code is written.</td>\n</tr>\n<tr>\n<td><code>$start-work</code></td>\n<td>A plan exists and should be executed to completion.</td>\n</tr>\n<tr>\n<td><code>$ulw-loop</code></td>\n<td>You want the agent to keep going until the result is verified.</td>\n</tr>\n</tbody></table>\n<h3 id=\"how-to-choose\">How to choose</h3>\n<p>Start with <code>$init-deep</code> once per repository so agents have hierarchical <code>AGENTS.md</code> context to work from.</p>\n<p>For anything ambiguous, run <code>$ulw-plan</code> first. It interviews you, explores the codebase in parallel, and writes a decision-complete plan to <code>plans/&lt;slug&gt;.md</code> without touching product code.</p>\n<p>Hand that plan to <code>$start-work</code> to execute it: durable Boulder state, parallel subagents, strict TDD, and five evidence gates. It prints <code>ORCHESTRATION COMPLETE</code> when every checkbox is done.</p>\n<p><code>$ulw-loop</code> is the tightest loop — use it for a single task that must run until an oracle verifies completion. It does not plan; it executes and verifies.</p>\n<h3 id=\"a-typical-session\">A typical session</h3>\n<pre><code class=\"language-text\">$init-deep\n$ulw-plan &quot;add rate limiting to the api gateway&quot;\n$start-work plans/add-rate-limiting.md\n</code></pre>\n<p>If the job is small and well-understood, skip the plan and loop directly:</p>\n<pre><code class=\"language-text\">ulw fix the flaky checkout test\n</code></pre>\n<p>See <a href=\"#skills\">Feature coverage</a> for the skills that add specialist judgment around these commands.</p>\n",
  "init-deep.md": "<p><code>$init-deep</code> generates hierarchical <code>AGENTS.md</code> context so agents start from local guidance before touching a large repository. Run it once per project, and again whenever the architecture shifts enough that the existing context no longer reflects reality.</p>\n<h3 id=\"what-it-produces\">What it produces</h3>\n<ul>\n<li>A root <code>AGENTS.md</code> that orients agents to the project: stack, layout, conventions, and where to look first.</li>\n<li>Nested <code>AGENTS.md</code> files in the directories that matter most, so an agent descending into a package gets scoped guidance instead of guessing.</li>\n<li>References to project rules, skills, and instruction files the harness should respect.</li>\n</ul>\n<h3 id=\"when-to-run-it\">When to run it</h3>\n<ul>\n<li>Onboarding a repository that is too large or too old to explain from memory.</li>\n<li>After a major refactor, migration, or layout change.</li>\n<li>When agents keep picking the wrong files or ignoring local conventions.</li>\n</ul>\n<h3 id=\"how-to-use-it\">How to use it</h3>\n<pre><code class=\"language-text\">$init-deep\n</code></pre>\n<p>The command walks the tree, reads the files that define how the project actually works, and writes the context. Review the generated <code>AGENTS.md</code> files, trim anything stale, and commit them. Agents in later turns read that context before they edit, so the first session pays for every session after it.</p>\n<h3 id=\"after-init\">After init</h3>\n<p>With context in place, move to <a href=\"#ulw-plan\"><code>$ulw-plan</code></a> when the work needs a plan, or <a href=\"#ulw-loop\"><code>$ulw-loop</code></a> for a single verified task.</p>\n",
  "ulw-plan.md": "<p><code>$ulw-plan</code> is the strategic planning consultant (Prometheus). It turns an idea into a decision-complete work plan. It is a planner, NOT an implementer. When you say &quot;do X&quot; it produces a plan for X and never writes product code.</p>\n<h3 id=\"the-flow\">The flow</h3>\n<ol>\n<li><strong>Socratic interview</strong> — ask only the forks that exploration cannot resolve. When intent is fuzzy, research to best practice instead of interrogating.</li>\n<li><strong>Parallel codebase exploration</strong> — fan out read-only subagents to ground every decision in the actual code, never in memory.</li>\n<li><strong>Metis gap analysis</strong> — name every unknown the plan depends on and either close it or surface it as an explicit fork.</li>\n<li><strong>Write the plan</strong> to <code>plans/&lt;slug&gt;.md</code> — one decision-complete plan a worker executes with zero further interview.</li>\n<li><strong>Optional Momus high-accuracy review</strong> — an adversarial pass that tries to break the plan before it ships.</li>\n</ol>\n<h3 id=\"output\">Output</h3>\n<p>Questions, research, and a work plan whose every todo carries references, acceptance criteria, a QA plan, and a commit boundary. The plan records <code>status: awaiting-approval</code> and waits — it never begins execution itself.</p>\n<h3 id=\"handoff\">Handoff</h3>\n<p>Once you approve, hand the plan to <a href=\"#start-work\"><code>$start-work</code></a>, which executes it against durable Boulder state with the five evidence gates.</p>\n",
  "start-work.md": "<p><code>$start-work</code> executes a Prometheus work plan until every top-level checkbox is done.</p>\n<h3 id=\"how-it-works\">How it works</h3>\n<ul>\n<li>Durable Boulder state in <code>.omo/boulder.json</code> survives across turns and sessions</li>\n<li>A Stop-hook re-injects the next turn until the plan is complete</li>\n<li>Independent sub-tasks fan out to parallel subagents</li>\n<li>Strict TDD plus five evidence gates: plan reread, automated verification, manual-QA, adversarial QA, cleanup</li>\n<li>Progress is recorded to a ledger</li>\n</ul>\n<h3 id=\"syntax\">Syntax</h3>\n<pre><code class=\"language-bash\">$start-work [plan-name] [--worktree &lt;absolute-path&gt;]\n</code></pre>\n<h3 id=\"done\">Done</h3>\n<p>It prints an <code>ORCHESTRATION COMPLETE</code> block when every checkbox is checked.</p>\n",
  "ulw-loop.md": "<p><code>$ulw-loop</code> is a self-referential development loop that decomposes work into systematic, evidence-bound steps and runs until verified completion.</p>\n<h3 id=\"how-it-works\">How it works</h3>\n<p>The agent works continuously and emits <code>&lt;promise&gt;DONE&lt;/promise&gt;</code> when it believes the task is complete, but that does NOT end the loop. An Oracle must verify the result first. The loop ends only after the system confirms the Oracle verified it. If verification fails, it continues with the message: &quot;Oracle verification failed. Continuing ULTRAWORK loop.&quot;</p>\n<p>Each step carries its own evidence: a real artifact, not a dry-run claim. Progress is checkpointed, so a long run survives restarts without losing what was already proven.</p>\n<h3 id=\"bootstrap\">Bootstrap</h3>\n<p>Before the first run, the loop reads its full workflow reference (Bootstrap tier triage, the Execution Loop, and the Manual-QA channels table) so every later phase executes the same way. It only reads the sections the current phase needs.</p>\n<h3 id=\"manual-qa-channels\">Manual-QA channels</h3>\n<p>A step does not close on a status string. It closes on a captured artifact from a real surface — an HTTP call, a tmux session, or a browser — plus an adversarial pass and a cleanup receipt. See <a href=\"#manual-qa\">manual QA</a>.</p>\n<h3 id=\"syntax\">Syntax</h3>\n<pre><code class=\"language-bash\">$ulw-loop &quot;task description&quot; [--completion-promise=TEXT] [--strategy=reset|continue]\n</code></pre>\n<h3 id=\"limits\">Limits</h3>\n<p>The iteration cap is 500 in ultrawork mode (100 in normal mode).</p>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#ultrawork\">ultrawork mode</a> — the mode that turns the loop into a binding verified run.</li>\n<li><a href=\"#hooks-lifecycle\">Hooks &amp; Lifecycle</a> — how the Stop-hook re-injects the next turn.</li>\n</ul>\n",
  "ultrawork.md": "<p>ultrawork is the headline mode. Typing <code>ultrawork</code> (or the short alias <code>ulw</code>) anywhere in your prompt activates maximum-precision, outcome-first, evidence-driven orchestration.</p>\n<blockquote>\n<p>&quot;Plan, execute, verify, and keep the evidence attached.&quot;</p>\n</blockquote>\n<h3 id=\"usage\">Usage</h3>\n<pre><code class=\"language-bash\">ulw add authentication\n</code></pre>\n<h3 id=\"what-it-enforces\">What it enforces</h3>\n<ul>\n<li>Strict TDD: RED → GREEN → SURFACE → CLEAN</li>\n<li>At least 3 realistic QA scenarios</li>\n<li>Real manual-QA channels (HTTP call, tmux, browser)</li>\n<li>A binding verification gate that loops until the work is genuinely done</li>\n</ul>\n",
  "discipline-agents.md": "<p>LazyCodex ports a single discipline agent from OmO into Codex: <strong>Hephaestus</strong>, the autonomous deep worker. There is no Sisyphus orchestrator in the Codex package — Hephaestus is the one role, and it carries the whole run itself with read-only subagents for parallel exploration.</p>\n<h3 id=\"what-hephaestus-is\">What Hephaestus is</h3>\n<p>Named after the Greek god of the forge. Goal-oriented: you give it objectives, not step-by-step recipes, and it executes them end-to-end. &quot;The Legitimate Craftsman.&quot; Methodical, thorough, obsessive — built for deep architectural reasoning, complex debugging, and cross-domain synthesis.</p>\n<h3 id=\"the-operating-loop\">The operating loop</h3>\n<p>Hephaestus runs a short, tight loop on every unit of work:</p>\n<ol>\n<li><strong>Explore</strong> — map the terrain. Read the code with tools, never speculate. Fire 2-5 parallel explore subagents before writing anything.</li>\n<li><strong>Plan</strong> — chart the course. Record files to modify, specific changes, and dependencies via <code>update_plan</code>.</li>\n<li><strong>Implement</strong> — build with precision. Surgical edits that match codebase style (naming, indentation, imports, error handling) even when a greenfield would read differently.</li>\n<li><strong>Verify</strong> — prove it works. LSP diagnostics on changed files, related tests, and build — in parallel where possible.</li>\n<li><strong>Manually QA</strong> — drive the artifact through its real surface (HTTP call, tmux, browser), then write the final message.</li>\n</ol>\n<h3 id=\"what-it-never-does\">What it never does</h3>\n<ul>\n<li><strong>Never trusts subagent self-reports.</strong> Verification is independent; a child saying &quot;done&quot; does not close the work.</li>\n<li><strong>Never proposes when you asked for code.</strong> Unless you explicitly want a plan or a brainstorm, it implements.</li>\n<li><strong>Never speculates about code it has not read.</strong> Exploration is cheap; assumption is expensive.</li>\n<li><strong>Never leaves work unresolved at end of turn.</strong> Every plan step is reconciled: <code>completed</code>, blocked (one-line reason), or removed (one-line reason).</li>\n</ul>\n<h3 id=\"delegation-not-orchestration\">Delegation, not orchestration</h3>\n<p>Hephaestus stays the parent. For parallel exploration it spawns read-only Codex subagent roles (<code>multi_agent_v1.spawn_agent</code>) and keeps the parent session live with brief status updates while children run. It does not hand the run off to a separate orchestrator — it owns the goal, delegates the grunt work, and verifies the results itself.</p>\n<h3 id=\"where-the-boulder-comes-from\">Where the boulder comes from</h3>\n<p>The full OmO has a second primary agent, <strong>Sisyphus</strong>, the orchestrator with <code>.omo/boulder.json</code> session continuity. The Codex package is the Hephaestus-only light port, so on Codex the durable progress state lives in <code>.omo/boulder.json</code> as written by <a href=\"#start-work\"><code>$start-work</code></a> and the Stop-hook continuation — without the Sisyphus orchestration layer.</p>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#ultrawork\">ultrawork mode</a> — the mode that turns the loop into a binding verified run.</li>\n<li><a href=\"#hooks-lifecycle\">Hooks &amp; Lifecycle</a> — how the Stop-hook re-injects the next turn until the plan is complete.</li>\n</ul>\n",
  "model-routing.md": "<p>Multi-model routing sends each part of a run to the model that fits it best, instead of running everything on one model. LazyCodex installs OmO&#39;s routing defaults into Codex so a serious repository is not bottlenecked by a single context window or price point.</p>\n<h3 id=\"what-gets-routed\">What gets routed</h3>\n<ul>\n<li><strong>Planning and exploration</strong> go to a strong reasoning model that can hold a large context and weigh trade-offs.</li>\n<li><strong>Implementation turns</strong> go to a fast, capable coding model for the bulk of the edit loop.</li>\n<li><strong>Verification</strong> goes to a model used as an oracle, chosen for judgment rather than throughput.</li>\n<li><strong>Specialist skills</strong> can target their own model when a skill benefits from a specific profile.</li>\n</ul>\n<h3 id=\"how-it-fits-the-harness\">How it fits the harness</h3>\n<p>Routing is part of the harness setup that <code>npx lazycodex-ai install</code> wires into Codex. It detects the available subscriptions and provider auth, then maps roles to models so you do not hand-configure each one.</p>\n<h3 id=\"provider-auth\">Provider auth</h3>\n<p>Auth targets Codex itself, not LazyCodex. Once Codex is logged in, the installer&#39;s subscription detection and provider routing take over. If you let an LLM agent run the install, it walks the same detection and selection for you.</p>\n<h3 id=\"customizing-it\">Customizing it</h3>\n<p>Routing and provider settings live in the configuration. See <a href=\"#configuration\">Configuration</a> for the fields that control which model handles which role, and how to override the defaults per project.</p>\n",
  "hooks-lifecycle.md": "<p>Hooks and lifecycle are how the harness keeps a long run moving without you re-prompting every turn. OmO installs lifecycle hooks into Codex that observe each turn and decide what happens next.</p>\n<h3 id=\"the-core-mechanism\">The core mechanism</h3>\n<p>A Stop-hook fires when a turn ends. If a plan is still in progress, the hook re-injects the next turn automatically — the agent continues from durable progress state instead of waiting for you to say &quot;continue&quot;. The run only stops when the plan is complete or a gate fails in a way that needs a human.</p>\n<h3 id=\"where-progress-lives\">Where progress lives</h3>\n<p>Progress state is written to <code>.omo/boulder.json</code> and survives across turns and sessions. That is what lets <a href=\"#start-work\"><code>$start-work</code></a> resume a plan after a restart, and what keeps <a href=\"#ulw-loop\"><code>$ulw-loop</code></a> honest about how far it has actually gotten.</p>\n<h3 id=\"approval-and-trust\">Approval and trust</h3>\n<p>Hooks never run before approval. On the first launch after install, Codex&#39;s startup review asks you to approve the omo hooks. After every upgrade the hooks show as <strong>Modified</strong> — expected, because the plugin files changed and the previous trust hashes no longer match — re-approve and the next session re-runs bootstrap on the new version.</p>\n<h3 id=\"evidence-gates\">Evidence gates</h3>\n<p>During execution the lifecycle enforces five evidence gates before a step can close: plan reread, automated verification, manual-QA, adversarial QA, and cleanup. A step that cannot pass its gates does not advance, regardless of what the status text claims.</p>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#ultrawork\">ultrawork mode</a> — the mode that turns these gates into a binding loop.</li>\n<li><a href=\"#configuration\">Configuration</a> — how to tune hook behavior and lifecycle defaults.</li>\n</ul>\n",
  "git-workflow.md": "<p>Git work runs through the <code>git-master</code> skill. It is exact, conservative, and evidence-led: the agent reads the repository state before it infers anything, and never commits, rebases, pushes, force-pushes, resets, or stash-pops unless you explicitly asked for that operation.</p>\n<h3 id=\"mode-gate\">Mode gate</h3>\n<p>Every request is classified first:</p>\n<ul>\n<li><code>COMMIT</code> — stage and commit local changes.</li>\n<li><code>REBASE</code> — rebase, squash, fixup, autosquash, reorder, or split branch history.</li>\n<li><code>HISTORY</code> — answer when, where, who, why, or which commit changed something.</li>\n<li><code>STATUS</code> — inspect branch, diff, or working-tree state without changing it.</li>\n</ul>\n<p>Investigative requests report findings and stop.</p>\n<h3 id=\"commit-mode\">Commit mode</h3>\n<p>Commits are atomic by behavior, module, and revertability. The agent detects message style from recent history (dominant pattern, language, casing — it does not default to Conventional Commits unless the repo uses them), inspects the full diff, and stages by path or hunk so each commit contains only its group. Implementation and its direct tests land together; unrelated concerns split into separate commits. Before each commit it verifies <code>git diff --staged --stat</code>; after, <code>git log -1 --oneline</code>.</p>\n<h3 id=\"rebase-and-merge\">Rebase and merge</h3>\n<p>History rewriting is a shared-impact operation. The agent never rebases or rewrites <code>main</code>, <code>master</code>, <code>dev</code>, release, or protected branches unless you named that exact operation. If commits may already be pushed, it asks before force-pushing and uses <code>--force-with-lease</code>, never plain <code>--force</code>. Conflicts are resolved by intent — never a blind ours/theirs. If a rebase goes wrong, <code>git rebase --abort</code> is the first move; the reflog is the recovery path, explained before use.</p>\n<h3 id=\"push-safety\">Push safety</h3>\n<p>Before any write to history: the current branch is known, dirty work is accounted for, upstream/pushed status is known or explicitly unknown, the operation matches your request, and the recovery path is known. Afterward it runs the cheapest relevant verification and leaves the worktree state explicit.</p>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#start-work\">start-work</a> — the executor that lands planned work as commits.</li>\n<li><a href=\"#manual-qa\">manual QA</a> — the gates a step passes before it is allowed to close.</li>\n</ul>\n",
  "tdd.md": "<p>Strict test-driven development is the discipline that lets the harness call work &quot;done&quot; without hoping. Every change follows the red → green → refactor loop, in that order. Reverse it and you have written speculative code.</p>\n<h3 id=\"the-order\">The order</h3>\n<ol>\n<li><strong>Red.</strong> Write a failing test that names the behavior in <code>Given / When / Then</code>. Run it. Confirm it fails for the right reason — not a typo or a missing import.</li>\n<li><strong>Green.</strong> Write the minimum code to make it pass. Resist the second case until the first passes; the second case is the next red.</li>\n<li><strong>Refactor.</strong> With the test green, restructure ruthlessly. If the test is hard to refactor against, the test is bad — fix it before the code.</li>\n</ol>\n<h3 id=\"the-test-pyramid\">The test pyramid</h3>\n<p>Every feature ships all three rungs: many fast units (pure-function correctness across happy, edge, boundary, and error paths, &lt; 10 ms each), some integrations against the real downstream via testcontainers or httptest (&lt; 1 s each), and a few E2E scenarios that drive the binary through its real surface and assert the observable outcome. A feature with zero E2E coverage is undone, even if every unit passes.</p>\n<h3 id=\"deterministic-or-it-is-broken\">Deterministic, or it is broken</h3>\n<p>A test that passes 9 of 10 times is failing 10% of the time. Forbidden in test bodies unless time itself is the system under test: <code>setTimeout(resolve, N)</code>, <code>await sleep(N)</code>, &quot;wait long enough for X&quot;. The replacement is subscribe-first, timeout-bound — register the listener before the trigger, then race against an explicit circuit breaker that fails with a useful message on timeout. The whole repo must pass <code>bun test</code> in one process, one go, no isolation flags, no retries.</p>\n<h3 id=\"prompt-tests-assert-behavior-not-text\">Prompt tests assert behavior, not text</h3>\n<p>When testing code that builds an LLM prompt, never pin the current wording (<code>toContain(&quot;You are Sisyphus&quot;)</code>, <code>toMatchSnapshot</code>, <code>toBe(EXPECTED_PROMPT)</code>). Assert the structural invariant the logic enforces — the conditional branch, the negative branch, the redaction, the skill inclusion/exclusion. Test what would break the behavior, never what would only break a diff.</p>\n<h3 id=\"the-five-evidence-gates\">The five evidence gates</h3>\n<p>During execution the lifecycle enforces five gates before a step can close: plan reread, automated verification, <a href=\"#manual-qa\">manual QA</a>, adversarial QA, and cleanup. A step that cannot pass its gates does not advance, regardless of what the status text claims.</p>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#ultrawork\">ultrawork mode</a> — the mode that makes the loop binding.</li>\n<li><a href=\"#start-work\">start-work</a> — where the five gates are enforced per checkbox.</li>\n</ul>\n",
  "manual-qa.md": "<p>Manual QA is the gate that turns &quot;it should work&quot; into &quot;it works, here is the proof&quot;. No step closes on a status string; it closes on a captured artifact from a real surface, plus an adversarial pass and a cleanup receipt. Two skills carry this: <code>visual-qa</code> for UI surfaces, <code>review-work</code> for whole-implementation review.</p>\n<h3 id=\"visual-qa\">visual-qa</h3>\n<p>For any UI you built or changed — web page or TUI — visual QA runs three phases. First it captures objective reference evidence with a bundled diff script: <code>image-diff</code> for screenshots (similarity score, hotspots, <code>alphaChannelIntact</code>), <code>tui-check</code> for terminal captures (<code>maxWidth</code>, <code>overflowLines</code>, <code>borderMisaligned</code>, wide-char columns). That JSON is reference, not the verdict.</p>\n<p>Then it dispatches two read-only oracle subagents in parallel:</p>\n<ul>\n<li><strong>Pass A — design-system and functional integrity.</strong> The deeper, stricter pass. Proves the surface is a real design-system implementation driven by coherent tokens and reused primitives, not a mock-only screen or a pasted raster faked as live elements. Checks alpha, responsiveness, and that the user-intended features actually work.</li>\n<li><strong>Pass B — visual fidelity and CJK precision.</strong> The focused pass. Opens the screenshots directly and inspects source/content for clipping, baseline drop, glyph breakage, and Korean/Japanese/Chinese precision.</li>\n</ul>\n<p>The harness synthesizes the two passes into one <code>PASS | REVISE | FAIL</code> verdict with located findings.</p>\n<h3 id=\"review-work\">review-work</h3>\n<p>After significant implementation, <code>review-work</code> launches five parallel background subagents. All five must pass for the review to pass; if one fails, the review fails.</p>\n<table>\n<thead>\n<tr>\n<th>Lane</th>\n<th>Role</th>\n<th>Asks</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>1</td>\n<td>Goal Verifier</td>\n<td>Did we build what was asked?</td>\n</tr>\n<tr>\n<td>2</td>\n<td>QA Executor</td>\n<td>Does it actually work?</td>\n</tr>\n<tr>\n<td>3</td>\n<td>Code Reviewer</td>\n<td>Is the code well-written?</td>\n</tr>\n<tr>\n<td>4</td>\n<td>Security Auditor</td>\n<td>Is it secure?</td>\n</tr>\n<tr>\n<td>5</td>\n<td>Context Miner</td>\n<td>Did we miss any context?</td>\n</tr>\n</tbody></table>\n<p>Oracle lanes receive the diff plus full file contents in the prompt (they cannot read files). A crashed, <code>BLOCKED:</code>, or inconclusive lane is never counted as a pass — it is respawned smaller, and if the retry budget is exhausted it stays <code>INCONCLUSIVE</code> while the aggregate result still emits.</p>\n<h3 id=\"adversarial-classes-and-cleanup\">Adversarial classes and cleanup</h3>\n<p>Within <a href=\"#start-work\"><code>$start-work</code></a>, every checkbox probes each applicable adversarial class and records the observable result for each; skipped classes need a one-line not-applicable reason in the ledger. Every QA resource — scripts, tmux assets, browser sessions, PIDs, ports, containers, temp dirs — is registered as its own teardown todo and executed with a captured receipt. No QA asset is left running.</p>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#tdd\">TDD</a> — the automated-verification gate that precedes manual QA.</li>\n<li><a href=\"#ulw-loop\">ulw-loop</a> — the loop whose completion depends on this gate.</li>\n</ul>\n",
  "skills.md": "<p>LazyCodex is most useful as a harness for complex codebases: project memory, planning, execution, verified completion, skills, hooks, model routing, and diagnostics.</p>\n<h3 id=\"built-in-workflows\">Built-in workflows</h3>\n<p>Start with <code>$init-deep</code> when the repository is too large or too old to explain from memory. It generates hierarchical <code>AGENTS.md</code> context so agents can find the right files before they change code.</p>\n<p>Use <code>$ulw-plan</code> when the work needs decisions before implementation, <code>$start-work</code> when a plan should be executed, and <code>$ulw-loop</code> when you want the agent to keep going until the result is verified.</p>\n<h3 id=\"feature-coverage\">Feature coverage</h3>\n<p>The three command pillars stay simple:</p>\n<ul>\n<li><code>$ulw-loop</code> keeps moving until verified completion</li>\n<li><code>$ulw-plan</code> turns fuzzy work into a decision-complete plan</li>\n<li><code>$start-work</code> executes a plan with durable Boulder progress</li>\n</ul>\n<p>Skills add specialist judgment around those pillars:</p>\n<table>\n<thead>\n<tr>\n<th>Skill</th>\n<th>Use it for</th>\n</tr>\n</thead>\n<tbody><tr>\n<td><code>init-deep</code></td>\n<td>Hierarchical <code>AGENTS.md</code> context for large or old repos</td>\n</tr>\n<tr>\n<td><code>ulw-plan</code></td>\n<td>Explore-first planning before coding</td>\n</tr>\n<tr>\n<td><code>ulw-loop</code></td>\n<td>Evidence-bound loop until verified completion</td>\n</tr>\n<tr>\n<td><code>start-work</code></td>\n<td>Execute a plan with durable Boulder progress</td>\n</tr>\n<tr>\n<td><code>review-work</code></td>\n<td>Five-lane parallel post-implementation review</td>\n</tr>\n<tr>\n<td><code>remove-ai-slops</code></td>\n<td>Behavior-preserving cleanup of AI-looking code</td>\n</tr>\n<tr>\n<td><code>frontend-ui-ux</code></td>\n<td>Designed UI work instead of generic layout filling</td>\n</tr>\n<tr>\n<td><code>programming</code></td>\n<td>Strict TypeScript, Rust, Python, or Go discipline, TDD-first</td>\n</tr>\n<tr>\n<td><code>git-master</code></td>\n<td>Atomic commits, rebase/squash, push safety, history investigation</td>\n</tr>\n<tr>\n<td><code>visual-qa</code></td>\n<td>Screenshot/TUI diff plus dual-oracle visual QA</td>\n</tr>\n<tr>\n<td><code>debugging</code></td>\n<td>Evidence-led root-cause investigation</td>\n</tr>\n<tr>\n<td><code>refactor</code></td>\n<td>Behavior-preserving restructure of existing code</td>\n</tr>\n<tr>\n<td><code>ultraresearch</code></td>\n<td>Deep multi-source research synthesis</td>\n</tr>\n<tr>\n<td><code>LSP</code></td>\n<td>Diagnostics, definitions, references, symbols, and renames</td>\n</tr>\n<tr>\n<td><code>lsp-setup</code></td>\n<td>Configure language servers for a project</td>\n</tr>\n<tr>\n<td><code>AST-grep</code></td>\n<td>Structural search and rewrite across code</td>\n</tr>\n<tr>\n<td><code>rules</code></td>\n<td>Project instructions from AGENTS, rules, and instruction files</td>\n</tr>\n<tr>\n<td><code>comment-checker</code></td>\n<td>Feedback after edit-like operations</td>\n</tr>\n</tbody></table>\n<p>The command pillars and the disciplines behind them are covered in depth: <a href=\"#ulw-plan\">ulw-plan</a>, <a href=\"#ulw-loop\">ulw-loop</a>, <a href=\"#start-work\">start-work</a>, <a href=\"#tdd\">TDD</a>, <a href=\"#manual-qa\">manual QA</a>, and <a href=\"#git-workflow\">git workflow</a>.</p>\n<h3 id=\"where-skills-live\">Where skills live</h3>\n<p>OmO can load skills from project and user locations such as <code>.opencode/skills</code>, <code>~/.config/opencode/skills</code>, <code>.claude/skills</code>, <code>.agents/skills</code>, and <code>~/.agents/skills</code>.</p>\n<p>LazyCodex installs the Codex Light setup with:</p>\n<pre><code class=\"language-bash\">npx lazycodex-ai install\n</code></pre>\n<p>That installer wires the Codex marketplace plugin as <code>omo@sisyphuslabs</code> while keeping the public package alias easy to remember.</p>\n",
  "configuration.md": "<p>LazyCodex is a thin distribution layer over <a href=\"https://github.com/code-yeongyu/oh-my-openagent\">OmO</a>. The configuration that the installer writes into Codex controls model routing, hooks, skills, and the agent roles the harness uses.</p>\n<h3 id=\"where-config-lives\">Where config lives</h3>\n<ul>\n<li>Codex configuration that the installer connects to.</li>\n<li>Project-level <code>AGENTS.md</code> and rule files that shape agent behavior per repository.</li>\n<li>User-level skill locations such as <code>~/.config/opencode/skills</code> and <code>~/.agents/skills</code>.</li>\n</ul>\n<h3 id=\"what-you-can-tune\">What you can tune</h3>\n<ul>\n<li><strong>Model routing</strong> — which model handles planning, implementation, verification, and specialist skills. The installer sets sensible defaults from your detected subscriptions; override per role when a project needs a different profile.</li>\n<li><strong>Hooks and lifecycle</strong> — whether the Stop-hook auto-continues a plan, iteration caps (500 in ultrawork mode, 100 in normal mode), and how completion is gated.</li>\n<li><strong>Skills</strong> — which skills are active and where they load from.</li>\n<li><strong>Agent</strong> — Hephaestus, the autonomous deep worker, and its model/prompt overrides. The Codex package is the Hephaestus-only light port; the full OmO&#39;s Sisyphus orchestrator is not included.</li>\n</ul>\n<h3 id=\"diagnosing-config\">Diagnosing config</h3>\n<p>If something looks pending or degraded, run:</p>\n<pre><code class=\"language-bash\">npx lazycodex-ai doctor\n</code></pre>\n<p>It explains what is misconfigured and why, and points at the specific field to fix.</p>\n<h3 id=\"re-running-setup\">Re-running setup</h3>\n<p>The installer is idempotent. Re-running <code>npx lazycodex-ai install</code> rewrites the config blocks, agent roles, and bin links on top of what is there, so it is safe to run after editing configuration by hand.</p>\n<p>See the <a href=\"#cli\">CLI reference</a> for every command the installer exposes.</p>\n",
  "deploy.md": "<p>The docs site at <code>lazycodex.ai</code> deploys automatically to Cloudflare Workers. There is no manual publish step for the web — a push to <code>main</code> that touches the web package ships it.</p>\n<h3 id=\"trigger\">Trigger</h3>\n<p>The <code>Web Deploy (Cloudflare Workers)</code> workflow runs on push to <code>main</code> when <code>packages/web/**</code> or the workflow file itself changes, and on manual <code>workflow_dispatch</code>. A concurrency group keyed by ref serializes runs and never cancels an in-flight deploy.</p>\n<h3 id=\"build\">Build</h3>\n<p>Inside <code>packages/web</code>, the prebuild step regenerates <code>lib/docs-content.generated.ts</code> from <code>content/docs/*.md</code>. The site is then built with OpenNext for Cloudflare (<code>pnpm exec opennextjs-cloudflare build</code>).</p>\n<h3 id=\"deploy\">Deploy</h3>\n<p><code>cloudflare/wrangler-action@v4</code> runs <code>wrangler deploy</code> (or <code>deploy --env &lt;environment&gt;</code> when an environment is supplied) against the <code>web-production</code> environment, whose URL is <code>https://lazycodex.ai</code>.</p>\n<h3 id=\"post-deploy-smoke-checks\">Post-deploy smoke checks</h3>\n<p>The workflow fails the job if any check breaks:</p>\n<ul>\n<li>Apex <code>https://lazycodex.ai/</code> returns <code>200</code>.</li>\n<li><code>www.lazycodex.ai</code>, <code>lazycodex.dev</code>, and <code>www.lazycodex.dev</code> each return <code>301</code> redirecting to <code>https://lazycodex.ai</code>.</li>\n</ul>\n<p>A PageSpeed Insights pass audits the live URL for Lighthouse 100/100/100/100 across performance, accessibility, best-practices, and SEO, on both mobile and desktop. It is non-blocking here because PSI shared quota throttles frequent CI; the gating Lighthouse check runs in <code>web-ci.yml</code> via real Playwright Chromium.</p>\n<h3 id=\"local-preview\">Local preview</h3>\n<pre><code class=\"language-bash\">cd packages/web\npnpm preview   # opennextjs-cloudflare build &amp;&amp; preview\npnpm deploy    # build &amp;&amp; deploy (requires Cloudflare auth)\n</code></pre>\n<h3 id=\"reading-more\">Reading more</h3>\n<ul>\n<li><a href=\"#skills\">Skills</a> — what the docs site documents.</li>\n<li><a href=\"#configuration\">Configuration</a> — tuning that affects the build.</li>\n</ul>\n",
  "cli.md": "<p>The <code>lazycodex-ai</code> CLI is the entry point for installing and diagnosing the harness. It is meant to be run through <code>npx</code> — never install it globally.</p>\n<h3 id=\"install\">install</h3>\n<pre><code class=\"language-bash\">npx lazycodex-ai install\n</code></pre>\n<p>Installs the OmO agent harness into Codex: commands, skills, hooks, model routing, and verification defaults in one pass. This is exactly equivalent to:</p>\n<pre><code class=\"language-bash\">npx --yes --package oh-my-openagent omo install --platform=codex\n</code></pre>\n<p>To skip the TUI and let the installer run autonomously:</p>\n<pre><code class=\"language-bash\">npx lazycodex-ai install --no-tui --codex-autonomous\n</code></pre>\n<h3 id=\"doctor\">doctor</h3>\n<pre><code class=\"language-bash\">npx lazycodex-ai doctor\n</code></pre>\n<p>Prints a health report: what is configured, what is missing, and why. Run this first when a hook is pending, a skill is not loading, or routing looks wrong.</p>\n<h3 id=\"prerequisites\">Prerequisites</h3>\n<ul>\n<li><a href=\"https://nodejs.org\">Node.js</a> — any maintained LTS; <code>npx</code> ships with it. Bun is <strong>not</strong> required for the installer.</li>\n<li>The <a href=\"https://github.com/openai/codex\">OpenAI Codex CLI</a> or the Codex app, logged in.</li>\n</ul>\n<blockquote>\n<p>Do not use <code>npm install -g</code> or <code>bun add -g</code>. Always invoke via <code>npx</code>.</p>\n</blockquote>\n<h3 id=\"marketplace-alternative\">Marketplace alternative</h3>\n<p>As an additive, experimental path you can install from inside Codex: type <code>/plugins</code>, open the <strong>Add Marketplace</strong> tab, and enter <code>https://github.com/code-yeongyu/lazycodex</code>, then install <code>omo</code> from the <code>sisyphuslabs</code> marketplace. Or from the CLI:</p>\n<pre><code class=\"language-bash\">codex plugin marketplace add https://github.com/code-yeongyu/lazycodex\ncodex plugin add omo@sisyphuslabs\n</code></pre>\n<p>The npx installer above stays the primary path. See <a href=\"#installation\">Installation</a> for the full walkthrough.</p>\n"
};

export type DocHeading = { level: number; id: string; text: string };
export const DOC_TOC: Record<string, DocHeading[]> = {
  "overview.md": [
    {
      "level": 3,
      "id": "where-it-comes-from",
      "text": "Where it comes from"
    },
    {
      "level": 3,
      "id": "what-you-get",
      "text": "What you get"
    },
    {
      "level": 3,
      "id": "the-harness-workflow",
      "text": "The harness workflow"
    },
    {
      "level": 3,
      "id": "how-it-fits-together",
      "text": "How it fits together"
    }
  ],
  "installation.md": [
    {
      "level": 3,
      "id": "install",
      "text": "Install"
    },
    {
      "level": 3,
      "id": "autonomous-one-liner",
      "text": "Autonomous one-liner"
    },
    {
      "level": 3,
      "id": "prerequisites",
      "text": "Prerequisites"
    },
    {
      "level": 3,
      "id": "install-from-the-codex-marketplace-experimental",
      "text": "Install from the Codex marketplace (experimental)"
    },
    {
      "level": 3,
      "id": "windows",
      "text": "Windows"
    },
    {
      "level": 3,
      "id": "let-an-agent-do-it",
      "text": "Let an agent do it"
    }
  ],
  "getting-started.md": [
    {
      "level": 3,
      "id": "the-four-commands",
      "text": "The four commands"
    },
    {
      "level": 3,
      "id": "how-to-choose",
      "text": "How to choose"
    },
    {
      "level": 3,
      "id": "a-typical-session",
      "text": "A typical session"
    }
  ],
  "init-deep.md": [
    {
      "level": 3,
      "id": "what-it-produces",
      "text": "What it produces"
    },
    {
      "level": 3,
      "id": "when-to-run-it",
      "text": "When to run it"
    },
    {
      "level": 3,
      "id": "how-to-use-it",
      "text": "How to use it"
    },
    {
      "level": 3,
      "id": "after-init",
      "text": "After init"
    }
  ],
  "ulw-plan.md": [
    {
      "level": 3,
      "id": "the-flow",
      "text": "The flow"
    },
    {
      "level": 3,
      "id": "output",
      "text": "Output"
    },
    {
      "level": 3,
      "id": "handoff",
      "text": "Handoff"
    }
  ],
  "start-work.md": [
    {
      "level": 3,
      "id": "how-it-works",
      "text": "How it works"
    },
    {
      "level": 3,
      "id": "syntax",
      "text": "Syntax"
    },
    {
      "level": 3,
      "id": "done",
      "text": "Done"
    }
  ],
  "ulw-loop.md": [
    {
      "level": 3,
      "id": "how-it-works",
      "text": "How it works"
    },
    {
      "level": 3,
      "id": "bootstrap",
      "text": "Bootstrap"
    },
    {
      "level": 3,
      "id": "manual-qa-channels",
      "text": "Manual-QA channels"
    },
    {
      "level": 3,
      "id": "syntax",
      "text": "Syntax"
    },
    {
      "level": 3,
      "id": "limits",
      "text": "Limits"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "ultrawork.md": [
    {
      "level": 3,
      "id": "usage",
      "text": "Usage"
    },
    {
      "level": 3,
      "id": "what-it-enforces",
      "text": "What it enforces"
    }
  ],
  "discipline-agents.md": [
    {
      "level": 3,
      "id": "what-hephaestus-is",
      "text": "What Hephaestus is"
    },
    {
      "level": 3,
      "id": "the-operating-loop",
      "text": "The operating loop"
    },
    {
      "level": 3,
      "id": "what-it-never-does",
      "text": "What it never does"
    },
    {
      "level": 3,
      "id": "delegation-not-orchestration",
      "text": "Delegation, not orchestration"
    },
    {
      "level": 3,
      "id": "where-the-boulder-comes-from",
      "text": "Where the boulder comes from"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "model-routing.md": [
    {
      "level": 3,
      "id": "what-gets-routed",
      "text": "What gets routed"
    },
    {
      "level": 3,
      "id": "how-it-fits-the-harness",
      "text": "How it fits the harness"
    },
    {
      "level": 3,
      "id": "provider-auth",
      "text": "Provider auth"
    },
    {
      "level": 3,
      "id": "customizing-it",
      "text": "Customizing it"
    }
  ],
  "hooks-lifecycle.md": [
    {
      "level": 3,
      "id": "the-core-mechanism",
      "text": "The core mechanism"
    },
    {
      "level": 3,
      "id": "where-progress-lives",
      "text": "Where progress lives"
    },
    {
      "level": 3,
      "id": "approval-and-trust",
      "text": "Approval and trust"
    },
    {
      "level": 3,
      "id": "evidence-gates",
      "text": "Evidence gates"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "git-workflow.md": [
    {
      "level": 3,
      "id": "mode-gate",
      "text": "Mode gate"
    },
    {
      "level": 3,
      "id": "commit-mode",
      "text": "Commit mode"
    },
    {
      "level": 3,
      "id": "rebase-and-merge",
      "text": "Rebase and merge"
    },
    {
      "level": 3,
      "id": "push-safety",
      "text": "Push safety"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "tdd.md": [
    {
      "level": 3,
      "id": "the-order",
      "text": "The order"
    },
    {
      "level": 3,
      "id": "the-test-pyramid",
      "text": "The test pyramid"
    },
    {
      "level": 3,
      "id": "deterministic-or-it-is-broken",
      "text": "Deterministic, or it is broken"
    },
    {
      "level": 3,
      "id": "prompt-tests-assert-behavior-not-text",
      "text": "Prompt tests assert behavior, not text"
    },
    {
      "level": 3,
      "id": "the-five-evidence-gates",
      "text": "The five evidence gates"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "manual-qa.md": [
    {
      "level": 3,
      "id": "visual-qa",
      "text": "visual-qa"
    },
    {
      "level": 3,
      "id": "review-work",
      "text": "review-work"
    },
    {
      "level": 3,
      "id": "adversarial-classes-and-cleanup",
      "text": "Adversarial classes and cleanup"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "skills.md": [
    {
      "level": 3,
      "id": "built-in-workflows",
      "text": "Built-in workflows"
    },
    {
      "level": 3,
      "id": "feature-coverage",
      "text": "Feature coverage"
    },
    {
      "level": 3,
      "id": "where-skills-live",
      "text": "Where skills live"
    }
  ],
  "configuration.md": [
    {
      "level": 3,
      "id": "where-config-lives",
      "text": "Where config lives"
    },
    {
      "level": 3,
      "id": "what-you-can-tune",
      "text": "What you can tune"
    },
    {
      "level": 3,
      "id": "diagnosing-config",
      "text": "Diagnosing config"
    },
    {
      "level": 3,
      "id": "re-running-setup",
      "text": "Re-running setup"
    }
  ],
  "deploy.md": [
    {
      "level": 3,
      "id": "trigger",
      "text": "Trigger"
    },
    {
      "level": 3,
      "id": "build",
      "text": "Build"
    },
    {
      "level": 3,
      "id": "deploy",
      "text": "Deploy"
    },
    {
      "level": 3,
      "id": "post-deploy-smoke-checks",
      "text": "Post-deploy smoke checks"
    },
    {
      "level": 3,
      "id": "local-preview",
      "text": "Local preview"
    },
    {
      "level": 3,
      "id": "reading-more",
      "text": "Reading more"
    }
  ],
  "cli.md": [
    {
      "level": 3,
      "id": "install",
      "text": "install"
    },
    {
      "level": 3,
      "id": "doctor",
      "text": "doctor"
    },
    {
      "level": 3,
      "id": "prerequisites",
      "text": "Prerequisites"
    },
    {
      "level": 3,
      "id": "marketplace-alternative",
      "text": "Marketplace alternative"
    }
  ]
};

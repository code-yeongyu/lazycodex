<div align="center">
  <img src=".github/assets/omo-icon-light.svg" alt="LazyCodex" width="280">

  <h1>LazyCodex</h1>

  <p><strong>The one and only agent harness for complex codebases.</strong><br />
  Project memory, planning, execution, and verified completion inside Codex.</p>

  <p>
    <a href="https://github.com/code-yeongyu/lazycodex">
      <img alt="Stars" src="https://img.shields.io/github/stars/code-yeongyu/lazycodex?style=for-the-badge&color=c69ff5&logoColor=D9E0EE&labelColor=302D41" />
    </a>
  </p>

  <p>
    <a href="#-what-is-this">What is this?</a>
    ·
    <a href="https://github.com/code-yeongyu/oh-my-openagent">OmO</a>
    ·
    <a href="https://lazycodex.ai">lazycodex.ai</a>
  </p>

  <br />
</div>

<hr />

> [!NOTE]
> **[OmO] 60K Stars: the terrifying token burner has arrived in LazyCodex.**
>
> Sisyphus Labs' OmO is the quality-obsessed agent harness whose public lore says it loved Anthropic models hard enough to get third-party clients blocked. Now that same OmO quality bar is available for Codex through LazyCodex.
>
> If you wanted OmO but did not want the setup ceremony, start here:
>
> ```bash
> npx lazycodex-ai install
> ```
>
> Context: [OmO 60K Stars on X](https://x.com/justsisyphus/status/2060210365338939452?s=20)

## 🚀 Install

One line. No global install, no `npm i -g`. Always use `npx`:

```bash
npx lazycodex-ai install
```

This is shorthand for `npx --yes --package oh-my-openagent omo install --platform=codex`. For a fully autonomous, no-TUI setup:

```bash
npx lazycodex-ai install --no-tui --codex-autonomous
```

### Install from the Codex marketplace (experimental)

The npx installer above stays the primary path. As an additive, experimental
alternative you can install from inside Codex itself: type `/plugins`, open the
**Add Marketplace** tab ("Add a marketplace from a Git repo or local root."),
and enter `https://github.com/code-yeongyu/lazycodex`, then install `omo` from
the `sisyphuslabs` marketplace. Or from the CLI:

```bash
codex plugin marketplace add https://github.com/code-yeongyu/lazycodex
codex plugin add omo@sisyphuslabs
```

On the next launch, approve the omo hooks in Codex's startup review — hooks
never run before approval. The first approved session prints
`LazyCodex bootstrap running in background — restart the session when it completes`
while a background worker finishes the setup (config blocks, agent roles, bin
links, a pinned `sg` binary for the `ast_grep` MCP); restart when it is done.
The marketplace path never touches Codex permission settings — autonomous mode
remains the explicit `npx lazycodex-ai install --no-tui --codex-autonomous`
choice.

Upgrade with `codex plugin marketplace upgrade sisyphuslabs`. The next startup
review shows the hooks as **Modified** — expected after every upgrade —
re-approve them and the following session re-runs bootstrap on the new version.
If anything looks pending or degraded, `npx lazycodex-ai doctor` explains what
and why. Full details: [lazycodex.ai/docs](https://lazycodex.ai/docs).

### Verify it worked

```bash
npx lazycodex-ai doctor
```

`doctor` prints the installation health report: plugin cache, hooks, MCP
servers, agents, and config state. Inside Codex, type `$` in the composer to
browse every installed skill — `init-deep`, `ulw-loop`, `ulw-plan`,
`start-work`, and the rest — and hooks announce themselves with
`LazyCodex(<version>): ...` status messages during a session.

### Uninstall

```bash
npx lazycodex-ai uninstall
```

Removes the installed plugin cache, bin links, agent roles, and the managed
sections of `~/.codex/config.toml`.

## ⚡ Commands

LazyCodex installs these as OmO commands for Codex. Invoke them with the
`$command` syntax shown by the installer.

| Command | Type this | What it does |
| --- | --- | --- |
| `$ulw-loop` | `$ulw-loop "task" [--completion-promise=TEXT] [--strategy=reset\|continue]` | Self-referential loop that runs until Oracle-verified completion. Caps at 500 iterations in ultrawork mode, 100 in normal mode. |
| `$ulw-plan` | `$ulw-plan "what to build"` | Prometheus strategic planner. Writes a plan to `plans/<slug>.md`. Never writes product code. |
| `$start-work` | `$start-work [plan-name] [--worktree <path>]` | Executes a plan until every checkbox is done. Prints **ORCHESTRATION COMPLETE**. |

Full documentation lives at [lazycodex.ai/docs](https://lazycodex.ai/docs).

## Use the built-in workflows

LazyCodex should be judged by the features it actually installs. It is the
Codex distribution for OmO's agent harness: project memory, planning,
execution, verified completion, skills, hooks, model routing, and diagnostics.

### 1. `$init-deep` creates project memory

`$init-deep` generates hierarchical `AGENTS.md` context. It scores complex
directories, writes local guidance near the code that needs it, and gives future
agents landmarks before they edit. Type `$init-deep` in the Codex composer —
the `$` prefix is how every installed skill is invoked.

Use it when the repository is too large to explain from memory. Run it again
when the shape of the codebase changes.

### 2. The three command pillars stay up front

Use `$ulw-plan` when the work needs decisions before implementation. It writes a
plan to `plans/<slug>.md` and does not touch product code.

Use `$start-work` when a plan is ready. It executes the checklist with durable
Boulder progress and stops only when the plan is complete.

Use `$ulw-loop` when the task should keep moving until the result is verified by
evidence instead of a hopeful status update.

### 3. Skills cover specialized work

The command layer stays simple. The skill layer adds specialist judgment for the
actual work:

| Feature | Use it for |
| --- | --- |
| `$init-deep` | Hierarchical project memory through `AGENTS.md` |
| `$ulw-plan` | Decision-complete planning before code changes |
| `$start-work` | Durable plan execution with Boulder progress |
| `$ulw-loop` | Verified completion for open-ended tasks |
| `review-work` | Multi-angle post-implementation review |
| `remove-ai-slops` | Behavior-preserving cleanup of AI-looking code |
| `frontend-ui-ux` | Polished UI surfaces |
| `programming` | Strict TypeScript, Rust, Python, or Go discipline |
| `LSP` | Diagnostics, definitions, references, symbols, and renames |
| `AST-grep` | Structural search and rewrite across code |
| `rules` | Project instructions from AGENTS, rules, and instruction files |
| `comment-checker` | Feedback after edit-like operations |

### 4. Sub-agent roles ride Codex's native multi-agent tools

LazyCodex installs selectable agent roles into `~/.codex/agents/`: `explorer`,
`librarian`, `plan`, `momus`, `metis`, and `codex-ultrawork-reviewer`. Pick one
by passing `agent_type` to Codex's `spawn_agent` tool — the child agent runs
with that role's model and instructions:

```jsonc
spawn_agent({"message": "TASK: map the auth flow end to end.", "agent_type": "explorer"})
```

The installer exposes `agent_type` on `multi_agent_v2` sessions (Codex hides it
by default). If your Codex build's spawn tool has no `agent_type` parameter,
describe the role inside `message` instead — the skills are written to fall
back to that form automatically.

Start at [https://lazycodex.ai](https://lazycodex.ai).

<hr />

## 💤 What is this?

**LazyCodex** packages [OmO (oh-my-openagent)](https://github.com/code-yeongyu/oh-my-openagent) as the Codex agent harness for complex codebases.

Think [LazyVim](https://github.com/LazyVim/LazyVim) for [lazy.nvim](https://github.com/folke/lazy.nvim), but for Codex.

OmO is the agent harness: discipline agents, parallel orchestration, multi-model routing, skills, hooks, and verified completion. LazyCodex packages that harness for Codex.

> _"LazyVim made Neovim usable for the rest of us. LazyCodex does the same for Codex."_

Credit: The LazyCodex name idea is inspired by [LazyVim](https://github.com/LazyVim/LazyVim). The Ultragoal and UltraQA ideas are inspired by [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex), reimplemented from concept for this Codex setup.

## 🧩 What you get

| Feature | Description |
| --- | --- |
| 🤖 **Discipline Agents** | Sisyphus orchestrates Hephaestus, Oracle, Librarian. A full AI dev team |
| 🔀 **Parallel Execution** | Multiple agents working simultaneously on subtasks |
| 🎯 **Multi-Model Routing** | Automatic model selection per task category |
| 🛠️ **Skills System** | Extensible skill library for specialized tasks |
| 📋 **Hooks & Lifecycle** | Pre/post hooks for every agent action |
| 🔧 **Zero Config** | Sensible defaults, override when you want |

## 🧠 Why different GPT models appear

Do not be surprised if an OmO/LazyCodex run shows models like `gpt-5.2`
with `xhigh`, `gpt-5.4-mini`, `gpt-5.3-codex`, or newer equivalents like
`gpt-5.5` with `xhigh`. That is intentional.

OmO does not blindly spend your best model on every subtask. Its source
defines task categories and fallback chains so the agent can pick the most
appropriate model for the job: `quick` routes to `gpt-5.4-mini` for small
edits, `ultrabrain` uses a high-reasoning GPT model for hard logic, and
agentic coding paths can use Codex-tuned GPT models when available. See
[`openai-categories.ts`](src/src/tools/delegate-task/openai-categories.ts)
and [`model-requirements.ts`](src/packages/model-core/src/model-requirements.ts).

The point is quota discipline: use the strongest model when the task needs
deep reasoning, use a cheaper/faster model when that is enough, and keep
parallel agent work efficient instead of burning premium quota on routine
steps. This is benchmark-driven routing, not random model churn:

- [GPT-5.2](https://openai.com/index/introducing-gpt-5-2/) is documented by
  OpenAI as stronger at code review, bug finding, and complex tool use; the
  announcement notes that its maximum API reasoning effort uses `xhigh`.
- [GPT-5.3-Codex](https://developers.openai.com/api/docs/models/gpt-5.3-codex)
  is OpenAI's Codex-tuned model for agentic software engineering, with public
  coding-agent benchmarks such as SWE-Bench Pro, Terminal-Bench 2.0, and
  OSWorld Verified reported in the
  [GPT-5.3-Codex announcement](https://openai.com/index/introducing-gpt-5-3-codex).
- [GPT-5.4 mini](https://openai.com/index/introducing-gpt-5-4-mini-and-nano/)
  is positioned for efficient everyday coding, computer use, and subagents;
  that is why lightweight OmO tasks can land there instead of spending a
  frontier reasoning model.

Reference links:

- [OpenAI GPT-5.2 announcement](https://openai.com/index/introducing-gpt-5-2/)
- [OpenAI GPT-5.2 model docs](https://platform.openai.com/docs/models/gpt-5.2/)
- [OpenAI GPT-5.3-Codex model docs](https://developers.openai.com/api/docs/models/gpt-5.3-codex)
- [OpenAI GPT-5.4 mini and nano announcement](https://openai.com/index/introducing-gpt-5-4-mini-and-nano/)
- [OpenAI latest model guide](https://platform.openai.com/docs/guides/latest-model)

## 🏗️ Architecture

LazyCodex is a thin distribution layer. The core engine is [oh-my-openagent (OmO)](https://github.com/code-yeongyu/oh-my-openagent), included as a submodule under `src/`.

```
lazycodex/
├── src/                     → oh-my-openagent (submodule)
├── packages/
│   └── web/                 → Next.js 15 + Tailwind v4 + opennextjs-cloudflare
│                              (deployed to lazycodex.ai via Cloudflare Workers)
├── .github/workflows/       → web-ci.yml + web-deploy.yml
├── README.md
└── ...
```

LazyCodex is part of the [omo.dev](https://omo.dev) project. **omo in Codex**, packaged for the lazy.

## 👷 Maintainer

LazyCodex is maintained by **Jobdori**, the AI assistant that builds and ships [OmO](https://github.com/code-yeongyu/oh-my-openagent) in real-time.

<div align="center">

[![Sisyphus Labs](.github/assets/sisyphuslabs.png)](https://sisyphuslabs.ai)

> **Meet your own Jobdori, Dori.**
> **Learn more at [sisyphuslabs.ai](https://sisyphuslabs.ai).**

</div>

## 📄 License

MIT


## 🌐 Web Resources & Interactive Index
- [CATEGORY CONTROLLER 2](https://frskillcrafts.pages.dev/category-controller-2.html)
- [SPRUNKI CHARACTER MAKER OC](https://thelearnquesters.pages.dev/sprunki-character-maker-oc.html)
- [TWILIGHT SOLITAIRE TRIPEAKS](https://learnquester.github.io/twilight-solitaire-tripeaks.html)
- [SKIBIDI SURVIVOR RUSH](https://studyquests.github.io/skibidi-survivor-rush.html)
- [CATEGORY ESCAPE](https://studyplayings.pages.dev/category-escape.html)
- [DUMMIES WORLD CUP](https://studyplayings.pages.dev/dummies-world-cup.html)
- [BLOCKIBO COLOR BLOCKS](https://studyplayings.pages.dev/blockibo-color-blocks.html)
- [CATEGORY BRAIN260](https://studyplayings.pages.dev/category-brain260.html)
- [INDEX4](https://quizverses.pages.dev/index4.html)
- [TANK BATTLEIO](https://quizverses.github.io/tank-battleio.html)
- [CATEGORY CUTE](https://quizverses.github.io/category-cute.html)
- [INDEX20](https://quizverses.pages.dev/index20.html)
- [SCHOOLBOY RUNAWAY ROOM ESCAPE](https://quizverses.github.io/schoolboy-runaway-room-escape.html)
- [CATEGORY COLOR197](https://studyplayings.pages.dev/category-color197.html)
- [PUZZLE LINES AND KNOTS 1](https://quizverses-9d2f2.web.app/puzzle-lines-and-knots-1.html)
- [EGG DASH](https://quizverses.github.io/egg-dash.html)
- [FRIDAY NIGHT SPRUNKI](https://studyplayings.pages.dev/friday-night-sprunki.html)
- [MOJICON GARDEN JIGSOLITAIRE](https://quizverses-9d2f2.web.app/mojicon-garden-jigsolitaire.html)
- [CATEGORY FIGHTING124](https://learnquester.github.io/category-fighting124.html)
- [CATEGORY MAHJONG](https://learnquester.github.io/category-mahjong.html)
- [CATEGORY CASUAL969](https://studyplayings.pages.dev/category-casual969.html)
- [CITY DRIFT RACING](https://studyplayings.pages.dev/city-drift-racing.html)
- [CATEGORY QUIZ](https://learnquester.github.io/category-quiz.html)
- [SCARY BABY YELLOW GAME](https://studyplayings.pages.dev/scary-baby-yellow-game.html)
- [INDEX10](https://quizverses-9d2f2.web.app/index10.html)
- [CATEGORY CASUAL 3](https://quizverses.pages.dev/category-casual-3.html)
- [MAGIC FOREST MERGE THE SECRETS](https://quizverses.github.io/magic-forest-merge-the-secrets.html)
- [CATEGORY ARENA254](https://quizverses-9d2f2.web.app/category-arena254.html)
- [CATEGORY CASUAL 3](https://studyplayings.pages.dev/category-casual-3.html)
- [SCREW PUZZLE](https://learnquester.github.io/screw-puzzle.html)
- [TRAFFIC ESCAPE PUZZLE](https://studyplayings.pages.dev/traffic-escape-puzzle.html)
- [SHOPAHOLIC BLACK FRIDAY](https://quizverses.github.io/shopaholic-black-friday.html)
- [FARM BLOCK](https://quizverses.github.io/farm-block.html)
- [WAR LANDS](https://studyplayings.pages.dev/war-lands.html)
- [SAVE THE CROP](https://studyplayings.pages.dev/save-the-crop.html)
- [CATEGORY ADVENTURE 2](https://studyplayings.pages.dev/category-adventure-2.html)
- [INDEX4](https://learnquester.github.io/index4.html)
- [CATEGORY SPACE57](https://quizverses-9d2f2.web.app/category-space57.html)
- [HAWAII MATCH 5](https://studyplayings.pages.dev/hawaii-match-5.html)
- [PLANET HOPPER](https://quizverses.github.io/planet-hopper.html)
- [TINY GOLF KING](https://quizverses.github.io/tiny-golf-king.html)
- [CATEGORY SPACE57](https://quizverses.github.io/category-space57.html)
- [MAHJONG CLASSIC WEBGL](https://studyplayings.web.app/mahjong-classic-webgl.html)
- [COUNT AND BOUNCE](https://studyplayings.pages.dev/count-and-bounce.html)
- [CATEGORY BUBBLE SHOOTER](https://studyplayings.pages.dev/category-bubble-shooter.html)
- [NINJA TIME](https://studyplayings.pages.dev/ninja-time.html)
- [ANIMAL BLOCK POP PUZZLE](https://quizverses-9d2f2.web.app/animal-block-pop-puzzle.html)
- [MEGA RAMP CAR](https://studyplayings.pages.dev/mega-ramp-car.html)
- [SPRUNKI 3D SHOOTER](https://studyplayings.pages.dev/sprunki-3d-shooter.html)
- [CATEGORY ADVENTURE](https://quizverses.pages.dev/category-adventure.html)
- [PRIVACY](https://learnquester.github.io/privacy.html)
- [UNCLE BULLET 007](https://quizverses.pages.dev/uncle-bullet-007.html)
- [CATEGORY BRAIN](https://quizverses.pages.dev/category-brain.html)
- [CATEGORY CASUAL 6](https://studyplayings.pages.dev/category-casual-6.html)
- [ADDICTION MINI SOLITAIRE](https://studyplayings.pages.dev/addiction-mini-solitaire.html)
- [CATEGORY CAR](https://quizverses.pages.dev/category-car.html)
- [CATEGORY CARDS](https://studyplayings.pages.dev/category-cards.html)
- [LAVA JUMP](https://quizverses.github.io/lava-jump.html)
- [CATEGORY BATTLE GAMES](https://quizverses.github.io/category-battle-games.html)
- [CAR SERVICE TYCOON](https://studyplayings.pages.dev/car-service-tycoon.html)
- [CATEGORY AGILITY 2](https://quizverses.pages.dev/category-agility-2.html)
- [CATEGORY WEB PROXY](https://learnquester.github.io/category-web-proxy.html)
- [CATEGORY HORROR](https://learnquester.github.io/category-horror.html)
- [INDEX11](https://quizverses.github.io/index11.html)
- [IDLE BATHROOM EMPIRE TYCOON](https://quizverses.github.io/idle-bathroom-empire-tycoon.html)
- [TOW N GO](https://quizverses.github.io/tow-n-go.html)
- [CATEGORY CONTROLLER](https://studyplayings.pages.dev/category-controller.html)
- [BOYFRIEND FOR HIRE](https://quizverses.github.io/boyfriend-for-hire.html)
- [SWEET TRIPLE MAHJONG](https://learnquester.github.io/sweet-triple-mahjong.html)
- [WINTER TETRIX TRAILS](https://quizverses.github.io/winter-tetrix-trails.html)
- [CATEGORY BIKE](https://studyplayings.pages.dev/category-bike.html)
- [THE SORTING MART](https://quizverses.github.io/the-sorting-mart.html)
- [CATEGORY WEB PROXY](https://quizverses.pages.dev/category-web-proxy.html)
- [BRIDGE FIGHT](https://quizverses.github.io/bridge-fight.html)
- [CATEGORY MATCH 3117](https://learnquester.github.io/category-match-3117.html)
- [CATEGORY JIGSAW](https://quizverses.pages.dev/category-jigsaw.html)
- [CATEGORY CONTROLLER 2](https://studyplayings.pages.dev/category-controller-2.html)
- [GLACIER RUSH](https://studyquests.github.io/glacier-rush.html)
- [MR BEAN JUMP](https://studyquesthub.web.app/mr-bean-jump.html)
- [INDEX8](https://quizverses-9d2f2.web.app/index8.html)
- [BRAINROT BOING BOING MERGE](https://studyplayings.web.app/brainrot-boing-boing-merge.html)
- [CATEGORY SOCCER60](https://learnquester.github.io/category-soccer60.html)
- [PIRATE PARADISE](https://studyplayings.pages.dev/pirate-paradise.html)
- [HEXA SORT WINTER EDITION](https://studyplayings.pages.dev/hexa-sort-winter-edition.html)
- [NUMBER COLLECTOR BRAINTEASER](https://quizverses.github.io/number-collector-brainteaser.html)
- [CATEGORY SECURLY BYPASS](https://quizverses-9d2f2.web.app/category-securly-bypass.html)
- [PRIVACY](https://quizverses-9d2f2.web.app/privacy.html)
- [KING KONG CHAOS](https://quizverses.github.io/king-kong-chaos.html)
- [TERMS](https://studyplayings.pages.dev/terms.html)
- [CATEGORY COOKING](https://studyplayings.pages.dev/category-cooking.html)
- [ASSASSIN COMMANDO CAR DRIVING](https://studyplayings.pages.dev/assassin-commando-car-driving.html)
- [MAD DASH](https://studyplayings.pages.dev/mad-dash.html)
- [THE SPECIMEN ZERO](https://quizverses.github.io/the-specimen-zero.html)
- [SUPERMARKET CASHIER SIMULATOR](https://studyquests.github.io/supermarket-cashier-simulator.html)
- [CATEGORY DISCORD](https://learnquester.github.io/category-discord.html)
- [FRUIT MERGE JUICY DROP GAME](https://quizverses.github.io/fruit-merge-juicy-drop-game.html)
- [BLOXORZ BLOCK PUZZLE 3D](https://studyplayings.web.app/bloxorz-block-puzzle-3d.html)
- [ASMR BEAUTY SUPERSTAR](https://learnquester.github.io/asmr-beauty-superstar.html)
- [DRAW TO HOME 3D](https://learnquester.github.io/draw-to-home-3d.html)
- [MEMORY MATCH MAGIC](https://thelearnquester.web.app/memory-match-magic.html)
- [CATEGORY MONSTER](https://quizverses.pages.dev/category-monster.html)
- [CATEGORY MOUSE1 697](https://quizverses.pages.dev/category-mouse1-697.html)
- [POPCATS MERGE THE CATS](https://studyquests.github.io/popcats-merge-the-cats.html)
- [SCHOOL SIMULATOR MY SCHOOL](https://studyplayings.pages.dev/school-simulator-my-school.html)
- [QUBE 2048](https://thelearnquester.web.app/qube-2048.html)
- [RACE IT CAR RACING](https://studyquests.github.io/race-it-car-racing.html)
- [SAUSAGE FLIP FREE](https://thelearnquester.web.app/sausage-flip-free.html)
- [UNSCREW WOOD PUZZLE](https://studyquests.github.io/unscrew-wood-puzzle.html)
- [ARCHERS RANDOM](https://thelearnquester.web.app/archers-random.html)
- [DINO SLIDE](https://studyquests.github.io/dino-slide.html)
- [CATEGORY BIKE](https://studyquests.pages.dev/category-bike.html)
- [CATEGORY 2D1 060](https://quizverses.pages.dev/category-2d1-060.html)
- [LIVE OR DIE](https://thelearnquester.web.app/live-or-die.html)
- [RACE CLICKER](https://studyquesthub.web.app/race-clicker.html)
- [CATEGORY TANK58](https://quizverses.github.io/category-tank58.html)
- [ISOMETRIC ESCAPE](https://studyquests.github.io/isometric-escape.html)
- [VOLLEY BEANS VOLLEYBALL GAME](https://learnquester.github.io/volley-beans-volleyball-game.html)
- [DOLPHIN DASH](https://studyquesthub.web.app/dolphin-dash.html)
- [ROBLOX CRAFT RUN](https://studyquests.github.io/roblox-craft-run.html)
- [CATEGORY FASHION105](https://thelearnquester.web.app/category-fashion105.html)
- [MAHJONG PET QUEST](https://learnquester.github.io/mahjong-pet-quest.html)
- [MELON DROP FRUIT MERGE MASTER](https://thelearnquester.web.app/melon-drop-fruit-merge-master.html)
- [ASOKA MAKEUP INDIAN BRIDE](https://studyquests.github.io/asoka-makeup-indian-bride.html)
- [OLE BUNNY](https://studyquests.github.io/ole-bunny.html)
- [BLADE FORGE 3D](https://quizverses.github.io/blade-forge-3d.html)
- [PALM ISLAND SOLITAIRE](https://learnquester.github.io/palm-island-solitaire.html)
- [CATEGORY PLATFORM](https://quizverses.pages.dev/category-platform.html)
- [INDEX11](https://thelearnquester.web.app/index11.html)
- [DIEPIO](https://quizverses.github.io/diepio.html)
- [HAPPY BUBBLES](https://thelearnquester.web.app/happy-bubbles.html)

import type { JSX } from "react"
import {
  ULW_DEMO_ENVIRONMENT,
  ULW_DEMO_SCENES,
  ULW_DEMO_WORKERS,
  type UlwScene,
} from "../../../lib/ulw-demo-scenes"
import { UlwIcon, type UlwIconName } from "./window-icons"

/**
 * Presentational panes for the Codex window, pure functions of the active
 * scene. Every visible string comes from `lib/ulw-demo-scenes.ts` or the
 * generic chrome labels visible in our own app frames
 * (.omo/reference/app-frames/creation-03.png, subagents-03.png).
 * Transcript anatomy follows the real app: command bubble, prose, then
 * tool-activity rows (the run-ledger lines) with small inline glyphs.
 */

function ledgerIcon(line: string): UlwIconName {
  if (line.includes("fail")) return "alert"
  if (line.includes("evidence_captured") || line.includes("checkpoint") || line.includes("status=pass")) {
    return "check"
  }
  if (line.startsWith("goal_") || line.includes("activeGoalId")) return "target"
  return "terminal"
}

export function TranscriptPane({ scene }: { readonly scene: UlwScene }): JSX.Element {
  return (
    <section className="ulw-app-transcript" aria-label="Ultrawork run transcript">
      <p className="ulw-mode-flag">ULTRAWORK MODE ENABLED!</p>

      <div className="ulw-app-user">
        <code>{scene.command}</code>
      </div>

      {/* The live region stays OUTSIDE the keyed swap subtree: React must
          mutate its text in place for screen readers to announce scenes. */}
      <small className="ulw-scene-status" aria-live="polite">
        {scene.status}
      </small>
      <div className="ulw-scene-copy ulw-scene-swap" key={scene.key}>
        <h3>{scene.title}</h3>
        <p>{scene.body}</p>
      </div>

      <div className="ulw-app-tools" aria-label="Run ledger activity">
        {scene.ledger.split("\n").map((line) => (
          <div className="ulw-app-tool" key={line}>
            <UlwIcon name={ledgerIcon(line)} />
            <span>{line}</span>
          </div>
        ))}
      </div>

      <div className="ulw-app-code">
        <code>{scene.json}</code>
      </div>
    </section>
  )
}

export function WindowFooter({
  scene,
  sceneIndex,
}: {
  readonly scene: UlwScene
  readonly sceneIndex: number
}): JSX.Element {
  return (
    <div className="ulw-app-footer">
      <span className="ulw-app-step">
        Step {sceneIndex + 1} / {ULW_DEMO_SCENES.length}
      </span>

      <div className="ulw-app-goal">
        <UlwIcon name="target" />
        <strong>Pursuing goal</strong>
        <span>{scene.composer}</span>
      </div>

      {/* Static, decorative composer — faithful to the app frame but never a
          real input, so the whole block is hidden from assistive tech. */}
      <div className="ulw-app-composer" aria-hidden="true">
        <span className="ulw-app-composer-placeholder">Ask for follow-up changes</span>
        <div className="ulw-app-composer-row">
          <span className="ulw-app-composer-chip">
            <UlwIcon name="plus" />
          </span>
          <span className="ulw-app-composer-chip">Full access</span>
          <span className="ulw-app-composer-chip">
            <UlwIcon name="target" />
            Goal
          </span>
          <span className="ulw-app-composer-grow" />
          <span className="ulw-app-composer-chip">5.5 High</span>
          <span className="ulw-app-composer-chip">
            <UlwIcon name="mic" />
          </span>
          <span className="ulw-app-composer-send">
            <UlwIcon name="arrow-up" />
          </span>
        </div>
      </div>
    </div>
  )
}

export function SidePanel({ scene }: { readonly scene: UlwScene }): JSX.Element {
  return (
    <aside className="ulw-side" aria-label="Environment and subagents panel">
      <div className="ulw-side-card">
        <span className="ulw-side-heading">Environment</span>
        {ULW_DEMO_ENVIRONMENT.map(([label, value]) => (
          <div className="ulw-side-row" key={label}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="ulw-side-card">
        <span className="ulw-side-heading">Subagents</span>
        <div className="ulw-workers" aria-label="Subagent status list">
          {ULW_DEMO_WORKERS.map((worker) => (
            <div
              className="ulw-worker"
              data-live={scene.lanes.includes(worker.lane)}
              key={worker.name}
            >
              <span className="ulw-worker-glyph" data-lane={worker.lane} aria-hidden="true">
                {worker.glyph}
              </span>
              <span className="ulw-worker-name">{worker.name}</span>
              <small>{worker.role}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="ulw-side-card ulw-app-side-note">
        <strong>{scene.sideTitle}</strong>
        <span>{scene.sideBody}</span>
      </div>
    </aside>
  )
}

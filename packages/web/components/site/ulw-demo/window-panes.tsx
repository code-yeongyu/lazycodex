import { useEffect, useRef, type JSX } from "react"
import { SITE_CONFIG } from "../../../lib/site-config"
import {
  ULW_DEMO_ENVIRONMENT,
  ULW_DEMO_SCENES,
  ULW_DEMO_WORKERS,
  type UlwEntry,
  type UlwScene,
} from "../../../lib/ulw-demo-scenes"
import { UlwIcon, type UlwIconName } from "./window-icons"

/**
 * Presentational panes for the Codex window: the transcript renders the
 * appended replay entries; the footer and side panel derive from the
 * current phase's scene. Every visible string comes from
 * `lib/ulw-demo-scenes.ts` or the
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

export function TranscriptPane({
  entries,
}: {
  readonly entries: readonly UlwEntry[]
}): JSX.Element {
  const paneRef = useRef<HTMLElement | null>(null)

  // Follow the replay like the real app follows a live session: keep the
  // newest entry in view via INNER scroll only (the window box never moves).
  useEffect(() => {
    const node = paneRef.current
    if (!node) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    node.scrollTo({ top: node.scrollHeight, behavior: reduced ? "auto" : "smooth" })
  }, [entries.length])

  return (
    <section ref={paneRef} className="ulw-app-transcript" aria-label="Ultrawork run transcript">
      {/* The user's opening ask — the whole run answers this one message. */}
      <div className="ulw-entry ulw-app-user">
        <code>{SITE_CONFIG.ultraworkExample}</code>
      </div>

      {entries.map((entry) => {
        if (entry.kind === "mode") {
          return (
            <p className="ulw-entry ulw-mode-flag" key={entry.id}>
              {entry.text}
            </p>
          )
        }
        if (entry.kind === "status") {
          return (
            <small className="ulw-entry ulw-scene-status" key={entry.id}>
              {entry.text}
            </small>
          )
        }
        if (entry.kind === "prose") {
          return (
            <div className="ulw-entry ulw-scene-copy" key={entry.id}>
              <h3>{entry.heading}</h3>
              <p>{entry.text}</p>
            </div>
          )
        }
        if (entry.kind === "tool") {
          return (
            <div className="ulw-entry ulw-app-tool" key={entry.id}>
              <UlwIcon name={ledgerIcon(entry.text)} />
              <span>{entry.text}</span>
            </div>
          )
        }
        return (
          <div className="ulw-entry ulw-app-code" key={entry.id}>
            <code>{entry.text}</code>
          </div>
        )
      })}
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
      {/* The app's running line ("Working for 4m 8s" in desktop app.png),
          with a run-progress track filling as the goal advances. */}
      <div className="ulw-app-working">
        <span className="ulw-app-step">
          <span className="ulw-spinner" aria-hidden="true" />
          Working for {scene.elapsed}
        </span>
        <span className="ulw-run-progress" aria-hidden="true">
          <span
            style={{
              transform: `scaleX(${(sceneIndex + 1) / ULW_DEMO_SCENES.length})`,
            }}
          />
        </span>
      </div>

      <div className="ulw-app-goal">
        <UlwIcon name="target" />
        <strong>Pursuing goal</strong>
        <span>{scene.composer}</span>
        <span className="ulw-app-goal-elapsed">{scene.elapsed}</span>
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

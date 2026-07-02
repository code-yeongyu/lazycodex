import type { JSX } from "react"
import {
  ULW_DEMO_ENVIRONMENT,
  ULW_DEMO_PROOFS,
  ULW_DEMO_STEPS,
  ULW_DEMO_WORKERS,
  type UlwScene,
} from "../../../lib/ulw-demo-scenes"

/**
 * Presentational panes for the Codex window. Pure functions of the active
 * scene — every visible string comes from `lib/ulw-demo-scenes.ts`
 * (source-grounded, see .omo/evidence/copy-ledger.md).
 */

export function WindowChrome(): JSX.Element {
  return (
    <>
      <div className="ulw-menubar" aria-hidden="true">
        <div className="ulw-menubar-left">
          <strong>Codex</strong>
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Window</span>
          <span>Help</span>
        </div>
        <div className="ulw-mode-flag">ULTRAWORK MODE ENABLED!</div>
      </div>
      <div className="ulw-titlebar">
        <span className="ulw-traffic" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <div className="ulw-window-tabs" aria-hidden="true">
          <span className="ulw-window-tab" data-current="true">
            $ulw-loop / ultrawork.md
          </span>
          <span className="ulw-window-tab" data-current="false">
            Subagents
          </span>
        </div>
      </div>
    </>
  )
}

export function TranscriptPane({
  scene,
  sceneIndex,
}: {
  readonly scene: UlwScene
  readonly sceneIndex: number
}): JSX.Element {
  return (
    <section className="ulw-transcript" aria-label="Ultrawork root orchestration surface">
      <div className="ulw-command">
        <span aria-hidden="true">$</span>
        <strong>
          {scene.command}
          <span className="ulw-caret" aria-hidden="true" />
        </strong>
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

      <div className="ulw-steps" aria-label="Ultrawork workflow stages">
        {ULW_DEMO_STEPS.map((step, index) => (
          <div className="ulw-step" data-active={index === sceneIndex} key={step.heading}>
            <span className="ulw-step-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{step.heading}</strong>
              <p>{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ulw-proofs" aria-label="Evidence captured so far">
        {ULW_DEMO_PROOFS.map((proof, index) => (
          <span className="ulw-proof" data-active={index <= scene.proof} key={proof}>
            {proof}
          </span>
        ))}
      </div>
    </section>
  )
}

export function ComposerBar({ scene }: { readonly scene: UlwScene }): JSX.Element {
  return (
    <div className="ulw-composer">
      <span aria-hidden="true">+</span>
      <span className="ulw-composer-text">{scene.composer}</span>
      <span className="ulw-composer-meta">Full access</span>
      <span className="ulw-composer-meta">5.5 High</span>
      <span className="ulw-composer-send" aria-hidden="true" />
    </div>
  )
}

export function SideRail({ scene }: { readonly scene: UlwScene }): JSX.Element {
  return (
    <aside className="ulw-side" aria-label="Ultrawork worker lanes">
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

      <div className="ulw-side-card">
        <strong className="text-[12px] font-semibold">{scene.sideTitle}</strong>
        <span className="text-[11px] leading-snug text-[color:var(--codex-window-text-soft)]">
          {scene.sideBody}
        </span>
      </div>

      <div className="ulw-side-card ulw-ledger">
        <span className="ulw-side-heading">goals.json / ledger.jsonl</span>
        <pre>{scene.ledger}</pre>
        <pre>{scene.json}</pre>
      </div>
    </aside>
  )
}

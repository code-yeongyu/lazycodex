import type { JSX } from "react"
import { SITE_CONFIG } from "../../../lib/site-config"
import { ULW_DEMO_SCENES } from "../../../lib/ulw-demo-scenes"
import { UlwIcon, type UlwIconName } from "./window-icons"

/**
 * Window chrome for the Codex-desktop demo: left session sidebar plus the
 * per-session title bar. Anatomy mirrors the real app frames
 * (.omo/reference/app-frames/creation-03.png): traffic lights above a nav
 * list, then Pinned and Projects session groups. The Projects session rows
 * ARE the scene navigation — the app-native replacement for a tab strip —
 * so they are plain buttons carrying aria-current, not a fake tablist.
 */

const SIDEBAR_NAV: readonly { icon: UlwIconName; label: string }[] = [
  { icon: "compose", label: "New chat" },
  { icon: "search", label: "Search" },
  { icon: "plugins", label: "Plugins" },
  { icon: "clock", label: "Automations" },
]

export function WindowSidebar({
  sceneIndex,
  onSelectScene,
}: {
  readonly sceneIndex: number
  readonly onSelectScene: (index: number) => void
}): JSX.Element {
  return (
    <aside className="ulw-app-sidebar">
      <span className="ulw-traffic" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>

      <div className="ulw-app-nav" aria-hidden="true">
        {SIDEBAR_NAV.map((item) => (
          <span className="ulw-app-row" key={item.label}>
            <UlwIcon name={item.icon} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="ulw-app-group" aria-hidden="true">
        <span className="ulw-app-group-label">Pinned</span>
        <span className="ulw-app-row">
          <UlwIcon name="terminal" />
          {SITE_CONFIG.ultraworkExample}
        </span>
      </div>

      <nav className="ulw-app-group" aria-label="Demo scenes">
        <span className="ulw-app-group-label" aria-hidden="true">
          Projects
        </span>
        <span className="ulw-app-row" aria-hidden="true">
          <UlwIcon name="folder" />
          {SITE_CONFIG.wordmark}
        </span>
        {ULW_DEMO_SCENES.map((scene, index) => (
          <button
            type="button"
            className="ulw-app-session"
            key={scene.key}
            aria-current={index === sceneIndex ? "true" : undefined}
            onClick={() => onSelectScene(index)}
          >
            {scene.tab}
          </button>
        ))}
        <span className="ulw-app-row ulw-app-showmore" aria-hidden="true">
          Show more
        </span>
      </nav>
    </aside>
  )
}

export function WindowTitlebar({
  sceneTab,
  playing,
  windowTheme,
  onTogglePlay,
  onReplay,
  onToggleTheme,
}: {
  readonly sceneTab: string
  readonly playing: boolean
  readonly windowTheme: "light" | "dark"
  readonly onTogglePlay: () => void
  readonly onReplay: () => void
  readonly onToggleTheme: () => void
}): JSX.Element {
  return (
    <header className="ulw-app-titlebar">
      <span className="ulw-app-title">{sceneTab}</span>
      <span className="ulw-app-title-dots" aria-hidden="true">
        ⋯
      </span>
      <div className="ulw-app-controls" role="group" aria-label="Demo playback controls">
        <button
          type="button"
          className="ulw-app-control"
          aria-pressed={playing}
          aria-label={playing ? "Pause the demo" : "Play the demo"}
          onClick={onTogglePlay}
        >
          <UlwIcon name={playing ? "pause" : "play"} />
        </button>
        <button
          type="button"
          className="ulw-app-control"
          aria-label="Replay the demo from the first scene"
          onClick={onReplay}
        >
          <UlwIcon name="replay" />
        </button>
        <button
          type="button"
          className="ulw-app-control"
          aria-pressed={windowTheme === "dark"}
          aria-label="Toggle the dark window theme"
          onClick={onToggleTheme}
        >
          <UlwIcon name="moon" />
        </button>
      </div>
    </header>
  )
}

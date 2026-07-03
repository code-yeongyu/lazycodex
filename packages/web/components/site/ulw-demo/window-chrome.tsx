import type { JSX } from "react"
import { SITE_CONFIG } from "../../../lib/site-config"
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

export function WindowSidebar(): JSX.Element {
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

      {/* ONE session pursuing one goal — constant across every scene, like a
          real 30h+ run. Scene navigation lives on the footer step pill. */}
      <nav className="ulw-app-group" aria-label="Sessions">
        <span className="ulw-app-group-label" aria-hidden="true">
          Projects
        </span>
        <span className="ulw-app-row" aria-hidden="true">
          <UlwIcon name="folder" />
          {SITE_CONFIG.wordmark}
        </span>
        <span className="ulw-app-session ulw-app-session-active" aria-current="true">
          <span className="ulw-app-session-dot" aria-hidden="true" />
          {SITE_CONFIG.ultraworkExample}
        </span>
        <span className="ulw-app-row ulw-app-showmore" aria-hidden="true">
          Show more
        </span>
      </nav>
    </aside>
  )
}

export function WindowTitlebar({
  sceneTab,
}: {
  readonly sceneTab: string
}): JSX.Element {
  return (
    <header className="ulw-app-titlebar">
      <span className="ulw-app-title">{sceneTab}</span>
      <span className="ulw-app-title-dots" aria-hidden="true">
        ⋯
      </span>
    </header>
  )
}

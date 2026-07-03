"use client"

import { useEffect, useRef, useState, type JSX } from "react"
import { ULW_DEMO_AUTOPLAY_MS, ULW_DEMO_SCENES } from "../../../lib/ulw-demo-scenes"
import { WindowSidebar, WindowTitlebar } from "./window-chrome"
import { SidePanel, TranscriptPane, WindowFooter } from "./window-panes"

/**
 * Scene state machine for the Codex-desktop window (DESIGN.md § CodexWindow),
 * rebuilt to the real app anatomy (.omo/reference/app-frames/): sidebar with
 * session rows, transcript, decorative composer, subagents panel. Playback is
 * screen-recording-like: a thin scaleX progress bar plus play/pause/replay in
 * the title bar; sidebar session rows jump straight to a scene. Autoplay arms
 * on scroll-into-view and never starts under prefers-reduced-motion (static
 * scene 0 + play affordance). Scene 0 is server-rendered.
 */
export function CodexWindow(): JSX.Element {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [windowTheme, setWindowTheme] = useState<"light" | "dark">("light")
  const rootRef = useRef<HTMLDivElement | null>(null)
  const scene = ULW_DEMO_SCENES[sceneIndex % ULW_DEMO_SCENES.length] ?? ULW_DEMO_SCENES[0]

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const node = rootRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPlaying(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () => setSceneIndex((index) => (index + 1) % ULW_DEMO_SCENES.length),
      ULW_DEMO_AUTOPLAY_MS,
    )
    return () => window.clearInterval(timer)
  }, [playing])

  function selectScene(index: number): void {
    setSceneIndex(index)
    setPlaying(false)
  }

  function replay(): void {
    setSceneIndex(0)
    setPlaying(true)
  }

  return (
    <div ref={rootRef} className="flex w-full flex-col items-center">
      <div className="ulw-window ulw-app" data-window-theme={windowTheme}>
        {/* Per-scene playback progress: transform-only (compositor-safe),
            paused via animation-play-state, remounted per scene key. */}
        <div className="ulw-app-progress" aria-hidden="true">
          <span
            key={scene.key}
            data-playing={playing}
            style={{ animationDuration: `${ULW_DEMO_AUTOPLAY_MS}ms` }}
          />
        </div>
        <div className="ulw-app-frame">
          <WindowSidebar sceneIndex={sceneIndex} onSelectScene={selectScene} />
          <section className="ulw-app-main" aria-label="Ultrawork root orchestration surface">
            <WindowTitlebar
              sceneTab={scene.tab}
              playing={playing}
              windowTheme={windowTheme}
              onTogglePlay={() => setPlaying((value) => !value)}
              onReplay={replay}
              onToggleTheme={() =>
                setWindowTheme((theme) => (theme === "light" ? "dark" : "light"))
              }
            />
            <TranscriptPane scene={scene} />
            <WindowFooter scene={scene} sceneIndex={sceneIndex} />
          </section>
          <SidePanel scene={scene} />
        </div>
      </div>
    </div>
  )
}

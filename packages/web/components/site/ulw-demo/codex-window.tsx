"use client"

import { useEffect, useRef, useState, type JSX } from "react"
import { ULW_DEMO_AUTOPLAY_MS, ULW_DEMO_SCENES } from "../../../lib/ulw-demo-scenes"
import { WindowSidebar, WindowTitlebar } from "./window-chrome"
import { SidePanel, TranscriptPane, WindowFooter } from "./window-panes"

/**
 * Scene machine for the Codex-desktop window (DESIGN.md § CodexWindow),
 * built to the real app anatomy (.omo/reference/app-frames/): sidebar with
 * the run's single session, transcript, decorative composer, subagents
 * panel. The demo is a STAGED RECORDING, not a widget: no controls anywhere
 * — it arms on scroll-into-view, autoplays through the 8 scenes on a fast
 * interval, and loops forever. Under prefers-reduced-motion it never starts
 * (static scene 0). Scene 0 is server-rendered; the window theme is fixed
 * dark (the site's elevated-layer language).
 */
export function CodexWindow(): JSX.Element {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
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

  return (
    <div ref={rootRef} className="flex w-full flex-col items-center">
      <div className="ulw-window ulw-app" data-window-theme="dark">
        <div className="ulw-app-frame">
          <WindowSidebar />
          <section className="ulw-app-main" aria-label="Ultrawork root orchestration surface">
            <WindowTitlebar sceneTab={scene.tab} />
            <TranscriptPane scene={scene} />
            <WindowFooter scene={scene} sceneIndex={sceneIndex} />
          </section>
          <SidePanel scene={scene} />
        </div>
      </div>
    </div>
  )
}

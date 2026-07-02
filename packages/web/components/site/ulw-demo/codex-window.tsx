"use client"

import { useEffect, useRef, useState, type JSX, type KeyboardEvent } from "react"
import {
  ULW_DEMO_AUTOPLAY_MS,
  ULW_DEMO_SCENES,
} from "../../../lib/ulw-demo-scenes"
import { ComposerBar, SideRail, TranscriptPane, WindowChrome } from "./window-panes"

/**
 * Scene state machine for the Codex-desktop window (DESIGN.md § CodexWindow).
 * Autoplay arms on scroll-into-view, pauses on any scene interaction, and
 * never starts under prefers-reduced-motion. Scene 0 is server-rendered.
 */
export function CodexWindow(): JSX.Element {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
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

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (delta === 0) return
    event.preventDefault()
    const next = (index + delta + ULW_DEMO_SCENES.length) % ULW_DEMO_SCENES.length
    selectScene(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div ref={rootRef} className="flex w-full flex-col items-center">
      <div className="ulw-window">
        <WindowChrome />
        <div
          className="ulw-content"
          role="tabpanel"
          id="ulw-demo-panel"
          aria-label={`Scene ${sceneIndex + 1} of ${ULW_DEMO_SCENES.length}: ${scene.status}`}
        >
          <TranscriptPane scene={scene} sceneIndex={sceneIndex} />
          <SideRail scene={scene} />
        </div>
        <ComposerBar scene={scene} />
      </div>

      <div className="ulw-controls">
        <button
          type="button"
          className="ulw-control"
          aria-pressed={playing}
          aria-label={playing ? "Pause the scene autoplay" : "Play the scene autoplay"}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? "pause" : "play"}
        </button>
        {/* display:contents keeps the shared flex-wrap layout while giving the
            tablist only tab children (aria-required-children). */}
        <div
          role="tablist"
          aria-label="Ultrawork demo scenes"
          style={{ display: "contents" }}
        >
        {ULW_DEMO_SCENES.map((entry, index) => (
          <button
            type="button"
            className="ulw-control"
            role="tab"
            key={entry.key}
            aria-selected={index === sceneIndex}
            aria-controls="ulw-demo-panel"
            tabIndex={index === sceneIndex ? 0 : -1}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            onClick={() => selectScene(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {entry.tab}
          </button>
        ))}
        </div>
      </div>
    </div>
  )
}

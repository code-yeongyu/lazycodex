"use client"

import { useEffect, useRef, useState, type JSX } from "react"
import {
  ULW_DEMO_ENTRY_MS,
  ULW_DEMO_INITIAL_ENTRIES,
  ULW_DEMO_SCENES,
  ULW_DEMO_TIMELINE,
} from "../../../lib/ulw-demo-scenes"
import { WindowSidebar, WindowTitlebar } from "./window-chrome"
import { SidePanel, TranscriptPane, WindowFooter } from "./window-panes"

const LOOP_REST_MS = 4000

/**
 * Chat-replay machine for the Codex-desktop window (DESIGN.md § CodexWindow).
 * The demo is ONE session: the user's ask opens the transcript and the run
 * appends beneath it — tool rows, prose, code — like the real app following
 * a live session. Non-playable: no controls anywhere. Arms on
 * scroll-into-view, appends on a fast tick, rests briefly at the checkpoint,
 * then loops. prefers-reduced-motion renders the COMPLETED transcript
 * statically. The opening entries are server-rendered; the window theme is
 * fixed dark.
 */
export function CodexWindow(): JSX.Element {
  const [visibleCount, setVisibleCount] = useState(ULW_DEMO_INITIAL_ENTRIES)
  const [playing, setPlaying] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const entries = ULW_DEMO_TIMELINE.slice(0, visibleCount)
  const phase = entries[entries.length - 1]?.phase ?? 0
  const scene = ULW_DEMO_SCENES[phase] ?? ULW_DEMO_SCENES[0]

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static completed run: everything readable, nothing moving.
      setVisibleCount(ULW_DEMO_TIMELINE.length)
      return
    }
    const node = rootRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (observed) => {
        if (observed.some((entry) => entry.isIntersecting)) {
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
    if (visibleCount >= ULW_DEMO_TIMELINE.length) {
      // Rest on the finished checkpoint, then replay from the opening ask.
      const rest = window.setTimeout(
        () => setVisibleCount(ULW_DEMO_INITIAL_ENTRIES),
        LOOP_REST_MS,
      )
      return () => window.clearTimeout(rest)
    }
    const tick = window.setTimeout(
      () => setVisibleCount((count) => count + 1),
      ULW_DEMO_ENTRY_MS,
    )
    return () => window.clearTimeout(tick)
  }, [playing, visibleCount])

  return (
    <div ref={rootRef} className="flex w-full flex-col items-center">
      <div className="ulw-window ulw-app" data-window-theme="dark">
        <div className="ulw-app-frame">
          <WindowSidebar />
          <section className="ulw-app-main" aria-label="Ultrawork root orchestration surface">
            <WindowTitlebar sceneTab={scene.tab} />
            <TranscriptPane entries={entries} />
            <WindowFooter scene={scene} sceneIndex={phase} />
          </section>
          <SidePanel key={scene.key} scene={scene} />
        </div>
      </div>
    </div>
  )
}

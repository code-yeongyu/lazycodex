import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "LazyCodex AI splash — Codex for no-brainers. Coming June 2026."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const palette = {
  surfaceBase: "#14154d",
  cardBase: "#2a2dbf",
  brandCore: "#5a5fef",
  brandMid: "#3236c4",
  brandOuter: "#232897",
  textPrimary: "#ffffff",
  textSecondary: "#dcdcf8",
  textTertiary: "#b9bce6",
  textSoft: "#e8e8ff",
  textMuted: "rgba(255, 255, 255, 0.72)",
} as const

export default function OgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: palette.cardBase,
          backgroundImage: `radial-gradient(120% 100% at 60% 65%, ${palette.brandCore} 0%, #4a4fe0 35%, ${palette.brandMid} 70%, ${palette.brandOuter} 100%)`,
          color: palette.textPrimary,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "150px",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: palette.textSoft,
              fontSize: "15px",
              fontWeight: 500,
              letterSpacing: "5px",
              textTransform: "uppercase",
              fontFamily: "monospace",
              opacity: 0.9,
            }}
          >
            CODEX FOR NO-BRAINERS
          </div>
          <div
            style={{
              marginTop: "34px",
              color: palette.textPrimary,
              fontSize: "168px",
              fontWeight: 500,
              letterSpacing: "-6px",
              lineHeight: 0.95,
            }}
          >
            LazyCodex AI
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "26px",
              color: palette.textMuted,
              fontSize: "34px",
              fontWeight: 400,
              lineHeight: 1.35,
            }}
          >
            <div>You don't need to think.</div>
            <div style={{ display: "flex" }}>
              <span>Just prompt with&nbsp;</span>
              <span style={{ color: palette.textPrimary, fontWeight: 500 }}>ultrawork</span>
              <span>.</span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "56px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: palette.textPrimary,
            fontFamily: "monospace",
            fontSize: "22px",
            fontWeight: 500,
            letterSpacing: "0.5px",
            opacity: 0.9,
          }}
        >
          lazycodex.ai
        </div>
      </div>
    ),
    { ...size },
  )
}

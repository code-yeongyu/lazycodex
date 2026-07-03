export const OG_SIZE = { width: 1200, height: 630 } as const

export const OG_PALETTE = {
  surfaceBase: "#0e1012",
  cardBase: "#16181c",
  brandCore: "#22c55e",
  brandMid: "#16a34a",
  brandOuter: "#15803d",
  textPrimary: "#f7f8f8",
  textSecondary: "#b4bcc8",
  textSoft: "#86efac",
  textMuted: "rgba(247, 248, 248, 0.78)",
  accentCyan: "#4ade80",
  accentGlow: "#166534",
  border: "rgba(255, 255, 255, 0.12)",
} as const

export const OG_GRADIENTS = {
  base: `radial-gradient(120% 100% at 60% 65%, rgba(74, 222, 128, 0.10) 0%, rgba(34, 197, 94, 0.06) 35%, rgba(34, 197, 94, 0.03) 70%, rgba(14, 16, 18, 0) 100%)`,
  beam:
    "radial-gradient(55% 55% at 38% -8%, rgba(74,222,128,0.16) 0%, rgba(74,222,128,0.06) 35%, rgba(14,16,18,0) 65%), " +
    "radial-gradient(32% 28% at 55% -5%, rgba(74,222,128,0.10) 0%, rgba(14,16,18,0) 70%)",
  sheen:
    "linear-gradient(118deg, transparent 18%, rgba(74,222,128,0.06) 26%, rgba(74,222,128,0.10) 30%, rgba(74,222,128,0.05) 35%, transparent 45%), " +
    "linear-gradient(112deg, transparent 8%, rgba(34,197,94,0.05) 15%, transparent 28%)",
  pools:
    "radial-gradient(55% 50% at 8% 95%, rgba(34,197,94,0.10), transparent 70%), " +
    "radial-gradient(45% 45% at 95% 40%, rgba(74,222,128,0.08), transparent 70%)",
} as const

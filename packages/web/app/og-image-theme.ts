export const OG_SIZE = { width: 1200, height: 630 } as const

export const OG_PALETTE = {
  surfaceBase: "#f4f6ee",
  cardBase: "#ffffff",
  brandCore: "#22c55e",
  brandMid: "#16a34a",
  brandOuter: "#15803d",
  textPrimary: "#101914",
  textSecondary: "#3f4b43",
  textSoft: "#14532d",
  textMuted: "rgba(16, 25, 20, 0.75)",
  accentCyan: "#15803d",
  accentGlow: "#bbf7d0",
  border: "rgba(16, 25, 20, 0.12)",
} as const

export const OG_GRADIENTS = {
  base: `radial-gradient(120% 100% at 60% 65%, rgba(134, 239, 172, 0.18) 0%, rgba(34, 197, 94, 0.10) 35%, rgba(22, 163, 74, 0.05) 70%, rgba(244, 246, 238, 0) 100%)`,
  beam:
    "radial-gradient(55% 55% at 38% -8%, rgba(134,239,172,0.30) 0%, rgba(74,222,128,0.12) 35%, rgba(255,255,255,0) 65%), " +
    "radial-gradient(32% 28% at 55% -5%, rgba(134,239,172,0.20) 0%, rgba(255,255,255,0) 70%)",
  sheen:
    "linear-gradient(118deg, transparent 18%, rgba(134,239,172,0.10) 26%, rgba(134,239,172,0.18) 30%, rgba(134,239,172,0.08) 35%, transparent 45%), " +
    "linear-gradient(112deg, transparent 8%, rgba(74,222,128,0.08) 15%, transparent 28%)",
  pools:
    "radial-gradient(55% 50% at 8% 95%, rgba(34,197,94,0.14), transparent 70%), " +
    "radial-gradient(45% 45% at 95% 40%, rgba(134,239,172,0.12), transparent 70%)",
} as const

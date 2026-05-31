import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LazyCodex AI",
    short_name: "LazyCodex AI",
    description: "Codex for no-brainers. Just prompt with ultrawork.",
    start_url: "/",
    display: "standalone",
    background_color: "#14154d",
    theme_color: "#2a2dbf",
    // No icons array: the browser favicon comes from the app/icon.png file
    // convention; duplicating it here triggers a second eager favicon fetch
    // that lands on the Lantern LCP critical path. PWA installability isn't a
    // goal for this marketing site.
  }
}

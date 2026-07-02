import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LazyCodex",
    short_name: "LazyCodex",
    description: "Agent harness for complex codebases inside Codex.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6ee",
    theme_color: "#15803d",
    // No icons array: the browser favicon comes from the app/icon.svg file
    // convention; duplicating it here triggers a second eager favicon fetch
    // that lands on the Lantern LCP critical path. PWA installability isn't a
    // goal for this marketing site.
  }
}

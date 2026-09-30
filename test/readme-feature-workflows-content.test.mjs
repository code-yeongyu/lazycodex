import { readFileSync } from "node:fs"
import test from "node:test"
import assert from "node:assert/strict"

const README = readFileSync("README.md", "utf8")

test("README documents built-in LazyCodex workflows", () => {
  const requiredSnippets = [
    "Use the built-in workflows",
    "$init-deep",
    "project memory",
    "$ulw-plan",
    "$start-work",
    "$ulw-loop",
    "review-work",
    "remove-ai-slops",
    "agent_type",
    "lazycodex-ai doctor",
    "lazycodex-ai uninstall",
    "https://lazycodex.ai",
  ]

  assert.doesNotMatch(README, /`\/init-deep`/)

  for (const snippet of requiredSnippets) {
    assert.match(README, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }

})

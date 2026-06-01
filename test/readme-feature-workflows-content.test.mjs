import { readFileSync } from "node:fs"
import test from "node:test"
import assert from "node:assert/strict"

const README = readFileSync("README.md", "utf8")
const HANGUL_PATTERN = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u

test("README documents built-in LazyCodex workflows without Hangul", () => {
  const requiredSnippets = [
    "Use the built-in workflows",
    "/init-deep",
    "project memory",
    "$ulw-plan",
    "$start-work",
    "$ulw-loop",
    ".omo/plans/<slug>.md",
    ".omo/boulder.json",
    "review-work",
    "remove-ai-slops",
    "https://lazycodex.ai",
  ]

  for (const snippet of requiredSnippets) {
    assert.match(README, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  }

  assert.doesNotMatch(README, HANGUL_PATTERN)
})

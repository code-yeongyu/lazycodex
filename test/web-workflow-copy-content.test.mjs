import { readFileSync } from "node:fs"
import test from "node:test"
import assert from "node:assert/strict"

const SITE_CONFIG_SOURCE = readFileSync("packages/web/lib/site-config.ts", "utf8")
const COMMANDS_SOURCE = readFileSync("packages/web/lib/commands.ts", "utf8")

test("web workflow copy documents the start-work final gate", () => {
  const requiredSiteConfigSnippets = [
    "$start-work executes",
    "durable Boulder progress",
    "blocks completion",
    "global review/debugging gate",
  ]
  const requiredCommandSnippets = [
    "final review/debugging gate",
    "Global review + debugging gate blocks completion and PR handoff",
    "ORCHESTRATION COMPLETE only after the gate passes",
  ]

  for (const snippet of requiredSiteConfigSnippets) {
    assert.match(SITE_CONFIG_SOURCE, escapedPattern(snippet))
  }

  for (const snippet of requiredCommandSnippets) {
    assert.match(COMMANDS_SOURCE, escapedPattern(snippet))
  }
})

function escapedPattern(snippet) {
  return new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
}

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

const workflowDir = join(process.cwd(), ".github", "workflows")
const bannedWorkflowPatterns = [
  [/node-version:\s*["']?22["']?/, "Node 22 runtime"],
  [/actions\/checkout@v4\b/, "actions/checkout@v4"],
  [/actions\/setup-node@v4\b/, "actions/setup-node@v4"],
  [/actions\/cache@v4\b/, "actions/cache@v4"],
  [/actions\/upload-artifact@v4\b/, "actions/upload-artifact@v4"],
  [/pnpm\/action-setup@v4\b/, "pnpm/action-setup@v4"],
  [/browser-actions\/setup-chrome@v1\b/, "browser-actions/setup-chrome@v1"],
  [/cloudflare\/wrangler-action@v3\b/, "cloudflare/wrangler-action@v3"],
]

test("GitHub workflows use the current Node and action major versions", () => {
  const offenders = []

  for (const file of readdirSync(workflowDir).filter((name) => /\.ya?ml$/.test(name))) {
    const text = readFileSync(join(workflowDir, file), "utf8")

    for (const [pattern, label] of bannedWorkflowPatterns) {
      if (pattern.test(text)) offenders.push(`${file}: ${label}`)
    }
  }

  assert.deepEqual(offenders, [], `deprecated workflow pins: ${offenders.join(", ")}`)
})

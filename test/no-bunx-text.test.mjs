import { execFileSync } from "node:child_process"
import { readFileSync, statSync } from "node:fs"
import test from "node:test"
import assert from "node:assert/strict"

const BANNED_RUNNER_TOKEN = ["bu", "nx"].join("")
const BANNED_STALE_COMMANDS = [
  ["npx", "lazycodex", "install"].join(" "),
  ["npx", "omo", "install", "--platform=codex"].join(" "),
]
const IGNORED_PREFIXES = [".omo/", "plugins/omo/"]

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter((file) => file.length > 0)
    .filter((file) => !IGNORED_PREFIXES.some((prefix) => file.startsWith(prefix)))
}

function isBinary(buffer) {
  return buffer.includes(0)
}

test("tracked text files use npx instead of the old package runner", () => {
  const offenders = []

  for (const file of trackedFiles()) {
    const stat = statSync(file, { throwIfNoEntry: false })
    if (!stat?.isFile()) continue

    const buffer = readFileSync(file)
    if (isBinary(buffer)) continue

    const text = buffer.toString("utf8").toLowerCase()
    if (text.includes(BANNED_RUNNER_TOKEN)) {
      offenders.push(`${file}: old package runner`)
      continue
    }

    for (const command of BANNED_STALE_COMMANDS) {
      if (text.includes(command)) offenders.push(`${file}: ${command}`)
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `tracked text files with old package runner: ${offenders.join(", ")}`,
  )
})

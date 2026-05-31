#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const version = process.env.LAZYCODEX_AI_SMOKE_VERSION || "latest"
const packageSpec = `lazycodex-ai@${version}`
const tempDir = mkdtempSync(join(tmpdir(), "lazycodex-ai-smoke-"))

function commandName(name) {
  return process.platform === "win32" ? `${name}.cmd` : name
}

function runSmoke({ label, command, args, expectedStdout }) {
  console.log(`::group::${label}`)
  console.log(`cwd: ${tempDir}`)
  console.log(`$ ${[command, ...args].join(" ")}`)

  const result = spawnSync(commandName(command), args, {
    cwd: tempDir,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_yes: "true",
    },
  })

  const stdout = result.stdout.trim()
  const stderr = result.stderr.trim()

  if (stdout) console.log(stdout)
  if (stderr) console.error(stderr)
  console.log("::endgroup::")

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${label} exited with status ${result.status}`)
  }
  if (stdout !== expectedStdout) {
    throw new Error(`${label} printed unexpected stdout:\nexpected: ${expectedStdout}\nactual:   ${stdout}`)
  }
}

try {
  runSmoke({
    label: "bunx install dry-run",
    command: "bunx",
    args: [packageSpec, "--dry-run", "install", "--no-tui", "--codex-autonomous"],
    expectedStdout: "bunx --package oh-my-openagent omo install --platform=codex --no-tui --codex-autonomous",
  })

  runSmoke({
    label: "npx doctor dry-run",
    command: "npx",
    args: ["-y", packageSpec, "--dry-run", "doctor"],
    expectedStdout: "bunx --package oh-my-openagent omo doctor",
  })
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

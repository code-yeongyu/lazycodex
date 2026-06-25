#!/usr/bin/env node

import { spawnSync } from "node:child_process"

const args = process.argv.slice(2)
const dryRun = args[0] === "--dry-run"
const forwardedArgs = dryRun ? args.slice(1) : args
const DEFAULT_PLATFORMS = ["codex", "claude-code", "gemini"]
const ALL_PLATFORM_ALIASES = new Set(["all", "multi", "all-platforms", "*"])
const CODEX_ONLY_ARGS = new Set(["--codex-autonomous"])

function parseInstallArgs(values) {
  const platforms = []
  const passthrough = []
  let allPlatforms = false

  for (let i = 0; i < values.length; i += 1) {
    const arg = values[i]
    if (arg === "--all-platforms") {
      allPlatforms = true
      continue
    }
    if (arg === "--platform") {
      const value = values[i + 1]
      if (!value) {
        passthrough.push(arg)
        continue
      }
      i += 1
      if (ALL_PLATFORM_ALIASES.has(value)) {
        allPlatforms = true
      } else {
        platforms.push(value)
      }
      continue
    }
    if (arg.startsWith("--platform=")) {
      const value = arg.slice("--platform=".length)
      if (ALL_PLATFORM_ALIASES.has(value)) {
        allPlatforms = true
      } else {
        platforms.push(value)
      }
      continue
    }
    passthrough.push(arg)
  }

  const targets = allPlatforms || platforms.length === 0 ? DEFAULT_PLATFORMS : [...new Set(platforms)]
  return { targets, passthrough }
}

function argsForPlatform(platform, passthrough) {
  const safeArgs = platform === "codex" ? passthrough : passthrough.filter((arg) => !CODEX_ONLY_ARGS.has(arg))
  return [
    "--yes",
    "--package",
    "oh-my-openagent",
    "omo",
    "install",
    `--platform=${platform}`,
    ...safeArgs,
  ]
}

function buildInstallCommands(values) {
  const { targets, passthrough } = parseInstallArgs(values)
  return targets.map((platform) => argsForPlatform(platform, passthrough))
}

const installArgs = forwardedArgs.slice(1)
const commands =
  forwardedArgs[0] === "install"
    ? buildInstallCommands(installArgs)
    : [["--yes", "--package", "oh-my-openagent", "omo", ...forwardedArgs]]

if (dryRun) {
  console.log(commands.map((commandArgs) => ["npx", ...commandArgs].join(" ")).join("\n"))
  process.exit(0)
}

for (const commandArgs of commands) {
  const result = spawnSync("npx", commandArgs, {
    stdio: "inherit",
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1)
  }
}

process.exit(0)

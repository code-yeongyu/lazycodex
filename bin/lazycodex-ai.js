#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { existsSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { basename, delimiter, join } from "node:path"

const args = process.argv.slice(2)
const dryRun = args[0] === "--dry-run"
const forwardedArgs = dryRun ? args.slice(1) : args
const isInstall = forwardedArgs[0] === "install"
const commandArgs =
  isInstall
    ? ["--package", "oh-my-openagent", "omo", "install", "--platform=codex", ...forwardedArgs.slice(1)]
    : ["--package", "oh-my-openagent", "omo", ...forwardedArgs]
const cleanupCommands = [
  ["omx", ["uninstall", "--purge"]],
  ["npm", ["uninstall", "-g", "oh-my-codex"]],
]
const residuePaths = [
  join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "plugins", "cache", "oh-my-codex-local"),
  join(process.cwd(), ".omx"),
]

function findCommand(command) {
  const extensions = process.platform === "win32" ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";") : [""]
  const names = extensions.map((extension) => `${command}${extension.toLowerCase() === command.toLowerCase().slice(-extension.length) ? "" : extension}`)

  for (const directory of (process.env.PATH ?? "").split(delimiter)) {
    for (const name of names) {
      const path = join(directory, name)

      if (existsSync(path)) {
        return path
      }
    }
  }

  return ""
}

function runCommand(command, args) {
  return spawnSync(command, args, {
    stdio: "inherit",
  })
}

function removePath(path) {
  rmSync(path, { recursive: true, force: true })
}

if (dryRun) {
  if (isInstall) {
    for (const [command, args] of cleanupCommands) {
      console.log([command, ...args].join(" "))
    }
  }

  console.log(["bunx", ...commandArgs].join(" "))
  process.exit(0)
}

if (isInstall) {
  const commands = findCommand("omx") ? cleanupCommands : cleanupCommands.slice(1)

  for (const [command, args] of commands) {
    const cleanup = runCommand(command, args)

    if (cleanup.error) {
      console.error(`oh-my-codex cleanup failed: ${cleanup.error.message}`)
      process.exit(1)
    }

    if ((cleanup.status ?? 1) !== 0) {
      console.error(`oh-my-codex cleanup failed: ${command} ${args.join(" ")}`)
      process.exit(1)
    }
  }

  for (const path of residuePaths) {
    removePath(path)
  }

  const remainingOmxPath = findCommand("omx")

  if (remainingOmxPath) {
    if (basename(remainingOmxPath) === "omx") {
      removePath(remainingOmxPath)
    }
  }

  const verifiedOmxPath = findCommand("omx")

  if (verifiedOmxPath) {
    console.error(`oh-my-codex cleanup failed: omx is still installed at ${verifiedOmxPath}`)
    process.exit(1)
  }
}

const result = runCommand("bunx", commandArgs)

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)

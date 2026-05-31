#!/usr/bin/env node

import { spawnSync } from "node:child_process"

const args = process.argv.slice(2)
const dryRun = args[0] === "--dry-run"
const forwardedArgs = dryRun ? args.slice(1) : args
const commandArgs =
  forwardedArgs[0] === "install"
    ? ["--package", "@code-yeongyu/lazycodex", "lazycodex", "install", ...forwardedArgs.slice(1)]
    : ["--package", "@code-yeongyu/lazycodex", "lazycodex", ...forwardedArgs]

if (dryRun) {
  console.log(["bunx", ...commandArgs].join(" "))
  process.exit(0)
}

const result = spawnSync("bunx", commandArgs, {
  stdio: "inherit",
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)

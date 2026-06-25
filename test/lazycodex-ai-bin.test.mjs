import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"

const root = new URL("..", import.meta.url).pathname
const packageJsonPath = join(root, "package.json")
const packageLockPath = join(root, "package-lock.json")
const publishWorkflowPath = join(root, ".github", "workflows", "npm-publish.yml")
const binPath = join(root, "bin", "lazycodex-ai.js")
const releaseVersion = "0.2.2"

describe("lazycodex-ai npm package", () => {
  it("maps the package name and bin to lazycodex-ai", () => {
    // given
    assert.equal(existsSync(packageJsonPath), true, "root package.json must exist")

    // when
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"))

    // then
    assert.equal(manifest.name, "lazycodex-ai")
    assert.equal(manifest.version, releaseVersion)
    assert.equal(manifest.bin?.["lazycodex-ai"], "bin/lazycodex-ai.js")
    assert.equal(manifest.private, undefined)
  })

  it("keeps publish metadata aligned with the release version", () => {
    // given
    assert.equal(existsSync(packageJsonPath), true, "root package.json must exist")
    assert.equal(existsSync(packageLockPath), true, "package-lock.json must exist")
    assert.equal(existsSync(publishWorkflowPath), true, "npm publish workflow must exist")

    // when
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"))
    const lockfile = JSON.parse(readFileSync(packageLockPath, "utf8"))
    const publishWorkflow = readFileSync(publishWorkflowPath, "utf8")

    // then
    assert.equal(manifest.version, releaseVersion)
    assert.equal(lockfile.version, releaseVersion)
    assert.equal(lockfile.packages?.[""]?.version, releaseVersion)
    assert.match(publishWorkflow, new RegExp(`default: "${releaseVersion}"`))
  })

  it("dry-runs install through oh-my-openagent for Codex, Claude Code, and Gemini by default", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    // when
    const result = spawnSync(
      process.execPath,
      [binPath, "--dry-run", "install", "--no-tui", "--codex-autonomous"],
      { cwd: root, encoding: "utf8" },
    )

    // then
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(result.stdout.trim().split("\n"), [
      "npx --yes --package oh-my-openagent omo install --platform=codex --no-tui --codex-autonomous",
      "npx --yes --package oh-my-openagent omo install --platform=claude-code --no-tui",
      "npx --yes --package oh-my-openagent omo install --platform=gemini --no-tui",
    ])
  })

  it("preserves explicit install platform targets", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    // when
    const result = spawnSync(
      process.execPath,
      [binPath, "--dry-run", "install", "--platform=claude-code", "--no-tui"],
      { cwd: root, encoding: "utf8" },
    )

    // then
    assert.equal(result.status, 0, result.stderr)
    assert.equal(
      result.stdout.trim(),
      "npx --yes --package oh-my-openagent omo install --platform=claude-code --no-tui",
    )
  })

  it("preserves explicit install platform targets passed as a separate value", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    // when
    const result = spawnSync(
      process.execPath,
      [binPath, "--dry-run", "install", "--platform", "gemini", "--no-tui"],
      { cwd: root, encoding: "utf8" },
    )

    // then
    assert.equal(result.status, 0, result.stderr)
    assert.equal(
      result.stdout.trim(),
      "npx --yes --package oh-my-openagent omo install --platform=gemini --no-tui",
    )
  })

  it("expands --platform=all into every supported platform target", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    // when
    const result = spawnSync(
      process.execPath,
      [binPath, "--dry-run", "install", "--platform=all", "--no-tui"],
      { cwd: root, encoding: "utf8" },
    )

    // then
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(result.stdout.trim().split("\n"), [
      "npx --yes --package oh-my-openagent omo install --platform=codex --no-tui",
      "npx --yes --package oh-my-openagent omo install --platform=claude-code --no-tui",
      "npx --yes --package oh-my-openagent omo install --platform=gemini --no-tui",
    ])
  })

  it("dry-runs non-install commands through oh-my-openagent", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    // when
    const result = spawnSync(process.execPath, [binPath, "--dry-run", "doctor"], {
      cwd: root,
      encoding: "utf8",
    })

    // then
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), "npx --yes --package oh-my-openagent omo doctor")
  })
})

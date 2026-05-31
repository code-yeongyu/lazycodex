import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"

const root = new URL("..", import.meta.url).pathname
const packageJsonPath = join(root, "package.json")
const binPath = join(root, "bin", "lazycodex-ai.js")
const installDocPaths = [
  "README.md",
  "packages/web/content/docs/installation.md",
  "plugins/omo/components/comment-checker/README.md",
  "plugins/omo/components/lsp/README.md",
  "plugins/omo/components/rules/README.md",
  "plugins/omo/components/ultragoal/README.md",
  "plugins/omo/components/ultrawork/README.md",
]

describe("lazycodex-ai npm package", () => {
  it("maps the package name and bin to lazycodex-ai", () => {
    // given
    assert.equal(existsSync(packageJsonPath), true, "root package.json must exist")

    // when
    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"))

    // then
    assert.equal(manifest.name, "lazycodex-ai")
    assert.equal(manifest.version, "0.2.1")
    assert.equal(manifest.bin?.["lazycodex-ai"], "bin/lazycodex-ai.js")
    assert.equal(manifest.private, undefined)
  })

  it("dry-runs install through the scoped LazyCodex package", () => {
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
    assert.equal(
      result.stdout.trim(),
      "bunx --package @code-yeongyu/lazycodex lazycodex install --no-tui --codex-autonomous",
    )
  })

  it("dry-runs non-install commands through the scoped LazyCodex package", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    // when
    const result = spawnSync(process.execPath, [binPath, "--dry-run", "doctor"], {
      cwd: root,
      encoding: "utf8",
    })

    // then
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), "bunx --package @code-yeongyu/lazycodex lazycodex doctor")
  })

  it("documents the scoped package-backed install path", () => {
    for (const docPath of installDocPaths) {
      const text = readFileSync(join(root, docPath), "utf8")

      assert.equal(text.includes("bunx lazycodex install"), false, `${docPath} must not use broken unscoped lazycodex`)
      assert.equal(text.includes("bunx omo install"), false, `${docPath} must not use unrelated unscoped omo`)
      assert.equal(
        text.includes("bunx --package oh-my-openagent omo"),
        false,
        `${docPath} must not route through the unsafe unscoped omo bin`,
      )
    }

    const readme = readFileSync(join(root, "README.md"), "utf8")
    const installationDoc = readFileSync(join(root, "packages/web/content/docs/installation.md"), "utf8")

    assert.equal(readme.includes("bunx --package @code-yeongyu/lazycodex lazycodex install"), true)
    assert.equal(installationDoc.includes("bunx --package @code-yeongyu/lazycodex lazycodex install"), true)
  })
})

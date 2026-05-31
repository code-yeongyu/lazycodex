import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"

const root = new URL("..", import.meta.url).pathname
const packageJsonPath = join(root, "package.json")
const binPath = join(root, "bin", "lazycodex-ai.js")

function withFakeBin(files, run) {
  const tempDir = mkdtempSync(join(tmpdir(), "lazycodex-ai-test-"))

  try {
    for (const [name, contents] of Object.entries(files)) {
      const path = join(tempDir, name)
      writeFileSync(path, contents, { mode: 0o755 })
    }

    return run({
      tempDir,
      PATH: tempDir,
      LAZYCODEX_TEST_LOG: join(tempDir, "commands.log"),
    })
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

const fakeBunx = `#!/bin/sh
printf 'bunx %s\n' "$*" >> "$LAZYCODEX_TEST_LOG"
exit 0
`

const fakeOmx = `#!/bin/sh
printf 'omx %s\n' "$*" >> "$LAZYCODEX_TEST_LOG"
exit 0
`

const fakeNpm = `#!/bin/sh
printf 'npm %s\n' "$*" >> "$LAZYCODEX_TEST_LOG"
exit 0
`

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

  it("dry-runs install through oh-my-openagent with the Codex platform default", () => {
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
      [
        "omx uninstall --purge",
        "npm uninstall -g oh-my-codex",
        "bunx --package oh-my-openagent omo install --platform=codex --no-tui --codex-autonomous",
      ].join("\n"),
    )
  })

  it("removes oh-my-codex before installing lazycodex", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm }, (env) => {

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 0, result.stderr)
      assert.equal(
        readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(),
        [
          "omx uninstall --purge",
          "npm uninstall -g oh-my-codex",
          "bunx --package oh-my-openagent omo install --platform=codex",
        ].join("\n"),
      )
    })
  })

  it("does not remove oh-my-codex before non-install commands", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm }, (env) => {

      // when
      const result = spawnSync(process.execPath, [binPath, "doctor"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 0, result.stderr)
      assert.equal(readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(), "bunx --package oh-my-openagent omo doctor")
    })
  })

  it("aborts install when oh-my-codex cleanup fails", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")
    const failingOmx = `#!/bin/sh
printf 'omx %s\n' "$*" >> "$LAZYCODEX_TEST_LOG"
exit 42
`

    withFakeBin({ bunx: fakeBunx, omx: failingOmx, npm: fakeNpm }, (env) => {

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 1)
      assert.match(result.stderr, /oh-my-codex cleanup failed/)
      assert.equal(readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(), "omx uninstall --purge")
    })
  })

  it("skips omx uninstall when omx is not installed", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, npm: fakeNpm }, (env) => {

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 0, result.stderr)
      assert.equal(
        readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(),
        [
          "npm uninstall -g oh-my-codex",
          "bunx --package oh-my-openagent omo install --platform=codex",
        ].join("\n"),
      )
    })
  })

  it("removes a leftover omx command before installing lazycodex", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm }, (env) => {

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 0, result.stderr)
      assert.equal(
        readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(),
        ["omx uninstall --purge", "npm uninstall -g oh-my-codex", "bunx --package oh-my-openagent omo install --platform=codex"].join("\n"),
      )
    })
  })

  it("removes a leftover omx executable after npm cleanup", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm }, (env) => {
      const staleOmxPath = join(env.tempDir, "omx")

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 0, result.stderr)
      assert.equal(existsSync(staleOmxPath), false, "stale omx executable should be removed")
      assert.equal(
        readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(),
        [
          "omx uninstall --purge",
          "npm uninstall -g oh-my-codex",
          "bunx --package oh-my-openagent omo install --platform=codex",
        ].join("\n"),
      )
      assert.equal(basename(staleOmxPath), "omx")
    })
  })

  it("removes known oh-my-codex residue before installing lazycodex", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, npm: fakeNpm }, (env) => {
      const codexHome = join(env.tempDir, "codex-home")
      const pluginCache = join(codexHome, "plugins", "cache", "oh-my-codex-local")
      const projectOmx = join(env.tempDir, "project", ".omx")
      mkdirSync(pluginCache, { recursive: true })
      mkdirSync(projectOmx, { recursive: true })
      writeFileSync(join(pluginCache, "marker"), "plugin cache")
      writeFileSync(join(projectOmx, "marker"), "project state")

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: join(env.tempDir, "project"),
        encoding: "utf8",
        env: { ...process.env, ...env, CODEX_HOME: codexHome },
      })

      // then
      assert.equal(result.status, 0, result.stderr)
      assert.equal(existsSync(pluginCache), false, "oh-my-codex plugin cache should be removed")
      assert.equal(existsSync(projectOmx), false, "project .omx state should be removed")
      assert.equal(
        readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(),
        [
          "npm uninstall -g oh-my-codex",
          "bunx --package oh-my-openagent omo install --platform=codex",
        ].join("\n"),
      )
    })
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
    assert.equal(result.stdout.trim(), "bunx --package oh-my-openagent omo doctor")
  })
})

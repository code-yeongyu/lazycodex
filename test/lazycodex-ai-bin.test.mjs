import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { describe, it } from "node:test"

const root = new URL("..", import.meta.url).pathname
const packageJsonPath = join(root, "package.json")
const binPath = join(root, "bin", "lazycodex-ai.js")

function withFakeBin(files, run) {
  const tempDir = mkdtempSync(join(tmpdir(), "lazycodex-ai-test-"))
  const commandStatePath = join(tempDir, "omx-paths")

  try {
    for (const [name, contents] of Object.entries(files)) {
      const path = join(tempDir, name)
      writeFileSync(path, contents, { mode: 0o755 })
    }

    return run({
      tempDir,
      PATH: tempDir,
      LAZYCODEX_TEST_LOG: join(tempDir, "commands.log"),
      LAZYCODEX_COMMAND_STATE: commandStatePath,
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

const fakeRm = `#!/bin/sh
printf 'rm %s\n' "$*" >> "$LAZYCODEX_TEST_LOG"
/bin/rm "$@"
`

const fakeWhich = `#!/bin/sh
if [ "$1" != "omx" ] || [ ! -f "$LAZYCODEX_COMMAND_STATE" ]; then
  exit 1
fi

first=$(/usr/bin/sed -n '1p' "$LAZYCODEX_COMMAND_STATE")
/usr/bin/sed '1d' "$LAZYCODEX_COMMAND_STATE" > "$LAZYCODEX_COMMAND_STATE.next"
/bin/mv "$LAZYCODEX_COMMAND_STATE.next" "$LAZYCODEX_COMMAND_STATE"

if [ -n "$first" ]; then
  printf '%s\n' "$first"
  exit 0
fi

exit 1
`

function setOmxLookups(env, paths) {
  writeFileSync(env.LAZYCODEX_COMMAND_STATE, `${paths.join("\n")}\n`)
}

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

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm, which: fakeWhich }, (env) => {
      setOmxLookups(env, ["/tmp/omx", ""])

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

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm, which: fakeWhich }, (env) => {
      setOmxLookups(env, ["/tmp/omx"])

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

    withFakeBin({ bunx: fakeBunx, omx: failingOmx, npm: fakeNpm, which: fakeWhich }, (env) => {
      setOmxLookups(env, ["/tmp/omx"])

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

    withFakeBin({ bunx: fakeBunx, npm: fakeNpm, which: fakeWhich }, (env) => {
      setOmxLookups(env, ["", ""])

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

  it("aborts install when omx is still installed after cleanup", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm, which: fakeWhich }, (env) => {
      setOmxLookups(env, ["/tmp/omx", "/tmp/stale-omx", "/tmp/stale-omx"])

      // when
      const result = spawnSync(process.execPath, [binPath, "install"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
      })

      // then
      assert.equal(result.status, 1)
      assert.match(result.stderr, /omx is still installed at \/tmp\/stale-omx/)
      assert.equal(
        readFileSync(env.LAZYCODEX_TEST_LOG, "utf8").trim(),
        ["omx uninstall --purge", "npm uninstall -g oh-my-codex"].join("\n"),
      )
    })
  })

  it("removes a leftover omx executable after npm cleanup", () => {
    // given
    assert.equal(existsSync(binPath), true, "lazycodex-ai bin must exist")

    withFakeBin({ bunx: fakeBunx, omx: fakeOmx, npm: fakeNpm, which: fakeWhich, rm: fakeRm }, (env) => {
      const staleOmxPath = join(env.tempDir, "omx")
      setOmxLookups(env, [staleOmxPath, staleOmxPath, ""])

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
          `rm ${staleOmxPath}`,
          "bunx --package oh-my-openagent omo install --platform=codex",
        ].join("\n"),
      )
      assert.equal(basename(staleOmxPath), "omx")
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

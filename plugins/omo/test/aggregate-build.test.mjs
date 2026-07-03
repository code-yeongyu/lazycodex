import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { readJson, repoRoot, root } from "./aggregate-plugin-fixture.mjs";

async function pathExists(path) {
	try {
		await stat(path);
		return true;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
		throw error;
	}
}

test("#given aggregate plugin build script #when inspected #then generated assets run before workspace builds", async () => {
	// given
	const packageText = await readFile(join(root, "package.json"), "utf8");
	const packageJson = await readJson("package.json");

	// when
	const buildScript = packageJson.scripts.build;
	const testScript = packageJson.scripts.test;

	// then
	assert.equal(
		buildScript,
		"node scripts/sync-version.mjs && node scripts/sync-hook-status-messages.mjs && node scripts/build-bundled-mcp-runtimes.mjs && node scripts/materialize-shared-upstreams.mjs --strict && node scripts/sync-skills.mjs && node scripts/build-components.mjs",
	);
	assert.match(buildScript, /^node scripts\/sync-version\.mjs &&/);
	assert.match(buildScript, /materialize-shared-upstreams\.mjs --strict && node scripts\/sync-skills\.mjs/);
	assert.equal(testScript, "node ../../scripts/run-node-test-files.mjs");
	assert(packageJson.workspaces.includes("components/ultrawork"));
	assert.doesNotMatch(packageText, /\bpython3?\b|ultrawork-detector\.py/);
});

test("#given omo-codex package build script #when inspected #then delegates to the aggregate plugin package", async (t) => {
	// given
	const packageJsonPath = join(repoRoot, "packages", "omo-codex", "package.json");
	if (!(await pathExists(packageJsonPath))) {
		t.skip("LazyCodex mirror does not include the omo-codex wrapper package");
		return;
	}
	const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

	// when
	const buildPluginScript = packageJson.scripts["build:plugin"];

	// then
	assert.equal(buildPluginScript, "bun run --cwd plugin build");
});

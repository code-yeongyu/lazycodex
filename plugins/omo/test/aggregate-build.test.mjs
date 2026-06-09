import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { readJson, root } from "./aggregate-plugin-fixture.mjs";

test("#given aggregate plugin build script #when inspected #then hook status and telemetry sync run before workspace builds", async () => {
	// given
	const packageText = await readFile(join(root, "package.json"), "utf8");
	const packageJson = await readJson("package.json");
	const telemetrySyncScript = await readFile(join(root, "scripts", "sync-telemetry-component.mjs"), "utf8");

	// when
	const buildScript = packageJson.scripts.build;
	const testScript = packageJson.scripts.test;

	// then
	assert.equal(
		buildScript,
		"node scripts/sync-hook-status-messages.mjs && node scripts/build-bundled-mcp-runtimes.mjs && node scripts/sync-skills.mjs && node scripts/sync-telemetry-component.mjs && node scripts/build-components.mjs",
	);
	assert.equal(testScript, "node --test test/*.test.mjs");
	assert(packageJson.workspaces.includes("components/ultrawork"));
	assert.match(telemetrySyncScript, /sync-telemetry-component\.mjs/);
	assert.match(telemetrySyncScript, /Skipping telemetry component sync/);
	assert.doesNotMatch(packageText, /\bpython3?\b|ultrawork-detector\.py/);
});

test("#given marketplace package build scripts #when inspected #then aggregate plugin build is self-contained", async () => {
	// given
	const packageJson = await readJson("package.json");
	const rootPackageJson = JSON.parse(await readFile(join(root, "..", "..", "package.json"), "utf8"));

	// when
	const aggregateBuildScript = packageJson.scripts.build;
	const rootBuildPluginScript = rootPackageJson.scripts?.["build:plugin"];

	// then
	assert.match(aggregateBuildScript, /node scripts\/build-components\.mjs/);
	assert.equal(rootBuildPluginScript, undefined);
});

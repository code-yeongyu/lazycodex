#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoPackagesRoot = join(pluginRoot, "..", "..");
const bundledComponentsRoot = join(pluginRoot, "components");

const runtimes = [
	{
		label: "lsp-tools-mcp",
		sourceRoot: join(repoPackagesRoot, "lsp-tools-mcp"),
		bundledRoot: join(bundledComponentsRoot, "lsp-tools-mcp"),
		requiredOutputs: ["dist/cli.js", "dist/tools.js"],
	},
	{
		label: "ast-grep-mcp",
		sourceRoot: join(repoPackagesRoot, "ast-grep-mcp"),
		bundledRoot: join(bundledComponentsRoot, "ast-grep-mcp"),
		requiredOutputs: ["dist/cli.js"],
	},
];

for (const runtime of runtimes) {
	buildRuntime(runtime);
}

function buildRuntime(runtime) {
	if (hasRequiredOutputs(runtime.bundledRoot, runtime)) {
		console.log(`Using bundled ${runtime.label} dist`);
		return;
	}

	if (existsSync(join(runtime.bundledRoot, "package.json"))) {
		assertRequiredOutputs(runtime.bundledRoot, runtime);
		return;
	}

	if (!existsSync(join(runtime.sourceRoot, "package.json"))) {
		assertRequiredOutputs(runtime.bundledRoot, runtime);
		return;
	}

	const result = spawnSync("npm", ["run", "build"], {
		cwd: runtime.sourceRoot,
		shell: process.platform === "win32",
		stdio: "inherit",
	});
	if (result.error !== undefined) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}

function hasRequiredOutputs(root, runtime) {
	return runtime.requiredOutputs.every((output) => existsSync(join(root, output)));
}

function assertRequiredOutputs(root, runtime) {
	const missingOutputs = runtime.requiredOutputs.filter((output) => !existsSync(join(root, output)));
	if (missingOutputs.length === 0) return;
	console.error(`Missing bundled ${runtime.label} outputs:`);
	for (const output of missingOutputs) {
		console.error(`  ${join(root, output)}`);
	}
	process.exit(1);
}

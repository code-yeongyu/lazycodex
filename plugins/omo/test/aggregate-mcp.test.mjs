import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { exists, readJson, root } from "./aggregate-plugin-fixture.mjs";

const mcpPackageManifestPaths = [
	"components/lsp-tools-mcp/package.json",
	"components/ast-grep-mcp/package.json",
];
const mcpPackageManifestExists = await Promise.all(mcpPackageManifestPaths.map(exists));

test("#given aggregate MCP config #when inspected #then code MCPs reference package runtimes without package names", async () => {
	// given
	const packageJson = await readJson("package.json");
	const mcp = await readJson(".mcp.json");
	const lspSources = await readdir(join(root, "components", "lsp", "src"));
	const bundledMcpBuildScript = await readFile(join(root, "scripts", "build-bundled-mcp-runtimes.mjs"), "utf8");

	// when
	const lspServer = mcp.mcpServers.lsp;
	const astGrepServer = mcp.mcpServers.ast_grep;
	const codeMcpNames = Object.keys(mcp.mcpServers)
		.filter((name) => name === "lsp" || name === "ast_grep")
		.sort();
	const componentLocalMcpSources = lspSources.filter((name) => name.startsWith("lazy-mcp") || name === "lazy-lsp-mcp.ts");

	// then
	assert.deepEqual(codeMcpNames, ["ast_grep", "lsp"]);
	assert.equal(packageJson.workspaces.includes("components/lsp/packages/lsp-tools-mcp"), false);
	assert.equal(packageJson.workspaces.includes("components/ast-grep/packages/ast-grep-mcp"), false);
	assert.deepEqual(packageJson.dependencies, { "@oh-my-opencode/shared-skills": "file:../../shared-skills" });
	assert.match(bundledMcpBuildScript, /ast-grep-mcp/);
	assert.doesNotMatch(packageJson.scripts.build, /--workspaces/);
	assert.equal(lspServer.command, "node");
	assert.deepEqual(lspServer.args, ["./components/lsp-tools-mcp/dist/cli.js", "mcp"]);
	assert.equal(lspServer.cwd, ".");
	assert.equal(astGrepServer.command, "node");
	assert.deepEqual(astGrepServer.args, ["./components/ast-grep-mcp/dist/cli.js", "mcp"]);
	assert.equal(astGrepServer.cwd, ".");
	assert.deepEqual(componentLocalMcpSources, []);
});

test("#given aggregate MCP config #when packaging is verified #then local MCP command targets exist", async () => {
	// given
	const mcp = await readJson(".mcp.json");

	// when
	const missingTargets = [];
	for (const [name, server] of Object.entries(mcp.mcpServers)) {
		if (typeof server.command !== "string") continue;
		const [target] = server.args ?? [];
		if (typeof target !== "string") continue;
		if (!(await exists(join(server.cwd ?? ".", target)))) {
			missingTargets.push(`${name}:${target}`);
		}
	}

	// then
	assert.deepEqual(missingTargets, []);
});

test(
	"#given package-level MCP CLIs #when package metadata is inspected #then bundled runtime bins point at local CLIs",
	{ skip: mcpPackageManifestExists.some((exists) => !exists) },
	async () => {
		// given
		const [lspPackageJson, astGrepPackageJson] = await Promise.all(
			mcpPackageManifestPaths.map((path) => readJson(path)),
		);

		// when
		const binNames = [
			...Object.keys(lspPackageJson.bin ?? {}),
			...Object.keys(astGrepPackageJson.bin ?? {}),
		].sort();

		// then
		assert.deepEqual(binNames, ["ast-grep-mcp", "lsp-tools-mcp"]);
	},
);

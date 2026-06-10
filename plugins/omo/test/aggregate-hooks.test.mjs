import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import test from "node:test";

import {
	collectCommandHooks,
	exists,
	hookLocation,
	readComponentHookManifests,
	readJson,
	readPluginVersion,
	root,
} from "./aggregate-plugin-fixture.mjs";

test("#given isolated components #when hooks are inspected #then commands stay inside component roots", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");
	const text = JSON.stringify(hooks);

	// when
	const componentMarkers = [
		"components/comment-checker/dist/cli.js",
		"components/lsp/dist/cli.js",
		"components/rules/dist/cli.js",
		"components/start-work-continuation/dist/cli.js",
		"components/telemetry/dist/cli.js",
		"components/ulw-loop/dist/cli.js",
		"components/ultrawork/dist/cli.js",
		"scripts/auto-update.mjs",
	];

	// then
	for (const marker of componentMarkers) {
		assert.match(text, new RegExp(marker.replaceAll("/", "\\/")));
	}
	assert.doesNotMatch(text, /codex-(comment-checker|lsp|rules|telemetry|ulw-loop|ultrawork)@/);
	assert.equal(await exists("scripts/migrate-codex-config.mjs"), true);
});

test("#given aggregate PostCompact hooks #when hooks are inspected #then LSP diagnostics cache reset is registered", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");
	const aggregateVersion = await readPluginVersion();

	// when
	const lspPostCompactHooks = collectCommandHooks(hooks, "hooks/hooks.json").filter(
		(hook) =>
			hook.eventName === "PostCompact" &&
			hook.handler.command === 'node "${PLUGIN_ROOT}/components/lsp/dist/cli.js" hook post-compact',
	);

	// then
	assert.equal(lspPostCompactHooks.length, 1);
	assert.equal(lspPostCompactHooks[0]?.handler.statusMessage, `LazyCodex(${aggregateVersion}): Resetting LSP Diagnostics Cache`);
});

test("#given aggregate hook commands #when inspected #then every command exposes a Codex status message", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");

	// when
	const commandHooks = collectCommandHooks(hooks, "hooks/hooks.json");
	const missingStatusMessages = commandHooks
		.filter(({ handler }) => typeof handler.statusMessage !== "string" || handler.statusMessage.trim() === "")
		.map(hookLocation);

	// then
	assert.deepEqual(missingStatusMessages, []);
});

test("#given aggregate hook commands #when inspected #then commands stay Node-based and platform-neutral", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");

	// when
	const commands = collectCommandHooks(hooks, "hooks/hooks.json").map(({ handler }) => handler.command);

	// then
	assert(!commands.some((command) => /\bpython3?\b/i.test(command)));
	assert(commands.includes('node "${PLUGIN_ROOT}/components/ultrawork/dist/cli.js" hook user-prompt-submit'));
	assert(commands.every((command) => command.startsWith("node ")));
	assert(commands.every((command) => !command.includes("\\")));
});

test("#given aggregate hook commands #when packaging is verified #then referenced component CLI targets exist", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");

	// when
	const componentCliTargets = collectCommandHooks(hooks, "hooks/hooks.json")
		.map(({ handler }) => /^node "\$\{PLUGIN_ROOT\}\/(components\/[^"]+\/dist\/cli\.js)"/.exec(handler.command)?.[1])
		.filter((target) => typeof target === "string");
	const missingComponentCliTargets = [];
	for (const target of componentCliTargets) {
		if (!(await exists(target))) missingComponentCliTargets.push(target);
	}

	// then
	assert.deepEqual(missingComponentCliTargets, []);
});

test("#given component file dependencies #when packaging is verified #then dependency targets stay inside the plugin bundle", async () => {
	// given
	const packageJson = await readJson("package.json");
	const workspacePackagePaths = packageJson.workspaces.map((workspace) => join(workspace, "package.json"));
	const pluginRoot = resolve(root);
	const pluginRootPrefix = pluginRoot.endsWith(sep) ? pluginRoot : `${pluginRoot}${sep}`;

	// when
	const escapingDependencies = [];
	for (const workspacePackagePath of workspacePackagePaths) {
		const workspacePackage = await readJson(workspacePackagePath);
		const workspaceRoot = dirname(resolve(root, workspacePackagePath));
		for (const [name, specifier] of Object.entries(workspacePackage.dependencies ?? {})) {
			if (typeof specifier !== "string" || !specifier.startsWith("file:")) continue;
			const target = resolve(workspaceRoot, specifier.slice("file:".length));
			if (target !== pluginRoot && !target.startsWith(pluginRootPrefix)) {
				escapingDependencies.push(`${workspacePackagePath}:${name}:${specifier}`);
			}
		}
	}

	// then
	assert.deepEqual(escapingDependencies, []);
});

test("#given component hook commands #when inspected #then standalone packages expose Codex status messages", async () => {
	// given
	const componentHooks = await readComponentHookManifests();

	// when
	const missingStatusMessages = componentHooks
		.flatMap(({ source, hooks }) => collectCommandHooks(hooks, source))
		.filter(({ handler }) => typeof handler.statusMessage !== "string" || handler.statusMessage.trim() === "")
		.map(hookLocation);

	// then
	assert.deepEqual(missingStatusMessages, []);
});

test("#given hook status messages #when inspected #then labels describe OMO responsibilities instead of the hook runner", async () => {
	// given
	const aggregateHooks = await readJson("hooks/hooks.json");
	const componentHooks = await readComponentHookManifests();

	// when
	const commandHooks = [
		...collectCommandHooks(aggregateHooks, "hooks/hooks.json"),
		...componentHooks.flatMap(({ source, hooks }) => collectCommandHooks(hooks, source)),
	];
	const genericStatusMessages = commandHooks
		.filter(({ handler }) => typeof handler.statusMessage !== "string" || /\bhook\b/i.test(handler.statusMessage))
		.map(hookLocation);

	// then
	assert.deepEqual(genericStatusMessages, []);
});

test("#given aggregate OMO plugin is enabled #when hooks are inspected #then ulw-loop guard is registered without unavailable git_bash guidance", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");
	const text = JSON.stringify(hooks);

	// when
	const preToolUseGroups = hooks.hooks.PreToolUse;

	// then
	assert.doesNotMatch(text, /components\/git-bash\/dist\/cli\.js/);
	assert.doesNotMatch(text, /Git Bash Mcp/);
	assert.match(text, /components\/ulw-loop\/dist\/cli\.js/);
	assert.match(text, /hook pre-tool-use/);
	assert.deepEqual(preToolUseGroups.map((group) => group.matcher), ["^create_goal$"]);
});

test("#given aggregate SessionStart hooks #when inspected #then LazyCodex auto-update is registered", async () => {
	// given
	const hooks = await readJson("hooks/hooks.json");
	const text = JSON.stringify(hooks);

	// when
	const sessionStartCommands = collectCommandHooks(hooks, "hooks/hooks.json")
		.filter(({ eventName }) => eventName === "SessionStart")
		.map(({ handler }) => handler.command);
	const autoUpdateGroup = hooks.hooks.SessionStart.find((group) => JSON.stringify(group).includes("scripts/auto-update.mjs"));

	// then
	assert.equal(autoUpdateGroup?.matcher, "^startup$");
	assert.match(text, /scripts\/auto-update\.mjs/);
	assert.match(text, /Checking Auto Update/);
	assert(sessionStartCommands.some((command) => command.includes("scripts/auto-update.mjs")));
});

test("#given aggregate plugin packaging #when inspected #then hooks and compatibility sentinels stay Python-free", async () => {
	// given
	const hooksText = await readFile(join(root, "hooks/hooks.json"), "utf8");
	const aggregateTestText = await readFile(join(root, "test/aggregate.test.mjs"), "utf8");

	// when
	const aggregateText = `${hooksText}\n${aggregateTestText}`;

	// then
	assert.doesNotMatch(aggregateText, /\bpython3?\b|ultrawork-detector\.py/);
});

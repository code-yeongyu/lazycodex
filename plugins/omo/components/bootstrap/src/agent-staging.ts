import { copyFile, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { hasForeignAgentRegistration } from "../../../../src/install/codex-config-agents.ts";

const AGENT_MANIFEST = ".installed-agents.json";

export async function readInstalledAgentPaths(stageRoot: string): Promise<ReadonlySet<string>> {
	try {
		const parsed: unknown = JSON.parse(await readFile(join(stageRoot, AGENT_MANIFEST), "utf8"));
		if (!isRecord(parsed) || !Array.isArray(parsed["agents"])) return new Set();
		return new Set(parsed["agents"].filter((path): path is string => typeof path === "string"));
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return new Set();
		throw error;
	}
}

export async function readStagedAgentContents(stageRoot: string): Promise<ReadonlyMap<string, string>> {
	const contents = new Map<string, string>();
	const componentsRoot = join(stageRoot, "components");
	for (const componentName of await directoryNames(componentsRoot)) {
		const agentsDir = join(componentsRoot, componentName, "agents");
		for (const agentFile of await fileNames(agentsDir)) {
			contents.set(agentFile, await readFile(join(agentsDir, agentFile), "utf8"));
		}
	}
	return contents;
}

export async function matchesAgentContent(path: string, expectedContent: string | undefined): Promise<boolean> {
	if (expectedContent === undefined) return false;
	try {
		return (await readFile(path, "utf8")) === expectedContent;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
		throw error;
	}
}

export async function stageBundledAgents(
	pluginRoot: string,
	stageRoot: string,
	existingConfig: string,
): Promise<readonly string[]> {
	await rm(stageRoot, { force: true, recursive: true });
	await mkdir(stageRoot, { recursive: true });
	const foreignAgentFiles: string[] = [];
	const componentsRoot = join(pluginRoot, "components");
	for (const componentName of await directoryNames(componentsRoot)) {
		const agentsDir = join(componentsRoot, componentName, "agents");
		const agentFiles = (await fileNames(agentsDir)).filter((name) => name.endsWith(".toml"));
		if (agentFiles.length === 0) continue;
		const stagedAgentsDir = join(stageRoot, "components", componentName, "agents");
		await mkdir(stagedAgentsDir, { recursive: true });
		for (const agentFile of agentFiles) {
			const agentConfig = { configFile: `./agents/${agentFile}`, name: agentNameFromToml(agentFile) };
			if (hasForeignAgentRegistration(existingConfig, agentConfig)) {
				foreignAgentFiles.push(agentFile);
				continue;
			}
			await copyFile(join(agentsDir, agentFile), join(stagedAgentsDir, agentFile));
		}
	}
	return foreignAgentFiles;
}

export function agentNameFromToml(fileName: string): string {
	return fileName.endsWith(".toml") ? fileName.slice(0, -".toml".length) : fileName;
}

async function directoryNames(root: string): Promise<string[]> {
	return entryNames(root, (entry) => entry.isDirectory());
}

async function fileNames(root: string): Promise<string[]> {
	return entryNames(root, (entry) => entry.isFile());
}

async function entryNames(root: string, keep: (entry: { isDirectory(): boolean; isFile(): boolean }) => boolean): Promise<string[]> {
	try {
		const entries: readonly { isDirectory(): boolean; isFile(): boolean; name: string }[] = await readdir(root, {
			withFileTypes: true,
		});
		return entries
			.filter((entry) => keep(entry))
			.map((entry) => entry.name)
			.sort();
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
		throw error;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

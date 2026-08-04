import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { hasForeignAgentRegistration } from "../../../../src/install/codex-config-agents.ts";

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
		const entries = await readdir(root, { withFileTypes: true });
		return entries
			.filter((entry) => keep(entry))
			.map((entry) => entry.name)
			.sort();
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
		throw error;
	}
}

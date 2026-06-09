#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceSyncScript = join(root, "..", "scripts", "sync-telemetry-component.mjs");

if (!existsSync(sourceSyncScript)) {
	console.warn("Skipping telemetry component sync; source sync script is unavailable.");
	process.exit(0);
}

const result = spawnSync(process.execPath, [sourceSyncScript], {
	cwd: root,
	stdio: "inherit",
});
if (result.error !== undefined) throw result.error;
process.exit(result.status ?? 1);

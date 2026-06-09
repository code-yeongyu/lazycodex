import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(import.meta.dirname, "..");
let qaRoot = "";

beforeAll(async () => {
	await execFileAsync("npm", ["run", "build"], { cwd: repoRoot });
	qaRoot = await mkdtemp(join(tmpdir(), "omo-ulw-loop-cli-entrypoint-"));
});

afterAll(async () => {
	if (qaRoot) await rm(qaRoot, { recursive: true, force: true });
});

describe("dist/cli.js component entrypoint", () => {
	it("dispatches direct subcommands when invoked as omo-ulw-loop", async () => {
		const cliPath = join(repoRoot, "dist", "cli.js");
		const result = await execFileAsync(process.execPath, [cliPath, "status", "--json"], { cwd: qaRoot }).catch(
			(error: unknown) => {
				if (error instanceof Error && "stderr" in error && "stdout" in error) {
					return error as Error & { readonly stdout: string; readonly stderr: string };
				}
				throw error;
			},
		);

		expect(result.stderr).toContain("[ulw-loop] No ulw-loop plan found");
		expect(result.stderr).not.toContain("[omo] unknown command: status");
	});
});

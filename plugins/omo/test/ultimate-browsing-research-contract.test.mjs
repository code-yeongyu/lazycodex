import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("#given ultimate-browsing #when used by research #then insane-search exposes a source-record handoff", async () => {
	const content = await readFile(join(root, "skills", "ultimate-browsing", "SKILL.md"), "utf8");

	assert.match(content, /insane-search/i);
	assert.match(content, /Research-source handoff/);
	assert.match(content, /INSANE_SOURCE_RECORD/);
	for (const field of [
		"url",
		"final_url",
		"title",
		"access_method",
		"waf_profile",
		"verdict",
		"selector_proof",
		"fetched_at",
		"trace_summary",
		"source_quality_hint",
	]) {
		assert.match(content, new RegExp(`\\b${field}\\b`), `missing ${field} in handoff contract`);
	}
	assert.match(content, /source registry/i);
	assert.match(content, /claim verification/i);
});

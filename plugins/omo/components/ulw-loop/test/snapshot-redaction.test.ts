import { describe, expect, it } from "vitest";

import { redactSnapshotText } from "../src/snapshot.ts";

const SECRET_FIXTURES = [
	"Authorization: Bearer abc.def",
	"authorization: bearer lowercase.secret",
	"Authorization: Basic dXNlcjpwYXNz",
	"Cookie: session=SECRET_VALUE",
	"cookie: session=lower-secret",
	"Set-Cookie: refresh=SECRET_VALUE",
	"set-cookie: refresh=lower-secret",
	"OPENAI_API_KEY=sk-test-secret",
	"api_key=sk-lower-secret",
	"GITHUB_TOKEN=ghp_secret",
	"token=standalone-secret",
	"DATABASE_PASSWORD=db-secret-value",
	"env_secret=lower-env-secret",
	"https://user:pass@example.com/path",
	"BEGIN TRANSCRIPT\nsecret transcript\nEND TRANSCRIPT",
	"sk-test-secret",
	"ghp_secret",
	"gho_secret",
	"ghu_secret",
	"ghs_secret",
	"ghr_secret",
	"github_pat_abc123",
	"xoxa-123-secret",
	"xoxb-123-secret",
	"xoxp-123-secret",
	"xoxr-123-secret",
	"xoxs-123-secret",
] as const;
const DEPRECATED_SECRET_MARKER = `${"[REDACTED"}:${"secret]"}`;
const DEPRECATED_URL_CREDENTIAL_MARKER = `${"[REDACTED:url"}_${"credentials]"}`;

describe("redactSnapshotText", () => {
	it("#given common credential forms #when redacting text #then uses deterministic replacement kinds", () => {
		const redacted = redactSnapshotText(SECRET_FIXTURES.join("\n"));

		for (const fixture of SECRET_FIXTURES) {
			expect(redacted).not.toContain(fixture);
		}
		expect(redacted).toContain("[REDACTED:authorization]");
		expect(redacted).toContain("[REDACTED:cookie]");
		expect(redacted).toContain("[REDACTED:api-key]");
		expect(redacted).toContain("[REDACTED:token]");
		expect(redacted).toContain("[REDACTED:env-secret]");
		expect(redacted).toContain("[REDACTED:url-credential]");
		expect(redacted).toContain("[REDACTED:transcript]");
		expect(redacted).not.toContain(DEPRECATED_SECRET_MARKER);
		expect(redacted).not.toContain(DEPRECATED_URL_CREDENTIAL_MARKER);
	});
});

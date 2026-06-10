import { readFileSync } from "node:fs";
export const ULTRAWORK_DIRECTIVE = readFileSync(new URL("../directive.md", import.meta.url), "utf8");

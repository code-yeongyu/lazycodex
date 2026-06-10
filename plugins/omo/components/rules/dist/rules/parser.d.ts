import type { ParsedRule } from "./types.js";
/** Parse markdown rule content and extract the supported YAML frontmatter subset. */
export declare function parseRule(content: string): ParsedRule;

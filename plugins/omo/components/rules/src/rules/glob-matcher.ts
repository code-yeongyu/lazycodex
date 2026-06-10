const REGEX_SPECIAL_CHARS = "^$+?.()|{}[]\\";

type ParseResult = {
	readonly source: string;
	readonly index: number;
	readonly terminator?: string;
};

type DelimitedParseResult = {
	readonly source: string;
	readonly index: number;
};

export function createGlobMatcher(pattern: string): (path: string) => boolean {
	const regex = new RegExp(`^${parseGlobPattern(normalizeGlobPath(pattern))}$`);
	return (path: string) => regex.test(normalizeGlobPath(path));
}

export function normalizeGlobPath(path: string): string {
	return path.replaceAll("\\", "/");
}

function parseGlobPattern(pattern: string): string {
	return parseGlobUntil(pattern, 0, "").source;
}

function parseGlobUntil(pattern: string, startIndex: number, terminators: string): ParseResult {
	let source = "";
	let index = startIndex;

	while (index < pattern.length) {
		const char = pattern.charAt(index);
		if (terminators.includes(char)) {
			return { source, index, terminator: char };
		}

		if (char === "*") {
			const parsed = parseStar(pattern, index);
			source += parsed.source;
			index = parsed.index;
			continue;
		}

		if (char === "?") {
			source += "[^/]";
			index += 1;
			continue;
		}

		if (char === "[") {
			const parsed = parseCharacterClass(pattern, index);
			if (parsed !== undefined) {
				source += parsed.source;
				index = parsed.index + 1;
				continue;
			}
		}

		if (char === "{") {
			const parsed = parseDelimitedAlternatives(pattern, index + 1, "}", ",");
			if (parsed !== undefined) {
				source += parsed.source;
				index = parsed.index + 1;
				continue;
			}
		}

		if (char === "@" && pattern.charAt(index + 1) === "(") {
			const parsed = parseDelimitedAlternatives(pattern, index + 2, ")", "|");
			if (parsed !== undefined) {
				source += parsed.source;
				index = parsed.index + 1;
				continue;
			}
		}

		source += escapeRegexChar(char);
		index += 1;
	}

	return { source, index };
}

function parseStar(pattern: string, startIndex: number): DelimitedParseResult {
	if (pattern.charAt(startIndex + 1) !== "*") {
		return { source: "[^/]*", index: startIndex + 1 };
	}

	let index = startIndex + 2;
	while (pattern.charAt(index) === "*") {
		index += 1;
	}

	if (pattern.charAt(index) === "/") {
		return { source: "(?:.*/)?", index: index + 1 };
	}

	return { source: ".*", index };
}

function parseCharacterClass(pattern: string, startIndex: number): DelimitedParseResult | undefined {
	let source = "[";
	let index = startIndex + 1;
	if (index >= pattern.length) {
		return undefined;
	}

	if (pattern.charAt(index) === "!") {
		source += "^";
		index += 1;
	} else if (pattern.charAt(index) === "^") {
		source += "\\^";
		index += 1;
	}

	while (index < pattern.length) {
		const char = pattern.charAt(index);
		if (char === "]") {
			return { source: `${source}]`, index };
		}

		source += escapeCharacterClassChar(char);
		index += 1;
	}

	return undefined;
}

function parseDelimitedAlternatives(
	pattern: string,
	startIndex: number,
	endChar: string,
	separator: string,
): DelimitedParseResult | undefined {
	const alternatives: string[] = [];
	let index = startIndex;

	while (index < pattern.length) {
		const parsed = parseGlobUntil(pattern, index, `${separator}${endChar}`);
		alternatives.push(parsed.source);

		if (parsed.terminator === endChar) {
			return { source: `(?:${alternatives.join("|")})`, index: parsed.index };
		}

		if (parsed.terminator !== separator) {
			return undefined;
		}

		index = parsed.index + 1;
	}

	return undefined;
}

function escapeRegexChar(char: string): string {
	return REGEX_SPECIAL_CHARS.includes(char) ? `\\${char}` : char;
}

function escapeCharacterClassChar(char: string): string {
	return char === "\\" || char === "]" ? `\\${char}` : char;
}

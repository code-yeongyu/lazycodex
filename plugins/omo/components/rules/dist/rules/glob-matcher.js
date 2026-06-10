const REGEX_SPECIAL_CHARS = "^$+?.()|{}[]\\";
export function createGlobMatcher(pattern) {
    const regex = new RegExp(`^${parseGlobPattern(normalizeGlobPath(pattern))}$`);
    return (path) => regex.test(normalizeGlobPath(path));
}
export function normalizeGlobPath(path) {
    return path.replaceAll("\\", "/");
}
function parseGlobPattern(pattern) {
    return parseGlobUntil(pattern, 0, "").source;
}
function parseGlobUntil(pattern, startIndex, terminators) {
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
function parseStar(pattern, startIndex) {
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
function parseCharacterClass(pattern, startIndex) {
    let source = "[";
    let index = startIndex + 1;
    if (index >= pattern.length) {
        return undefined;
    }
    if (pattern.charAt(index) === "!") {
        source += "^";
        index += 1;
    }
    else if (pattern.charAt(index) === "^") {
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
function parseDelimitedAlternatives(pattern, startIndex, endChar, separator) {
    const alternatives = [];
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
function escapeRegexChar(char) {
    return REGEX_SPECIAL_CHARS.includes(char) ? `\\${char}` : char;
}
function escapeCharacterClassChar(char) {
    return char === "\\" || char === "]" ? `\\${char}` : char;
}

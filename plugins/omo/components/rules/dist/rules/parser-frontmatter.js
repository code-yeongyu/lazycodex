const FRONTMATTER_OPENING = "---\n";
const FRONTMATTER_OPENING_CRLF = "---\r\n";
export function stripBom(content) {
    return content.startsWith("\uFEFF") ? content.slice(1) : content;
}
export function getOpeningDelimiterLength(content) {
    if (content.startsWith(FRONTMATTER_OPENING_CRLF))
        return FRONTMATTER_OPENING_CRLF.length;
    if (content.startsWith(FRONTMATTER_OPENING))
        return FRONTMATTER_OPENING.length;
    return 0;
}
export function findClosingDelimiter(content, openingLength) {
    let lineStart = openingLength;
    while (lineStart <= content.length) {
        const nextNewline = content.indexOf("\n", lineStart);
        const lineEnd = nextNewline === -1 ? content.length : nextNewline;
        const line = content.slice(lineStart, lineEnd).replace(/\r$/, "");
        if (line === "---") {
            return {
                start: lineStart,
                bodyStart: nextNewline === -1 ? content.length : nextNewline + 1,
            };
        }
        if (nextNewline === -1)
            break;
        lineStart = nextNewline + 1;
    }
    return null;
}

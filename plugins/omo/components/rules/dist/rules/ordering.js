import { SOURCE_PRIORITY } from "./constants.js";
export function sortCandidates(candidates) {
    return candidates
        .map((candidate, index) => ({ candidate, index }))
        .sort((left, right) => compareCandidates(left.candidate, right.candidate) || left.index - right.index)
        .map(({ candidate }) => candidate);
}
export function compareCandidates(a, b) {
    return (compareBoolean(a.isGlobal, b.isGlobal) ||
        compareNumber(a.distance, b.distance) ||
        compareNumber(SOURCE_PRIORITY.get(a.source) ?? Infinity, SOURCE_PRIORITY.get(b.source) ?? Infinity) ||
        compareString(a.relativePath, b.relativePath) ||
        compareString(a.realPath, b.realPath));
}
function compareBoolean(a, b) {
    return Number(a) - Number(b);
}
function compareNumber(a, b) {
    return a - b;
}
function compareString(a, b) {
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}

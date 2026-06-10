import { isAbsolute, relative, resolve } from "node:path";
export function displayPath(cwd, filePath) {
    const rel = isAbsolute(filePath) ? relative(cwd, filePath) : filePath;
    return toPosixPath(rel);
}
export function isSameOrChildPath(childPath, parentPath) {
    const childRelativePath = relative(parentPath, resolve(childPath));
    return childRelativePath === "" || (!childRelativePath.startsWith("..") && !isAbsolute(childRelativePath));
}
export function toPosixPath(path) {
    return path.replaceAll("\\", "/");
}
export function uniqueStrings(values) {
    const uniqueValues = [];
    const seenValues = new Set();
    for (const value of values) {
        if (seenValues.has(value)) {
            continue;
        }
        seenValues.add(value);
        uniqueValues.push(value);
    }
    return uniqueValues;
}

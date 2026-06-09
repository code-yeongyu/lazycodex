import { dirname, posix, relative, resolve } from "node:path";
export function getWalkDirectories(projectRoot, targetFile) {
    if (targetFile === null) {
        return [{ directory: projectRoot, distance: 0 }];
    }
    const startDirectory = dirname(resolve(targetFile));
    if (!isSameOrChildPath(startDirectory, projectRoot)) {
        return [{ directory: projectRoot, distance: 0 }];
    }
    const walkDirectories = [];
    let currentDirectory = startDirectory;
    let distance = 0;
    while (true) {
        walkDirectories.push({ directory: currentDirectory, distance });
        if (currentDirectory === projectRoot) {
            break;
        }
        const parentDirectory = dirname(currentDirectory);
        if (parentDirectory === currentDirectory) {
            break;
        }
        currentDirectory = parentDirectory;
        distance += 1;
    }
    return walkDirectories;
}
export function toRelativePath(rootDirectory, filePath) {
    return posix.normalize(relative(rootDirectory, filePath).replace(/\\/g, "/"));
}
function isSameOrChildPath(childPath, parentPath) {
    const childRelativePath = relative(parentPath, childPath);
    return childRelativePath === "" || (!childRelativePath.startsWith("..") && !childRelativePath.startsWith("/"));
}

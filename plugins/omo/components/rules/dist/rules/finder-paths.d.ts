export interface WalkDirectory {
    readonly directory: string;
    readonly distance: number;
}
export declare function getWalkDirectories(projectRoot: string, targetFile: string | null): WalkDirectory[];
export declare function toRelativePath(rootDirectory: string, filePath: string): string;

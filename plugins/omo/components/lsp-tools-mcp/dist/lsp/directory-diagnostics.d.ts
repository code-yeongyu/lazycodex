import type { SeverityFilter } from "./types.js";
export declare function collectFilesWithExtension(dir: string, extension: string, maxFiles: number): string[];
export declare function aggregateDiagnosticsForDirectory(directory: string, extension: string, severity?: SeverityFilter, maxFiles?: number): Promise<string>;

import type { ServerLookupResult } from "./types.js";
export declare function findServerForExtension(ext: string): ServerLookupResult;
export interface ServerStatus {
    id: string;
    installed: boolean;
    extensions: string[];
    disabled: boolean;
    source: string;
    priority: number;
}
export declare function getAllServers(): ServerStatus[];

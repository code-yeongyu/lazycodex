import type { ResolvedServer } from "./types.js";
interface ConfigJson {
    lsp?: Record<string, unknown>;
}
type ConfigSource = "project" | "user";
export interface ServerWithSource extends ResolvedServer {
    source: "project" | "user" | "builtin";
}
export declare function getConfigPaths(): {
    project: string;
    user: string;
};
export declare function loadAllConfigs(): Map<ConfigSource, ConfigJson>;
export declare function getMergedServers(): ServerWithSource[];
export declare function getDisabledServerIds(): Set<string>;
export {};

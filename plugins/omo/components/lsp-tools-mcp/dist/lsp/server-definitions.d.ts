import type { LspServerConfig } from "./types.js";
export declare const LSP_INSTALL_HINTS: Record<string, string>;
export declare const BUILTIN_SERVERS: Record<string, Omit<LspServerConfig, "id">>;
export declare const AUTO_INSTALLABLE_SERVERS: Record<string, string[]>;

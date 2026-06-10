import { LspClientConnection } from "./connection.js";
import type { Diagnostic, DocumentSymbol, Location, LocationLink, PrepareRenameDefaultBehavior, PrepareRenameResult, Range, SymbolInfo, WorkspaceEdit } from "./types.js";
export declare class LspClient extends LspClientConnection {
    private readonly openedFiles;
    private readonly documentVersions;
    private readonly lastSyncedText;
    private readonly diagnosticPullErrors;
    getDiagnosticPullErrors(): readonly Error[];
    openFile(filePath: string): Promise<void>;
    definition(filePath: string, line: number, character: number): Promise<Location | LocationLink | Array<Location | LocationLink> | null>;
    references(filePath: string, line: number, character: number, includeDeclaration?: boolean): Promise<Location[]>;
    documentSymbols(filePath: string): Promise<Array<DocumentSymbol | SymbolInfo>>;
    workspaceSymbols(query: string): Promise<SymbolInfo[]>;
    private isUnsupportedDiagnosticPullError;
    diagnostics(filePath: string): Promise<{
        items: Diagnostic[];
    }>;
    prepareRename(filePath: string, line: number, character: number): Promise<PrepareRenameResult | PrepareRenameDefaultBehavior | Range | null>;
    rename(filePath: string, line: number, character: number, newName: string): Promise<WorkspaceEdit | null>;
}

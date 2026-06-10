import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LspClientConnection } from "./connection.js";
import { getLanguageId } from "./language-mappings.js";
const POST_OPEN_DELAY_MS = 1000;
const POST_DIAGNOSTICS_WAIT_MS = 500;
export class LspClient extends LspClientConnection {
    constructor() {
        super(...arguments);
        this.openedFiles = new Set();
        this.documentVersions = new Map();
        this.lastSyncedText = new Map();
        this.diagnosticPullErrors = [];
    }
    getDiagnosticPullErrors() {
        return this.diagnosticPullErrors;
    }
    async openFile(filePath) {
        const absPath = resolve(filePath);
        const uri = pathToFileURL(absPath).href;
        const text = readFileSync(absPath, "utf-8");
        if (!this.openedFiles.has(absPath)) {
            const ext = extname(absPath);
            const languageId = getLanguageId(ext);
            const version = 1;
            await this.sendNotification("textDocument/didOpen", {
                textDocument: {
                    uri,
                    languageId,
                    version,
                    text,
                },
            });
            this.openedFiles.add(absPath);
            this.documentVersions.set(uri, version);
            this.lastSyncedText.set(uri, text);
            await new Promise((r) => setTimeout(r, POST_OPEN_DELAY_MS));
            return;
        }
        const prevText = this.lastSyncedText.get(uri);
        if (prevText === text) {
            return;
        }
        const nextVersion = (this.documentVersions.get(uri) ?? 1) + 1;
        this.documentVersions.set(uri, nextVersion);
        this.lastSyncedText.set(uri, text);
        await this.sendNotification("textDocument/didChange", {
            textDocument: { uri, version: nextVersion },
            contentChanges: [{ text }],
        });
        await this.sendNotification("textDocument/didSave", {
            textDocument: { uri },
            text,
        });
    }
    async definition(filePath, line, character) {
        const absPath = resolve(filePath);
        await this.openFile(absPath);
        return this.sendRequest("textDocument/definition", {
            textDocument: { uri: pathToFileURL(absPath).href },
            position: { line: line - 1, character },
        });
    }
    async references(filePath, line, character, includeDeclaration = true) {
        const absPath = resolve(filePath);
        await this.openFile(absPath);
        return this.sendRequest("textDocument/references", {
            textDocument: { uri: pathToFileURL(absPath).href },
            position: { line: line - 1, character },
            context: { includeDeclaration },
        });
    }
    async documentSymbols(filePath) {
        const absPath = resolve(filePath);
        await this.openFile(absPath);
        return this.sendRequest("textDocument/documentSymbol", {
            textDocument: { uri: pathToFileURL(absPath).href },
        });
    }
    async workspaceSymbols(query) {
        return this.sendRequest("workspace/symbol", { query });
    }
    isUnsupportedDiagnosticPullError(error) {
        if (!(error instanceof Error))
            return false;
        const code = "code" in error && typeof error.code === "number" ? error.code : undefined;
        if (code === -32601)
            return true;
        return /unsupported|not supported|method not found|unknown request/i.test(error.message);
    }
    async diagnostics(filePath) {
        const absPath = resolve(filePath);
        const uri = pathToFileURL(absPath).href;
        await this.openFile(absPath);
        await new Promise((r) => setTimeout(r, POST_DIAGNOSTICS_WAIT_MS));
        try {
            const result = await this.sendRequest("textDocument/diagnostic", {
                textDocument: { uri },
            });
            if (result.items) {
                return { items: result.items };
            }
        }
        catch (error) {
            if (!this.isUnsupportedDiagnosticPullError(error)) {
                this.diagnosticPullErrors.push(error instanceof Error ? error : new Error(String(error)));
            }
        }
        return { items: this.getStoredDiagnostics(uri) };
    }
    async prepareRename(filePath, line, character) {
        const absPath = resolve(filePath);
        await this.openFile(absPath);
        return this.sendRequest("textDocument/prepareRename", {
            textDocument: { uri: pathToFileURL(absPath).href },
            position: { line: line - 1, character },
        });
    }
    async rename(filePath, line, character, newName) {
        const absPath = resolve(filePath);
        await this.openFile(absPath);
        return this.sendRequest("textDocument/rename", {
            textDocument: { uri: pathToFileURL(absPath).href },
            position: { line: line - 1, character },
            newName,
        });
    }
}

declare module "@code-yeongyu/lsp-tools-mcp/dist/tools.js" {
	export function executeLspDiagnostics(input: {
		readonly filePath: string;
		readonly severity: "error";
	}): Promise<{ readonly content: readonly { readonly text: string }[] }>;
}

declare module "@code-yeongyu/lsp-tools-mcp/dist/lsp/manager.js" {
	export function disposeDefaultLspManager(): Promise<void>;
}

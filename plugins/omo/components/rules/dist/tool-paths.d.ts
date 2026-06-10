export interface CodexPostToolUseLike {
    tool_name: string;
    tool_input: unknown;
    tool_response: unknown;
}
export declare function extractCodexToolPaths(input: CodexPostToolUseLike, cwd: string): string[];

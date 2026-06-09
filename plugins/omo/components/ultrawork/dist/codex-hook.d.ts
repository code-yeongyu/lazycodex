export type CodexUserPromptSubmitInput = {
    readonly hook_event_name: "UserPromptSubmit";
    readonly prompt: string;
    readonly transcript_path?: string | null;
};
export declare function runUserPromptSubmitHook(input: unknown): string;
export declare function isUltraworkPrompt(prompt: string): boolean;

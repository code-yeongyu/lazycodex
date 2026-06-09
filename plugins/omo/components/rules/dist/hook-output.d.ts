export type ContextInjectionHookEventName = "SessionStart" | "UserPromptSubmit" | "PostToolUse";
export declare function formatAdditionalContextOutput(eventName: ContextInjectionHookEventName, additionalContext: string): string;

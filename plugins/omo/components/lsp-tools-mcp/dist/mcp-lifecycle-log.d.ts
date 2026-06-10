type LogFieldValue = boolean | number | string | null;
export declare function mcpLifecycleLogPath(): string;
export declare function writeMcpLifecycleLog(event: string, fields?: Record<string, LogFieldValue>): void;
export {};

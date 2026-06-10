type RuntimeEnv = Readonly<Record<string, string | undefined>>;
export declare const SPARKSHELL_AWARENESS_DEDUP_KEY = "__omo_sparkshell_awareness__";
export declare function isCodexAppServerActive(env?: RuntimeEnv): boolean;
export declare function getSparkShellRuntimeAwareness(env?: RuntimeEnv): string;
export {};

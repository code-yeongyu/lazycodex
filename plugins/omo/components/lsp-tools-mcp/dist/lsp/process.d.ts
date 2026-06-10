export interface SpawnedProcess {
    stdin: NodeJS.WritableStream;
    stdout: NodeJS.ReadableStream;
    stderr: NodeJS.ReadableStream;
    pid: number | undefined;
    exitCode: number | null;
    exited: Promise<number>;
    kill(signal?: NodeJS.Signals): void;
    killed: boolean;
}
export interface SpawnOptions {
    cwd: string;
    env: Record<string, string | undefined>;
}
export interface PreparedSpawnCommand {
    command: string;
    args: string[];
    shell: false;
}
export declare function validateCwd(cwd: string): {
    valid: boolean;
    error?: string;
};
export declare function createSpawnCommand(command: string[], platform?: NodeJS.Platform, commandProcessor?: string, env?: Record<string, string | undefined>): PreparedSpawnCommand;
export declare function spawnProcess(command: string[], options: SpawnOptions): SpawnedProcess;

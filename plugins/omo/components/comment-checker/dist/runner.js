import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
export const MAX_PROCESS_OUTPUT_BYTES = 64 * 1024;
export async function runCommentChecker(input, options = {}) {
    const binaryPath = options.binaryPath ?? (options.resolveBinary ? options.resolveBinary() : resolveCommentCheckerBinary());
    if (!binaryPath) {
        return {
            status: "missing",
            message: "comment-checker binary not found. Run npm install for the codex-comment-checker plugin.",
        };
    }
    const args = ["check"];
    if (options.customPrompt) {
        args.push("--prompt", options.customPrompt);
    }
    const executor = options.executor ?? spawnProcess;
    const result = await executor(binaryPath, args, JSON.stringify(input));
    const message = result.stderr || result.stdout;
    if (result.exitCode === 0) {
        return {
            status: "pass",
            message: "",
            binaryPath,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
        };
    }
    if (result.exitCode === 2) {
        return {
            status: "warning",
            message,
            binaryPath,
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
        };
    }
    return {
        status: "error",
        message,
        binaryPath,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}
export function resolveCommentCheckerBinary() {
    const binaryName = process.platform === "win32" ? "comment-checker.exe" : "comment-checker";
    const fromPackageApi = resolvePackageApiBinary();
    if (fromPackageApi)
        return fromPackageApi;
    const fromPackage = resolvePackageBinary(binaryName);
    if (fromPackage)
        return fromPackage;
    return undefined;
}
function resolvePackageApiBinary() {
    try {
        const require = createRequire(import.meta.url);
        const packageExports = require("@code-yeongyu/comment-checker");
        if (!isCommentCheckerPackage(packageExports))
            return undefined;
        const binaryPath = packageExports.getBinaryPath();
        return existsSync(binaryPath) ? binaryPath : undefined;
    }
    catch {
        return undefined;
    }
}
function resolvePackageBinary(binaryName) {
    try {
        const require = createRequire(import.meta.url);
        const packagePath = require.resolve("@code-yeongyu/comment-checker/package.json");
        const binaryPath = join(dirname(packagePath), "bin", binaryName);
        return existsSync(binaryPath) ? binaryPath : undefined;
    }
    catch {
        return undefined;
    }
}
function isCommentCheckerPackage(value) {
    return isRecord(value) && typeof value["getBinaryPath"] === "function";
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function appendOutput(output, chunk, maxOutputBytes) {
    if (output.truncated)
        return;
    const remainingBytes = maxOutputBytes - output.bytes;
    const chunkBytes = Buffer.byteLength(chunk, "utf8");
    if (chunkBytes <= remainingBytes) {
        output.text += chunk;
        output.bytes += chunkBytes;
        return;
    }
    if (remainingBytes > 0) {
        output.text += Buffer.from(chunk, "utf8").subarray(0, remainingBytes).toString("utf8");
        output.bytes += remainingBytes;
    }
    output.truncated = true;
}
function formatOutput(output, streamName, maxOutputBytes) {
    if (!output.truncated)
        return output.text;
    return `${output.text}\n[${streamName} truncated after ${maxOutputBytes} bytes]`;
}
export function spawnProcess(command, args, stdin, maxOutputBytes = MAX_PROCESS_OUTPUT_BYTES) {
    return new Promise((resolve) => {
        const outputByteLimit = Number.isFinite(maxOutputBytes) && maxOutputBytes > 0 ? Math.floor(maxOutputBytes) : 0;
        const proc = spawn(command, args, {
            stdio: ["pipe", "pipe", "pipe"],
        });
        const stdout = { text: "", bytes: 0, truncated: false };
        const stderr = { text: "", bytes: 0, truncated: false };
        proc.stdout.setEncoding("utf-8");
        proc.stderr.setEncoding("utf-8");
        proc.stdout.on("data", (chunk) => {
            appendOutput(stdout, chunk, outputByteLimit);
        });
        proc.stderr.on("data", (chunk) => {
            appendOutput(stderr, chunk, outputByteLimit);
        });
        proc.once("error", (error) => {
            appendOutput(stderr, error.message, outputByteLimit);
            resolve({
                exitCode: null,
                stdout: formatOutput(stdout, "stdout", outputByteLimit),
                stderr: formatOutput(stderr, "stderr", outputByteLimit),
            });
        });
        proc.once("close", (exitCode) => {
            resolve({
                exitCode,
                stdout: formatOutput(stdout, "stdout", outputByteLimit),
                stderr: formatOutput(stderr, "stderr", outputByteLimit),
            });
        });
        proc.stdin.end(stdin);
    });
}

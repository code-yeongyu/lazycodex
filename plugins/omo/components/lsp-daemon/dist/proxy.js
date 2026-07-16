import { existsSync, realpathSync } from "node:fs";
import { basename, delimiter, dirname, isAbsolute } from "node:path";
import { handleLspMcpRequest } from "@oh-my-opencode/lsp-core/mcp";
import { createStandaloneMcpRequestContext, runWithRequestContext } from "@oh-my-opencode/lsp-core/request-context";
import { jsonRpcId, runJsonRpcStdioServer, successResponse } from "@oh-my-opencode/mcp-stdio-core";
import { isPlainRecord } from "@oh-my-opencode/mcp-stdio-core/record";
import { callToolViaDaemon } from "./daemon-client.js";
import { daemonPaths } from "./paths.js";
const DEFAULT_STARTUP_TIMEOUT_MS = 10_000;
export async function runMcpStdioProxy(options = {}) {
    const input = options.input ?? process.stdin;
    const output = options.output ?? process.stdout;
    const stderr = options.stderr ?? process.stderr;
    const startupTimeoutMs = options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
    const lifecycleController = new AbortController();
    const abortFromInput = () => lifecycleController.abort();
    let startupExpired = false;
    let startupTimer;
    const clearStartupWatchdog = () => {
        if (startupTimer === undefined)
            return;
        clearTimeout(startupTimer);
        startupTimer = undefined;
    };
    input.once("end", abortFromInput);
    input.once("close", abortFromInput);
    if (startupTimeoutMs > 0) {
        startupTimer = setTimeout(() => {
            startupExpired = true;
            input.destroy();
            try {
                stderr.write(`[lsp-daemon] no MCP request received within ${startupTimeoutMs}ms; exiting\n`);
            }
            catch (error) {
                if (stderr !== process.stderr) {
                    process.stderr.write(`[lsp-daemon] startup diagnostic failed: ${error instanceof Error ? error.message : String(error)}\n`);
                }
            }
        }, startupTimeoutMs);
    }
    try {
        const paths = options.paths ?? daemonPaths();
        const env = options.env ?? process.env;
        const cwd = options.cwd ?? inferOpenCodeProjectCwd(env["LSP_TOOLS_MCP_PROJECT_CONFIG"]);
        const contextEnv = cwd === undefined ? env : canonicalizeContextEnv(env);
        const contextInput = {
            env: contextEnv,
            ...(cwd === undefined ? {} : { cwd }),
            ...(options.homeDir === undefined ? {} : { homeDir: options.homeDir }),
        };
        const context = options.context ?? createStandaloneMcpRequestContext(contextInput);
        const callOptions = {
            paths,
            context,
            ...(options.ensure ? { ensure: options.ensure } : {}),
            signal: lifecycleController.signal,
        };
        await runJsonRpcStdioServer({
            input,
            output,
            idleTimeoutMs: 0,
            handler: (request, requestOptions) => {
                clearStartupWatchdog();
                return runWithRequestContext(context, () => handleProxyRequest(request, requestOptions));
            },
            handlerOptions: callOptions,
            onHandlerError: (error) => {
                stderr.write(`[lsp-daemon] proxy error: ${error instanceof Error ? error.message : String(error)}\n`);
            },
        });
    }
    catch (error) {
        if (!startupExpired || !isPrematureCloseError(error))
            throw error;
    }
    finally {
        if (startupTimer !== undefined)
            clearTimeout(startupTimer);
        input.removeListener("end", abortFromInput);
        input.removeListener("close", abortFromInput);
    }
}
function isPrematureCloseError(error) {
    return error instanceof Error && Reflect.get(error, "code") === "ERR_STREAM_PREMATURE_CLOSE";
}
async function handleProxyRequest(parsed, callOptions) {
    const toolCall = asToolCall(parsed);
    if (!toolCall)
        return handleLspMcpRequest(parsed);
    const result = await callToolViaDaemon(toolCall.name, toolCall.args, callOptions);
    return successResponse(toolCall.id, {
        content: result.content,
        isError: result.isError ?? false,
        details: result.details,
    });
}
function asToolCall(parsed) {
    if (!isPlainRecord(parsed) || parsed["method"] !== "tools/call")
        return null;
    const params = parsed["params"];
    if (!isPlainRecord(params) || typeof params["name"] !== "string")
        return null;
    const args = params["arguments"];
    return { id: jsonRpcId(parsed["id"]), name: params["name"], args: isPlainRecord(args) ? args : {} };
}
function inferOpenCodeProjectCwd(projectConfigEnv) {
    if (!projectConfigEnv)
        return undefined;
    for (const entry of projectConfigEnv.split(delimiter)) {
        const projectRoot = projectRootFromOpenCodeConfigPath(entry);
        if (projectRoot)
            return projectRoot;
    }
    return undefined;
}
function canonicalizeContextEnv(env) {
    return {
        ...env,
        LSP_TOOLS_MCP_PROJECT_CONFIG: canonicalizePathList(env["LSP_TOOLS_MCP_PROJECT_CONFIG"]),
        LSP_TOOLS_MCP_USER_CONFIG: canonicalizePath(env["LSP_TOOLS_MCP_USER_CONFIG"]),
        LSP_TOOLS_MCP_INSTALL_DECISIONS: canonicalizePath(env["LSP_TOOLS_MCP_INSTALL_DECISIONS"]),
    };
}
function canonicalizePathList(value) {
    if (value === undefined)
        return undefined;
    return value
        .split(delimiter)
        .map((entry) => canonicalizePath(entry) ?? entry)
        .join(delimiter);
}
function canonicalizePath(value) {
    if (value === undefined || !isAbsolute(value) || !existsSync(value))
        return value;
    return realpathSync(value);
}
function projectRootFromOpenCodeConfigPath(path) {
    if (basename(path) !== "lsp.json" && basename(path) !== "lsp-client.json")
        return undefined;
    const configDir = dirname(path);
    const configDirName = basename(configDir);
    if (configDirName !== ".opencode" && configDirName !== ".omo")
        return undefined;
    return dirname(configDir);
}

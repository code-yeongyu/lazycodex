import { createInterface } from "node:readline";
import { coerceToolArguments, executeLspTool, LSP_MCP_TOOLS } from "./tools.js";
const SERVER_NAME = "lsp";
const SERVER_VERSION = "0.1.0";
const DEFAULT_IDLE_TIMEOUT_MS = 10 * 60_000;
const noopLog = () => { };
export async function handleLspMcpRequest(input) {
    if (!isRecord(input)) {
        return errorResponse(null, -32600, "Invalid Request");
    }
    const id = jsonRpcId(input["id"]);
    const method = input["method"];
    if (method === "notifications/initialized")
        return undefined;
    if (method === "ping")
        return successResponse(id, {});
    if (method === "initialize") {
        const protocolVersion = requestedProtocolVersion(input["params"]);
        return successResponse(id, {
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
            protocolVersion,
        });
    }
    if (method === "tools/list") {
        return successResponse(id, { tools: LSP_MCP_TOOLS.map(describeTool) });
    }
    if (method === "resources/list") {
        return successResponse(id, { resources: [] });
    }
    if (method === "resources/templates/list") {
        return successResponse(id, { resourceTemplates: [] });
    }
    if (method === "tools/call") {
        return handleToolCall(id, input["params"]);
    }
    return errorResponse(id, -32601, `Method not found: ${String(method)}`);
}
export async function runMcpStdioServer(input = process.stdin, output = process.stdout, options = {}) {
    const log = options.log ?? noopLog;
    const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    let idleTimer = null;
    let closed = false;
    const clearIdleTimer = () => {
        if (idleTimer === null)
            return;
        clearTimeout(idleTimer);
        idleTimer = null;
    };
    const armIdleTimer = () => {
        clearIdleTimer();
        if (idleTimeoutMs <= 0)
            return;
        idleTimer = setTimeout(() => {
            closed = true;
            log("idle_timeout", { idle_timeout_ms: idleTimeoutMs });
            void options.onIdleTimeout?.();
        }, idleTimeoutMs);
        idleTimer.unref();
    };
    log("stdio_started", { cwd: process.cwd(), idle_timeout_ms: idleTimeoutMs });
    armIdleTimer();
    const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
    try {
        for await (const line of lines) {
            if (closed)
                break;
            armIdleTimer();
            if (!line.trim())
                continue;
            let parsed;
            try {
                parsed = JSON.parse(line);
            }
            catch (error) {
                log("parse_error", { message: messageFromError(error) });
                output.write(`${JSON.stringify(errorResponse(null, -32700, "Parse error", messageFromError(error)))}\n`);
                continue;
            }
            const id = isRecord(parsed) ? jsonRpcId(parsed["id"]) : null;
            const method = isRecord(parsed) && typeof parsed["method"] === "string" ? parsed["method"] : null;
            log("request", { id: id === null ? null : String(id), method });
            const response = await handleLspMcpRequest(parsed);
            if (response) {
                output.write(`${JSON.stringify(response)}\n`);
                const resultIsError = response.result?.isError === true;
                const resultHasActionableError = hasActionableToolError(response.result);
                log("response", {
                    id: String(response.id),
                    method,
                    is_error: response.error !== undefined,
                    result_is_error: resultIsError,
                    actionable_error: resultHasActionableError,
                });
                if (resultIsError || resultHasActionableError) {
                    const message = actionableToolMessage(response.result);
                    log("tool_error", {
                        id: String(response.id),
                        method,
                        ...(message === undefined ? {} : { message: message.slice(0, 1_000) }),
                    });
                }
            }
        }
    }
    finally {
        clearIdleTimer();
        log("stdio_stopped");
    }
}
function hasActionableToolError(result) {
    if (result === undefined)
        return false;
    if (result.isError === true)
        return true;
    const details = result["details"];
    return isRecord(details) && typeof details["error"] === "string";
}
function actionableToolMessage(result) {
    const details = result?.["details"];
    if (isRecord(details) && typeof details["error"] === "string") {
        return details["error"];
    }
    const firstContent = result?.content?.[0];
    return firstContent?.text;
}
async function handleToolCall(id, params) {
    if (!isRecord(params) || typeof params["name"] !== "string") {
        return errorResponse(id, -32602, "tools/call requires params.name");
    }
    try {
        const result = await executeLspTool(params["name"], coerceToolArguments(params["arguments"]));
        return successResponse(id, {
            content: result.content,
            isError: result.isError ?? false,
            details: result.details,
        });
    }
    catch (error) {
        return successResponse(id, {
            content: [{ type: "text", text: messageFromError(error) }],
            isError: true,
        });
    }
}
function describeTool(tool) {
    return {
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
    };
}
function successResponse(id, result) {
    return { jsonrpc: "2.0", id, result };
}
function errorResponse(id, code, message, data) {
    return { jsonrpc: "2.0", id, error: data === undefined ? { code, message } : { code, message, data } };
}
function requestedProtocolVersion(params) {
    if (!isRecord(params) || typeof params["protocolVersion"] !== "string")
        return "2024-11-05";
    return params["protocolVersion"];
}
function jsonRpcId(value) {
    return typeof value === "string" || typeof value === "number" || value === null ? value : null;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function messageFromError(error) {
    return error instanceof Error ? error.message : String(error);
}

import { appendFileSync, renameSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const LOG_FILE_NAME = "omo-lsp-mcp.log";
const MAX_LOG_BYTES = 5 * 1024 * 1024;
export function mcpLifecycleLogPath() {
    return join(tmpdir(), LOG_FILE_NAME);
}
export function writeMcpLifecycleLog(event, fields = {}) {
    const path = mcpLifecycleLogPath();
    try {
        rotateLogIfNeeded(path);
        appendFileSync(path, `${JSON.stringify({ ts: new Date().toISOString(), event, pid: process.pid, ppid: process.ppid, ...fields })}\n`);
    }
    catch (error) {
        if (error instanceof Error)
            return;
        return;
    }
}
function rotateLogIfNeeded(path) {
    try {
        if (statSync(path).size < MAX_LOG_BYTES)
            return;
        renameSync(path, `${path}.1`);
    }
    catch (error) {
        if (error instanceof Error)
            return;
        return;
    }
}

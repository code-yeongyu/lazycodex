const HEADER_SEPARATOR = "\r\n\r\n";
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INTERNAL_ERROR = -32603;
export class JsonRpcConnection {
    constructor(reader, writer) {
        this.reader = reader;
        this.writer = writer;
        this.pendingRequests = new Map();
        this.notificationHandlers = new Map();
        this.requestHandlers = new Map();
        this.closeHandlers = [];
        this.errorHandlers = [];
        this.inputBuffer = Buffer.alloc(0);
        this.nextRequestId = 1;
        this.listening = false;
        this.disposed = false;
        this.handleData = (chunk) => {
            const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf8");
            this.inputBuffer = Buffer.concat([this.inputBuffer, chunkBuffer]);
            this.drainInputBuffer();
        };
        this.handleClose = () => {
            for (const handler of this.closeHandlers) {
                handler();
            }
        };
        this.handleStreamError = (error) => {
            this.emitError(error);
        };
    }
    listen() {
        if (this.listening)
            return;
        this.listening = true;
        this.reader.on("data", this.handleData);
        this.reader.on("close", this.handleClose);
        this.reader.on("end", this.handleClose);
        this.reader.on("error", this.handleStreamError);
        this.writer.on("error", this.handleStreamError);
    }
    onNotification(method, handler) {
        this.notificationHandlers.set(method, handler);
    }
    onRequest(method, handler) {
        this.requestHandlers.set(method, handler);
    }
    onClose(handler) {
        this.closeHandlers.push(handler);
    }
    onError(handler) {
        this.errorHandlers.push(handler);
    }
    async sendRequest(method, params) {
        if (this.disposed)
            throw new Error("JSON-RPC connection is disposed");
        const id = this.nextRequestId;
        this.nextRequestId += 1;
        const message = params === undefined ? { jsonrpc: "2.0", id, method } : { jsonrpc: "2.0", id, method, params };
        const responsePromise = new Promise((resolve, reject) => {
            this.pendingRequests.set(String(id), {
                resolve(result) {
                    resolve(result);
                },
                reject,
            });
        });
        try {
            await this.writeMessage(message);
        }
        catch (error) {
            this.pendingRequests.delete(String(id));
            throw error;
        }
        return responsePromise;
    }
    async sendNotification(method, params) {
        if (this.disposed)
            return;
        const message = params === undefined ? { jsonrpc: "2.0", method } : { jsonrpc: "2.0", method, params };
        await this.writeMessage(message);
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.reader.off("data", this.handleData);
        this.reader.off("close", this.handleClose);
        this.reader.off("end", this.handleClose);
        this.reader.off("error", this.handleStreamError);
        this.writer.off("error", this.handleStreamError);
        for (const pending of this.pendingRequests.values()) {
            pending.reject(new Error("JSON-RPC connection disposed"));
        }
        this.pendingRequests.clear();
        this.notificationHandlers.clear();
        this.requestHandlers.clear();
    }
    drainInputBuffer() {
        while (true) {
            const headerEnd = this.inputBuffer.indexOf(HEADER_SEPARATOR);
            if (headerEnd === -1)
                return;
            const headers = this.inputBuffer.subarray(0, headerEnd).toString("ascii");
            const contentLength = parseContentLength(headers);
            if (contentLength === null) {
                this.inputBuffer = Buffer.alloc(0);
                this.emitError(new Error("JSON-RPC message is missing Content-Length header"));
                return;
            }
            const bodyStart = headerEnd + Buffer.byteLength(HEADER_SEPARATOR);
            const bodyEnd = bodyStart + contentLength;
            if (this.inputBuffer.length < bodyEnd)
                return;
            const body = this.inputBuffer.subarray(bodyStart, bodyEnd).toString("utf8");
            this.inputBuffer = this.inputBuffer.subarray(bodyEnd);
            this.dispatchBody(body);
        }
    }
    dispatchBody(body) {
        let parsed;
        try {
            parsed = JSON.parse(body);
        }
        catch (error) {
            void this.writeError(null, PARSE_ERROR, error instanceof Error ? error.message : "Parse error").catch((writeError) => this.emitError(toError(writeError)));
            return;
        }
        if (!isJsonRpcObject(parsed)) {
            void this.writeError(null, INVALID_REQUEST, "Invalid JSON-RPC message").catch((error) => this.emitError(toError(error)));
            return;
        }
        if ("id" in parsed && ("result" in parsed || "error" in parsed)) {
            this.handleResponse(parsed);
            return;
        }
        if (typeof parsed["method"] !== "string") {
            const id = getMessageId(parsed) ?? null;
            void this.writeError(id, INVALID_REQUEST, "Invalid JSON-RPC method").catch((error) => this.emitError(toError(error)));
            return;
        }
        if ("id" in parsed) {
            this.handleRequest(parsed);
            return;
        }
        this.handleNotification(parsed["method"], parsed["params"]);
    }
    handleResponse(message) {
        const id = getMessageId(message);
        if (id === undefined)
            return;
        const pending = this.pendingRequests.get(String(id));
        if (!pending)
            return;
        this.pendingRequests.delete(String(id));
        if ("error" in message) {
            pending.reject(jsonRpcErrorToError(message["error"]));
            return;
        }
        pending.resolve(message["result"]);
    }
    handleNotification(method, params) {
        const handler = this.notificationHandlers.get(method);
        if (!handler)
            return;
        try {
            handler(params);
        }
        catch (error) {
            this.emitError(toError(error));
        }
    }
    handleRequest(message) {
        const id = getMessageId(message);
        if (id === undefined) {
            void this.writeError(null, INVALID_REQUEST, "Invalid JSON-RPC id").catch((error) => this.emitError(toError(error)));
            return;
        }
        const method = typeof message["method"] === "string" ? message["method"] : "";
        const handler = this.requestHandlers.get(method);
        if (!handler) {
            void this.writeError(id, METHOD_NOT_FOUND, `Method not found: ${method}`).catch((error) => this.emitError(toError(error)));
            return;
        }
        Promise.resolve()
            .then(() => handler(message["params"]))
            .then((result) => this.writeMessage({ jsonrpc: "2.0", id, result }), (error) => this.writeError(id, INTERNAL_ERROR, toError(error).message))
            .catch((error) => this.emitError(toError(error)));
    }
    async writeError(id, code, message) {
        await this.writeMessage({ jsonrpc: "2.0", id, error: { code, message } });
    }
    writeMessage(message) {
        const body = JSON.stringify(message);
        const payload = `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
        return new Promise((resolve, reject) => {
            this.writer.write(payload, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    emitError(error) {
        for (const handler of this.errorHandlers) {
            handler(error);
        }
    }
}
function parseContentLength(headers) {
    for (const line of headers.split("\r\n")) {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1)
            continue;
        const name = line.slice(0, separatorIndex).trim().toLowerCase();
        if (name !== "content-length")
            continue;
        const value = Number.parseInt(line.slice(separatorIndex + 1).trim(), 10);
        return Number.isFinite(value) && value >= 0 ? value : null;
    }
    return null;
}
function isJsonRpcObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getMessageId(message) {
    const id = message["id"];
    if (typeof id === "number" || typeof id === "string" || id === null)
        return id;
    return undefined;
}
function jsonRpcErrorToError(value) {
    if (!isJsonRpcObject(value))
        return new Error("JSON-RPC request failed");
    const message = typeof value["message"] === "string" ? value["message"] : "JSON-RPC request failed";
    const error = new Error(message);
    if (typeof value["code"] === "number") {
        error.name = `JsonRpcError(${value["code"]})`;
    }
    return error;
}
function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}

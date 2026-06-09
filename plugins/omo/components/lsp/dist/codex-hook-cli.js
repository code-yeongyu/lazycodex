import { stdin as processStdin } from "node:process";
import { disposeLspBackend, isRecord, runLspPostCompactHook, runLspPostToolUseHook } from "./codex-hook.js";
export async function runPostToolUseHookCli(stdin = processStdin) {
    await runHookCli((input) => runLspPostToolUseHook(input), stdin);
}
export async function runPostCompactHookCli(stdin = processStdin) {
    await runHookCli((input) => runLspPostCompactHook(input), stdin);
}
async function runHookCli(runHook, stdin) {
    try {
        const raw = await readStdin(stdin);
        if (!raw.trim())
            return;
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (error) {
            if (error instanceof SyntaxError)
                return;
            throw error;
        }
        const input = isRecord(parsed) ? parsed : {};
        const output = await runHook(input);
        if (output)
            process.stdout.write(output);
    }
    finally {
        await disposeLspBackend();
    }
}
async function readStdin(stdin) {
    stdin.setEncoding("utf8");
    let raw = "";
    for await (const chunk of stdin) {
        raw += chunk;
    }
    return raw;
}

import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
// Codex registers a role from a standalone `agents/*.toml` (keyed by its `name`, else the
// file stem) or from an `[agents.<name>]` table in config.toml. It reads both under
// CODEX_HOME and under a project's `.codex/`. Codex still validates the role itself (trust,
// required fields); this only answers "does a role file declare this name".
const NAME_LINE = /^\s*name\s*=\s*"([^"\n]+)"\s*(?:#.*)?$/m;
const AGENT_TABLE = /^\s*\[agents\.(?:"([^"\n]+)"|([A-Za-z0-9_-]+))\]\s*(?:#.*)?$/gm;
function readText(path) {
    try {
        return readFileSync(path, "utf8");
    }
    catch {
        return null;
    }
}
function standaloneRoleNames(agentsDir) {
    let entries;
    try {
        entries = readdirSync(agentsDir);
    }
    catch {
        return [];
    }
    const names = [];
    for (const entry of entries) {
        if (!entry.endsWith(".toml"))
            continue;
        const text = readText(join(agentsDir, entry));
        if (text === null)
            continue;
        names.push(text.match(NAME_LINE)?.[1] ?? basename(entry, ".toml"));
    }
    return names;
}
function configTableRoleNames(configPath) {
    const text = readText(configPath);
    if (text === null)
        return [];
    return [...text.matchAll(AGENT_TABLE)].map((match) => match[1] ?? match[2] ?? "").filter(Boolean);
}
function codexDirs(cwd, env) {
    const dirs = [resolve(env["CODEX_HOME"]?.trim() || join(homedir(), ".codex"))];
    for (let dir = resolve(cwd);; dir = dirname(dir)) {
        dirs.push(join(dir, ".codex"));
        if (dirname(dir) === dir)
            break;
    }
    return [...new Set(dirs)];
}
export function registeredAgentRoles(cwd, env = process.env) {
    const names = new Set();
    for (const dir of codexDirs(cwd, env)) {
        for (const name of standaloneRoleNames(join(dir, "agents")))
            names.add(name);
        for (const name of configTableRoleNames(join(dir, "config.toml")))
            names.add(name);
    }
    return names;
}

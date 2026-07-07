#!/usr/bin/env node

// components/ultrawork/src/cli.ts
import { stdin as processStdin, stdout as processStdout } from "node:process";

// components/ultrawork/src/codex-hook.ts
import { readFileSync as readFileSync2 } from "node:fs";

// components/ultrawork/src/skill-pointer.ts
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// components/ultrawork/src/directive.ts
import { readFileSync } from "node:fs";
var ULTRAWORK_DIRECTIVE = readFileSync(new URL("../directive.md", import.meta.url), "utf8");

// components/ultrawork/src/skill-pointer.ts
var ULTRAWORK_SKILL_POINTER_TEMPLATE = `<ultrawork-mode>
ULTRAWORK MODE IS ACTIVE FOR THIS TASK.

MANDATORY BOOTSTRAP: do all three steps, in order, before anything else.

1. First user-visible line this turn MUST be exactly:
\`ULTRAWORK MODE ENABLED!\`

2. Call \`create_goal\` NOW with \`objective\` set to the user's request.
Send \`objective\` only: no \`status\`, no budget fields. If the
\`create_goal\` tool is unavailable, open your reply with a binding
\`# Goal\` block instead. Never skip this step.

3. Read the FULL ultrawork directive NOW, before any other tool call,
plan, or edit. It is the \`ultrawork\` skill, stored at:

{{ULTRAWORK_SKILL_PATH}}

Read the whole file. If a read result comes back truncated, keep
reading the remaining line ranges until you have seen every line.
Every rule in that file is binding for this entire task: no
compromise, no summarizing from memory, no skipping. If the file does
not exist, tell the user the omo ultrawork skill is missing and
continue with steps 1 and 2 plus evidence-bound execution.

Do not start the requested work until all three steps are complete.
</ultrawork-mode>
`;
var ULTRAWORK_SKILL_PATH_PLACEHOLDER = "{{ULTRAWORK_SKILL_PATH}}";
var ULTRAWORK_SKILL_FILE_URL = new URL("../../../skills/ultrawork/SKILL.md", import.meta.url);
function resolveUltraworkSkillFilePath() {
  return fileURLToPath(ULTRAWORK_SKILL_FILE_URL);
}
function buildUltraworkSkillPointer(skillFilePath) {
  return ULTRAWORK_SKILL_POINTER_TEMPLATE.replace(ULTRAWORK_SKILL_PATH_PLACEHOLDER, skillFilePath);
}
function buildUltraworkAdditionalContext(options = {}) {
  const skillFilePath = options.skillFilePath === undefined ? resolveUltraworkSkillFilePath() : options.skillFilePath;
  if (skillFilePath !== null && existsSync(skillFilePath)) {
    return buildUltraworkSkillPointer(skillFilePath);
  }
  return ULTRAWORK_DIRECTIVE;
}

// components/ultrawork/src/codex-hook.ts
var ULTRAWORK_CURRENT_PROMPT_PATTERN = /(?:ultrawork|ulw)/i;
var ULTRAWORK_DIRECTIVE_MARKER = "<ultrawork-mode>";
var TRANSCRIPT_SEARCH_BYTES = 512000;
var CONTEXT_PRESSURE_MARKERS = [
  "context compacted",
  "context_length_exceeded",
  "skill descriptions were shortened",
  "context_too_large",
  "codex ran out of room in the model's context window",
  "your input exceeds the context window",
  "long threads and multiple compactions"
];
function runUserPromptSubmitHook(input, options = {}) {
  if (!isCodexUserPromptSubmitInput(input))
    return "";
  if (isContextPressureRecoveryPrompt(input.prompt))
    return "";
  if (hasUltraworkDirectiveAlreadyInTranscript(input.transcript_path))
    return "";
  if (isContextPressureTranscript(input.transcript_path))
    return "";
  return isUltraworkPrompt(input.prompt) ? formatAdditionalContextOutput(buildUltraworkAdditionalContext(options)) : "";
}
function hasUltraworkDirectiveAlreadyInTranscript(transcriptPath) {
  if (transcriptPath === undefined || transcriptPath === null)
    return false;
  try {
    const rawTranscript = readTranscriptTail(transcriptPath);
    for (const line of rawTranscript.split(/\r?\n/)) {
      const parsed = parseJsonLine(line);
      if (parsed === null) {
        continue;
      }
      if (!isRecord(parsed)) {
        continue;
      }
      const hookSpecificOutput = parsed["hookSpecificOutput"];
      if (!isRecord(hookSpecificOutput)) {
        continue;
      }
      if (hookSpecificOutput["hookEventName"] !== "UserPromptSubmit") {
        continue;
      }
      if (typeof hookSpecificOutput["additionalContext"] === "string" && hookSpecificOutput["additionalContext"].includes(ULTRAWORK_DIRECTIVE_MARKER)) {
        return true;
      }
    }
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
  return false;
}
function readTranscriptTail(transcriptPath) {
  const rawTranscript = readFileSync2(transcriptPath);
  return rawTranscript.subarray(Math.max(0, rawTranscript.byteLength - TRANSCRIPT_SEARCH_BYTES)).toString("utf8");
}
function isUltraworkPrompt(prompt) {
  return ULTRAWORK_CURRENT_PROMPT_PATTERN.test(prompt);
}
function isContextPressureRecoveryPrompt(prompt) {
  const normalizedPrompt = prompt.toLowerCase();
  return CONTEXT_PRESSURE_MARKERS.some((marker) => normalizedPrompt.includes(marker));
}
function isContextPressureTranscript(transcriptPath) {
  if (transcriptPath === undefined || transcriptPath === null)
    return false;
  try {
    return isContextPressureRecoveryPrompt(readTranscriptTail(transcriptPath));
  } catch (error) {
    if (error instanceof Error)
      return false;
    throw error;
  }
}
function formatAdditionalContextOutput(additionalContext) {
  const normalizedContext = normalizeAdditionalContext(additionalContext);
  if (normalizedContext.length === 0)
    return "";
  const output = {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: normalizedContext
    }
  };
  return `${JSON.stringify(output)}
`;
}
function normalizeAdditionalContext(additionalContext) {
  return additionalContext.replace(/\r\n/g, `
`).replace(/\r/g, `
`).trim();
}
function parseJsonLine(line) {
  if (line.trim().length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(line);
    return parsed;
  } catch (error) {
    if (error instanceof Error) {
      return null;
    }
    throw error;
  }
}
function isCodexUserPromptSubmitInput(value) {
  return isRecord(value) && value["hook_event_name"] === "UserPromptSubmit" && typeof value["prompt"] === "string" && (value["transcript_path"] === undefined || value["transcript_path"] === null || typeof value["transcript_path"] === "string");
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// components/ultrawork/src/cli.ts
var command = process.argv[2];
var subcommand = process.argv[3];
if (command === "hook" && subcommand === "user-prompt-submit") {
  await runHookCli();
} else {
  process.stderr.write(`Usage: omo-ultrawork hook user-prompt-submit
`);
  process.exitCode = 1;
}
async function runHookCli() {
  const raw = await readStdin();
  if (raw.trim().length === 0)
    return;
  const parsed = parseHookInput(raw);
  const output = runUserPromptSubmitHook(parsed);
  if (output.length > 0) {
    processStdout.write(output);
  }
}
function parseHookInput(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError)
      return;
    throw error;
  }
}
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    processStdin.setEncoding("utf8");
    processStdin.on("data", (chunk) => {
      data += chunk;
    });
    processStdin.once("error", () => {
      resolve(data);
    });
    processStdin.once("end", () => {
      resolve(data);
    });
  });
}

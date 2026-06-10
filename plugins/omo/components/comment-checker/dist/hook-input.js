export function toHookInput(request, context) {
    return {
        session_id: context.sessionId,
        tool_name: request.toolName,
        transcript_path: context.transcriptPath ?? "",
        cwd: context.cwd,
        hook_event_name: "PostToolUse",
        tool_input: request.toolInput,
    };
}

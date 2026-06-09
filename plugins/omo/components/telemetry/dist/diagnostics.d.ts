export type TelemetryDiagnosticEvent = "telemetry_activity_state_read_failed" | "telemetry_activity_state_write_failed" | "telemetry_capture_failed" | "telemetry_cpu_info_unavailable" | "telemetry_posthog_import_failed" | "telemetry_posthog_init_failed" | "telemetry_shutdown_failed";
export type TelemetryDiagnosticSource = "cli" | "install" | "plugin" | "shared";
export type TelemetryDiagnosticErrorKind = "error" | "non_error";
export type TelemetryDiagnosticInput = {
    readonly event: TelemetryDiagnosticEvent;
    readonly source: TelemetryDiagnosticSource;
    readonly error?: unknown;
    readonly errorKind?: TelemetryDiagnosticErrorKind;
};
export declare function getTelemetryDiagnosticsFilePath(): string;
export declare function writeTelemetryDiagnostic(input: TelemetryDiagnosticInput, now?: Date): void;
export declare function cleanupTelemetryDiagnostics(now?: Date): void;

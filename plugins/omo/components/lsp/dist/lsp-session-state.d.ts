export interface DiagnosticsObservation {
    readonly filePath: string;
    readonly unavailable: boolean;
}
export declare function sessionIdFrom(input: {
    readonly session_id?: unknown;
}): string | undefined;
export declare function shouldSkipUnavailableLspDiagnostics(filePath: string, sessionId: string | undefined): boolean;
export declare function recordLspDiagnosticsObservations(sessionId: string | undefined, observations: readonly DiagnosticsObservation[]): void;
export declare function markLspSessionCompacted(sessionId: string | undefined): void;
export declare function isUnavailableLspDiagnostics(diagnostics: string): boolean;

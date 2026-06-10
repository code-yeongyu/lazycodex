export interface TranscriptSearchOptions {
    readonly latestCompactedReplacementOnly?: boolean;
}
export declare function readTranscriptSearchText(transcriptPath: string, options?: TranscriptSearchOptions): string | null;

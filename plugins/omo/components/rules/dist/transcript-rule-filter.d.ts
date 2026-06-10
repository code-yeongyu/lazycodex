import type { LoadedRule } from "./rules/types.js";
import type { TranscriptSearchOptions } from "./transcript-search.js";
export declare function filterRulesAlreadyInTranscript(rules: ReadonlyArray<LoadedRule>, transcriptPath: string | null, markInjected: (rule: LoadedRule) => void, options?: TranscriptSearchOptions): LoadedRule[];

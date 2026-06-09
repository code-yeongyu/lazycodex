export type ClosingDelimiter = {
    readonly start: number;
    readonly bodyStart: number;
};
export declare function stripBom(content: string): string;
export declare function getOpeningDelimiterLength(content: string): number;
export declare function findClosingDelimiter(content: string, openingLength: number): ClosingDelimiter | null;

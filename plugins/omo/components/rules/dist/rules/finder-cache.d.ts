import { scanRuleFiles } from "./scanner.js";
type ScannedRuleFiles = ReturnType<typeof scanRuleFiles>;
interface SingleFileInfo {
    readonly path: string;
    readonly realPath: string;
}
export interface RuleDiscoveryCache {
    readonly scannedRuleFiles: Map<string, ScannedRuleFiles>;
    readonly singleFileInfo: Map<string, SingleFileInfo | null>;
}
export declare function createRuleDiscoveryCache(): RuleDiscoveryCache;
export declare function scanRuleFilesCached(rootDir: string, cache: RuleDiscoveryCache | undefined): ScannedRuleFiles;
export declare function singleFileInfoCached(filePath: string, cache: RuleDiscoveryCache | undefined): SingleFileInfo | null;
export {};

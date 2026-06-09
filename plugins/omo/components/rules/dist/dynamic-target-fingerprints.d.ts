import type { PiRulesConfig } from "./rules/types.js";
export interface DynamicTargetFingerprint {
    targetPath: string;
    cacheKey: string;
    fingerprint: string;
}
export declare function fingerprintDynamicTargets(cwd: string, targetPaths: ReadonlyArray<string>, config: PiRulesConfig): DynamicTargetFingerprint[];

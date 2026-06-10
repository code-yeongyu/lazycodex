import type { PostCompactClaimResult } from "./persistent-cache.js";
import type { PostCompactPendingKind } from "./post-compact-state.js";
export declare function claimedPostCompactKind<T extends PostCompactPendingKind>(result: PostCompactClaimResult, kind: T): T | undefined;
export declare function shouldSkipPostCompactClaim(result: PostCompactClaimResult, recoveryInProgress: boolean): boolean;

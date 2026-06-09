export function claimedPostCompactKind(result, kind) {
    return result === "claimed" ? kind : undefined;
}
export function shouldSkipPostCompactClaim(result, recoveryInProgress) {
    return result === "contended" || (result === "not-pending" && recoveryInProgress);
}

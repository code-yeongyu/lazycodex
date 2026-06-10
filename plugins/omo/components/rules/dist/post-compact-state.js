export function postCompactKindState(kinds) {
    if (kinds.size === 0) {
        return undefined;
    }
    return {
        ...(kinds.has("static") ? { static: true } : {}),
        ...(kinds.has("dynamic") ? { dynamic: true } : {}),
    };
}
export function postCompactPendingKinds(state) {
    const pendingKinds = new Set();
    if (state.compacted === true || state.postCompactPending?.static === true) {
        pendingKinds.add("static");
    }
    if (state.compacted === true || state.postCompactPending?.dynamic === true) {
        pendingKinds.add("dynamic");
    }
    return pendingKinds;
}
export function postCompactRecoveringKinds(state) {
    const recoveringKinds = new Set();
    if (state.postCompactRecovering?.static === true) {
        recoveringKinds.add("static");
    }
    if (state.postCompactRecovering?.dynamic === true) {
        recoveringKinds.add("dynamic");
    }
    return recoveringKinds;
}

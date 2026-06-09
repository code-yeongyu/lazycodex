export type PostCompactPendingKind = "static" | "dynamic";
export interface PostCompactPendingState {
    static?: boolean;
    dynamic?: boolean;
}
export interface PostCompactStateFields {
    readonly postCompactPending?: PostCompactPendingState;
    readonly postCompactRecovering?: PostCompactPendingState;
    readonly compacted?: boolean;
}
export declare function postCompactKindState(kinds: ReadonlySet<PostCompactPendingKind>): PostCompactPendingState | undefined;
export declare function postCompactPendingKinds(state: PostCompactStateFields): Set<PostCompactPendingKind>;
export declare function postCompactRecoveringKinds(state: PostCompactStateFields): Set<PostCompactPendingKind>;

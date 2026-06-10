export type PostHogActivityState = {
    readonly lastActiveDayUTC?: string;
};
export type PostHogActivityCaptureState = {
    readonly dayUTC: string;
    readonly captureDaily: boolean;
};
export declare function getPostHogActivityCaptureState(now?: Date): PostHogActivityCaptureState;

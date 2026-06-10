import { reportBestEffortCleanupError } from "./cleanup-errors.js";
export function installProcessSignalCleanup(cleanup) {
    const signals = process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGBREAK"] : ["SIGINT", "SIGTERM"];
    const handler = () => {
        void cleanup().catch((error) => {
            reportBestEffortCleanupError("signal cleanup", error);
        });
    };
    for (const signal of signals) {
        process.on(signal, handler);
    }
    return () => {
        for (const signal of signals) {
            process.removeListener(signal, handler);
        }
    };
}

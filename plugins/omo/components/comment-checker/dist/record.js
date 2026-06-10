export function getString(input, keys) {
    for (const key of keys) {
        const value = input[key];
        if (typeof value === "string")
            return value;
    }
    return undefined;
}
export function isRecord(value) {
    return typeof value === "object" && value !== null;
}

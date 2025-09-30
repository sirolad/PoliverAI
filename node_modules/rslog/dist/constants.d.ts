export declare let LOG_LEVEL: {
    readonly silent: -1;
    readonly error: 0;
    readonly warn: 1;
    readonly info: 2;
    readonly log: 2;
    readonly verbose: 3;
};
export declare let LOG_TYPES: {
    error: {
        label: string;
        level: "error";
        color: import("./color.js").ColorFn;
    };
    warn: {
        label: string;
        level: "warn";
        color: import("./color.js").ColorFn;
    };
    info: {
        label: string;
        level: "info";
        color: import("./color.js").ColorFn;
    };
    start: {
        label: string;
        level: "info";
        color: import("./color.js").ColorFn;
    };
    ready: {
        label: string;
        level: "info";
        color: import("./color.js").ColorFn;
    };
    success: {
        label: string;
        level: "info";
        color: import("./color.js").ColorFn;
    };
    log: {
        level: "info";
    };
    debug: {
        label: string;
        level: "verbose";
        color: import("./color.js").ColorFn;
    };
};

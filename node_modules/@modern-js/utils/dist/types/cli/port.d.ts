/**
 * Get available free port.
 * @param port - Current port want to use.
 * @param tryLimits - Maximum number of retries.
 * @param strictPort - Whether to throw an error when the port is occupied.
 * @returns Available port number.
 */
export declare const getPort: (expectPort: string | number, { tryLimits, strictPort, slient, }?: {
    tryLimits?: number;
    strictPort?: boolean;
    slient?: boolean;
}) => Promise<number>;

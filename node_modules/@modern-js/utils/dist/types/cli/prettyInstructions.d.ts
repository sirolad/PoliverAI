export type AddressUrl = {
    label: string;
    url: string;
};
export declare const getAddressUrls: (protocol: string | undefined, port: number, host?: string) => {
    label: string;
    url: string;
}[];
export declare const prettyInstructions: (appContext: any, config: any) => string;

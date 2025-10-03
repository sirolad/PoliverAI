declare module '@poliverai/intl' {
  export function useTranslation(): {
    t: (key: string, fallback?: string) => string;
    get: <T = any>(key: string) => T;
    locale: string;
  };
  export const ReduxProvider: any;
}

export {};

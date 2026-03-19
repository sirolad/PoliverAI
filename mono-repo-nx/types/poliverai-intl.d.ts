declare module '@poliverai/intl' {
  import React from 'react';

  export const AuthProvider: React.FC<{ children?: React.ReactNode }>;
  export function useAuth(): {
    user: unknown;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void | Promise<void>;
    refreshUser?: () => Promise<void>;
    loading: boolean;
    isLoading?: boolean;
    isAuthenticated: boolean;
    isPro: boolean;
    reportsCount?: number | null;
  };
  export function useTranslation(): {
    t: (key: string, fallback?: string) => string;
    get: <T = any>(key: string) => T;
    locale: string;
  };
  export function t(key: string, fallback?: string): string;
  export const ReduxProvider: any;
  export const PaymentsService: any;
  export const transactionsService: any;
  export const policyService: any;
  export function useCreditsSummary(...args: any[]): any;
  export function getDefaultMonthRange(...args: any[]): any;
  export function computeSavedTotals(...args: any[]): any;
  export function getCostForReport(...args: any[]): any;
  export function formatRangeLabel(...args: any[]): any;
  export function getCost(...args: any[]): any;
  export function computeDerivedFree(...args: any[]): any;
  export function computeTransactionTotals(...args: any[]): any;
  export type ReportMetadata = any;
  export type Transaction = any;
}

export {};

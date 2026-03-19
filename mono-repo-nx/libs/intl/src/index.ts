export { default as useCreditsSummary } from './hooks/useCreditsSummary';
export type { Transaction } from './services/transactions';
export { default as PaymentsService } from './services/payments';
export * from './lib/eventHelpers';
export * from './lib/paymentsHelpers';
export {
  getApiBaseOrigin,
  buildCheckoutUrls,
  buildNativePaymentReturnUrl,
  POLIVERAI_DEEP_LINK_SCHEME,
  POLIVERAI_PAYMENT_RETURN_PATH,
} from './lib/paymentsHelpers';
export { default as transactionsService } from './services/transactions';
export * from './lib/transactionHelpers';
export * from './lib/dashboardHelpers';
let currentToken: string | null = null

export function getToken(): string | null {
  return currentToken
}

export function setToken(token: string | null) {
  currentToken = token
}

export { AuthContext } from './contexts/auth-context'

// Removed duplicate AuthProvider and useAuth exports to resolve conflicts
export { ReduxProvider } from './provider';
export * from './store';
export * from './slices/authSlice';
export * from './slices/localeSlice';
// Provide a non-hook `t` lookup for code that needs translations outside React
import enCA from './locales/en-US.json';

const _locales: Record<string, Record<string, unknown>> = {
  'en-US': enCA as unknown as Record<string, unknown>,
};

export function t(path: string, fallback?: string) {
  const parts = path.split('.');
  const messages = _locales['en-US'] || {};
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return fallback ?? path;
    }
  }
  return typeof cur === 'string' ? cur : fallback ?? String(cur);
}

// Re-export the hook for components that run inside React render
export { useTranslation } from './i18n';
export { AuthProvider } from './hooks/useAuth';
export { useAuth } from './hooks/useAuth';
export * from './types/api';
export * from './types/feature';
export { default as policyService } from './services/policyService';
export { cn } from './utils/cn';
export * from './hooks/useAvailableFeatures';
export { useAvailableFeatures } from './hooks/useAvailableFeatures';
export { default as useAccountStatus } from './hooks/useAccountStatus';
export { default as useAnalysisProgress } from './hooks/useAnalysisProgress';

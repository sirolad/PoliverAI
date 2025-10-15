export { default as useCreditsSummary } from './hooks/useCreditsSummary';
export type { Transaction } from './services/transactions';
export { default as PaymentsService } from './services/payments';
export * from './lib/eventHelpers';
export { default as transactionsService } from './services/transactions';
export * from './lib/transactionHelpers';
export * from './lib/dashboardHelpers';
import React from 'react'

let currentToken: string | null = null

export function getToken(): string | null {
  return currentToken
}

export function setToken(token: string | null) {
  currentToken = token
}

export const AuthContext = React.createContext<{ token: string | null; setToken: (t: string | null) => void }>({ token: null, setToken: () => {} })

// Removed duplicate AuthProvider and useAuth exports to resolve conflicts
export { ReduxProvider } from './provider';
export * from './store';
export * from './slices/authSlice';
export * from './slices/localeSlice';
export { useTranslation } from './i18n';
import { useTranslation } from './i18n';
export const t = useTranslation().t;
export { AuthProvider } from './hooks/useAuth';
export { useAuth } from './hooks/useAuth';
export * from './types/api';
export * from './types/feature';
export { default as policyService } from './services/policyService';
export { cn } from './utils/cn';
export * from './hooks/useAvailableFeatures';
export { useAvailableFeatures } from './hooks/useAvailableFeatures';

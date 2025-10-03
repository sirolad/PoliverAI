declare module '@poliverai/intl' {
  import React from 'react';

  export interface User {
    id: string;
    email: string;
    name: string;
    tier?: 'free' | 'pro';
    credits?: number;
    subscription_expires?: string;
  }

  export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    isLoading?: boolean;
    isAuthenticated: boolean;
    isPro: boolean;
  }

  export const AuthProvider: React.FC<{ children?: React.ReactNode }>;
  export function useAuth(): AuthContextType;
}

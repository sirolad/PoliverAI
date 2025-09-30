import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setUser as setUserAction, clearUser as clearUserAction } from '../slices/authSlice';

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
  // Backwards-compatible alias expected by some consumers in the repo
  isLoading?: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Resolve API base URL from a variety of environments without referencing
// globals that may be absent in secure runtimes (SES) or other sandboxes.
const resolveApiBaseUrl = (): string | undefined => {
  // Try Vite's import.meta.env when available (compile-time, may be inlined).
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
      // @ts-ignore
      return (import.meta as any).env.VITE_API_BASE_URL;
    }
  } catch (e) {
    // ignore
  }

  // Check for a window-level override (useful in some runtimes / test harnesses)
  if (typeof window !== 'undefined' && (window as any).__env__ && (window as any).__env__.VITE_API_BASE_URL) {
    return (window as any).__env__.VITE_API_BASE_URL;
  }

  // Only access process.env when `process` exists in this environment.
  if (typeof process !== 'undefined' && (process as any).env && (process as any).env.VITE_API_BASE_URL) {
    return (process as any).env.VITE_API_BASE_URL;
  }

  return undefined;
};

const API_BASE_URL = resolveApiBaseUrl();
axios.defaults.baseURL = API_BASE_URL || 'http://localhost:8000';

const TOKEN_KEY = '@poliverai/token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        let token: string | null = null;
        if (Platform.OS === 'web') {
          token = window.localStorage.getItem('token');
        } else {
          token = await AsyncStorage.getItem(TOKEN_KEY);
        }

        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await fetchUser();
        }
      } catch (e) {
        console.warn('auth init error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data);
      dispatch(
        setUserAction({
          id: res.data.id,
          email: res.data.email,
          name: res.data.name,
          tier: res.data.tier ?? null,
          credits: typeof res.data.credits === 'number' ? res.data.credits : null,
          subscription_expires: res.data.subscription_expires ?? null,
        })
      );
    } catch (err) {
      console.warn('fetchUser failed', err);
    }
  };

  const saveToken = async (token: string) => {
    if (Platform.OS === 'web') {
      window.localStorage.setItem('token', token);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const login = async (email: string, password: string) => {
    const resp = await axios.post('/auth/login', { email, password });
    const { token, user: userData } = resp.data;
    await saveToken(token);
    setUser(userData);
    dispatch(
      setUserAction({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        tier: userData.tier ?? null,
        credits: typeof userData.credits === 'number' ? userData.credits : null,
        subscription_expires: userData.subscription_expires ?? null,
      })
    );
  };

  const register = async (name: string, email: string, password: string) => {
    const resp = await axios.post('/auth/register', { name, email, password });
    const { token, user: userData } = resp.data;
    await saveToken(token);
    setUser(userData);
    dispatch(
      setUserAction({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        tier: userData.tier ?? null,
        credits: typeof userData.credits === 'number' ? userData.credits : null,
        subscription_expires: userData.subscription_expires ?? null,
      })
    );
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem('token');
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    dispatch(clearUserAction());
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    isPro: !!user && (user.tier === 'pro' || (user as any).isPro === true),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthProvider;

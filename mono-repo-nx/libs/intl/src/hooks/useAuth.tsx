import React, { useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUser as setUserAction, clearUser as clearUserAction } from '../slices/authSlice';
import type { User } from '../types/user';
import { AuthContext } from '../contexts/auth-context';
import { getApiBaseOrigin } from '../lib/paymentsHelpers';
import { getPlatformStorage, isWebPlatform } from '../lib/platformStorage';

axios.defaults.baseURL = getApiBaseOrigin() || 'https://poliverai.com';

const TOKEN_KEY = '@poliverai/token';
const storage = getPlatformStorage();

function extractTokenFromResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as {
    token?: unknown;
    access_token?: unknown;
  };

  if (typeof candidate.token === 'string' && candidate.token) return candidate.token;
  if (typeof candidate.access_token === 'string' && candidate.access_token) return candidate.access_token;
  return null;
}

function normalizeUserData(data: Record<string, unknown>): User & { isPro?: boolean; is_pro?: boolean; subscription_credits?: number | null } {
  const tierValue = String(data.tier ?? data.plan ?? '').toLowerCase();
  const isProFlag = data.isPro === true || data.is_pro === true;
  const normalizedTier: 'free' | 'pro' | null =
    tierValue === 'pro' || tierValue === 'free' ? (tierValue as 'free' | 'pro') : isProFlag ? 'pro' : null;

  return {
    ...data,
    tier: normalizedTier,
    isPro: isProFlag || normalizedTier === 'pro',
    is_pro: isProFlag || normalizedTier === 'pro',
    credits: typeof data.credits === 'number' ? data.credits : null,
    subscription_credits: typeof data.subscription_credits === 'number' ? data.subscription_credits : null,
    subscription_expires: typeof data.subscription_expires === 'string' ? data.subscription_expires : null,
  } as unknown as User & { isPro?: boolean; is_pro?: boolean; subscription_credits?: number | null };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const persistedUser = useSelector((state: unknown) => (state as { auth?: { user?: User | null } })?.auth?.user ?? null);
  const [user, setUser] = useState<User | null>(persistedUser ?? null);
  const [loading, setLoading] = useState(true);
  const [reportsCount, setReportsCount] = useState<number | undefined>(undefined);
  const dispatch = useDispatch();

  useEffect(() => {
    if (persistedUser) {
      setUser((current) => current ?? persistedUser);
    }
  }, [persistedUser]);

  useEffect(() => {
    (async () => {
      try {
        let token: string | null = null;
        if (isWebPlatform()) {
          token = window.localStorage.getItem('token') || window.localStorage.getItem(TOKEN_KEY);
        } else {
          token = await storage.getItem(TOKEN_KEY);
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
      const normalizedUser = normalizeUserData((res.data ?? {}) as Record<string, unknown>);
      setUser(normalizedUser);
      // Fetch saved reports count for UI gating (Navbar, dashboard, etc.)
      try {
        const rc = await axios.get<{ count: number }>('/api/v1/user-reports/count');
        setReportsCount(rc?.data?.count ?? 0);
      } catch (err) {
        console.debug('fetch reports count failed', err);
        setReportsCount(0);
      }
      dispatch(
        setUserAction({
          id: normalizedUser.id,
          email: normalizedUser.email,
          name: normalizedUser.name,
          tier: normalizedUser.tier ?? null,
          credits: typeof normalizedUser.credits === 'number' ? normalizedUser.credits : null,
          subscription_credits: typeof normalizedUser.subscription_credits === 'number' ? normalizedUser.subscription_credits : null,
          subscription_expires: normalizedUser.subscription_expires ?? null,
          is_pro: normalizedUser.is_pro === true,
        })
      );
    } catch (err) {
      console.warn('fetchUser failed', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await clearStoredToken();
        setUser(null);
        setReportsCount(0);
        dispatch(clearUserAction());
      }
    }
  };

  const refreshReportsCount = async (): Promise<number> => {
    try {
      const rc = await axios.get<{ count: number }>('/api/v1/user-reports/count');
      setReportsCount(rc?.data?.count ?? 0);
      return rc?.data?.count ?? 0;
    } catch (err) {
      console.debug('refreshReportsCount failed', err);
      setReportsCount(0);
      return 0;
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const clearStoredToken = async () => {
    if (isWebPlatform()) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem(TOKEN_KEY);
    } else {
      await storage.removeItem(TOKEN_KEY);
    }
    delete axios.defaults.headers.common['Authorization'];
  };

  const saveToken = async (token: string) => {
    if (isWebPlatform()) {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      await storage.setItem(TOKEN_KEY, token);
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const login = async (email: string, password: string) => {
    const resp = await axios.post('/auth/login', { email, password });
    const token = extractTokenFromResponse(resp.data);
    const userData = resp.data?.user;
    if (!token || !userData) {
      throw new Error('Login response did not include a valid token.');
    }
    const normalizedUser = normalizeUserData((userData ?? {}) as Record<string, unknown>);
    await saveToken(token);
    setUser(normalizedUser);
    dispatch(
      setUserAction({
        id: normalizedUser.id,
        email: normalizedUser.email,
        name: normalizedUser.name,
        tier: normalizedUser.tier ?? null,
        credits: typeof normalizedUser.credits === 'number' ? normalizedUser.credits : null,
        subscription_credits: typeof normalizedUser.subscription_credits === 'number' ? normalizedUser.subscription_credits : null,
        subscription_expires: normalizedUser.subscription_expires ?? null,
        is_pro: normalizedUser.is_pro === true,
      })
    );
  };

  const register = async (name: string, email: string, password: string) => {
    const resp = await axios.post('/auth/register', { name, email, password });
    const token = extractTokenFromResponse(resp.data);
    const userData = resp.data?.user;
    if (!token || !userData) {
      throw new Error('Registration response did not include a valid token.');
    }
    const normalizedUser = normalizeUserData((userData ?? {}) as Record<string, unknown>);
    await saveToken(token);
    setUser(normalizedUser);
    dispatch(
      setUserAction({
        id: normalizedUser.id,
        email: normalizedUser.email,
        name: normalizedUser.name,
        tier: normalizedUser.tier ?? null,
        credits: typeof normalizedUser.credits === 'number' ? normalizedUser.credits : null,
        subscription_credits: typeof normalizedUser.subscription_credits === 'number' ? normalizedUser.subscription_credits : null,
        subscription_expires: normalizedUser.subscription_expires ?? null,
        is_pro: normalizedUser.is_pro === true,
      })
    );
  };

  const logout = async () => {
    await clearStoredToken();
    setUser(null);
    dispatch(clearUserAction());
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    isPro:
      !!user &&
      (
        user.tier === 'pro' ||
        (user as unknown as { isPro?: boolean }).isPro === true ||
        (user as unknown as { is_pro?: boolean }).is_pro === true
      ),
    reportsCount,
    refreshReportsCount,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthProvider;

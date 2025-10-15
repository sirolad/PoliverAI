<<<<<<< HEAD
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import authService from '../services/authService'
import { store } from '@/store/store'
import { clearToken } from '@/store/authSlice'
import type { ApiError } from '../services/api'
import { extractErrorStatus } from '@/lib/errorHelpers'
import { setAuthHeader, clearAuthHeader, applyUserUpdate, isProUser } from '@/lib/authHelpers'
import type { User } from '@/types/api'
import { AuthContext } from './auth-context'
import type { AuthContextType } from './auth-context'
import { resetState as resetPolicyState } from '@/store/policyAnalysisSlice'

// Configure axios defaults (use shared helper so dev uses localhost and prod uses VITE_API_URL)
import { getApiBaseOrigin } from '@/lib/paymentsHelpers'
axios.defaults.baseURL = getApiBaseOrigin() || 'http://localhost:8000'
=======
import React, { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'
import type { ApiError } from '../services/api'
import type { User } from '../types/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  isPro: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
>>>>>>> main

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
<<<<<<< HEAD
  const [reportsCount, setReportsCount] = useState<number | null>(null)

  // Check for existing token on mount
  useEffect(() => {
    const token = authService.getStoredToken()
    if (token) {
      // Ensure axios sends the Authorization header for subsequent requests
      setAuthHeader(token)
=======

  // Check for existing token on mount
  useEffect(() => {
    if (authService.isTokenStored()) {
>>>>>>> main
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

<<<<<<< HEAD
  // Listen for events that should trigger a user refresh (e.g., after payment finalization)
  useEffect(() => {
    const handler = () => {
      refreshUser().catch((e) => console.error('Failed to refresh user from event', e))
    }
    window.addEventListener('payment:refresh-user', handler)
    // Listen for explicit user update payloads (faster UI update when transaction returns user info)
    const userUpdateHandler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent<Record<string, unknown>>)?.detail
        if (detail && typeof detail === 'object') {
          setUser((prev) => applyUserUpdate(prev, detail))
        }
      } catch (err) {
        console.error('Failed to apply user update event', err)
      }
    }
    window.addEventListener('payment:user-update', userUpdateHandler as EventListener)
    return () => {
      window.removeEventListener('payment:refresh-user', handler)
      window.removeEventListener('payment:user-update', userUpdateHandler as EventListener)
    }
  }, [])

=======
>>>>>>> main
  const fetchUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
<<<<<<< HEAD
      // fetch saved reports count for UI gating (Navbar, Dashboard quick action)
      try {
        const rc = await axios.get('/api/v1/user-reports/count')
        setReportsCount(rc?.data?.count ?? 0)
      } catch (err) {
        console.debug('fetch reports count failed', err)
        setReportsCount(0)
      }
    } catch (error) {
      // If the request failed because the token is invalid or forbidden,
      // clear stored credentials. For network errors or other transient
      // failures (which can happen right after returning from an external
      // OAuth/checkout redirect), keep the token so the app can retry and
      // avoid logging the user out unexpectedly.
      console.error('Failed to fetch user:', error)
  const maybeStatus = extractErrorStatus(error)
  if (maybeStatus === 401 || maybeStatus === 403) {
        try { store.dispatch(clearToken()) } catch { /* noop */ }
        clearAuthHeader()
        authService.logout()
      } else {
        // transient error: keep token and allow background retries
        console.debug('Keeping stored token after transient fetch error')
      }
=======
    } catch (error) {
      console.error('Failed to fetch user:', error)
      authService.logout()
>>>>>>> main
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  const refreshUser = async () => {
    try {
      const u = await authService.getCurrentUser()
      setUser(u)
      try {
        const rc = await axios.get('/api/v1/user-reports/count')
        setReportsCount(rc?.data?.count ?? 0)
      } catch (err) {
        console.debug('refresh reports count failed', err)
        setReportsCount(0)
      }
    } catch (err) {
      console.error('Failed to refresh user', err)
    }
  }

  const refreshReportsCount = async (): Promise<number> => {
    try {
      const rc = await axios.get('/api/v1/user-reports/count')
      setReportsCount(rc?.data?.count ?? 0)
      return rc?.data?.count ?? 0
    } catch (err) {
      console.debug('refreshReportsCount failed', err)
      setReportsCount(0)
      return 0
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      // Set the axios Authorization header before fetching the current user
      setAuthHeader(response.access_token)
      setUser(await authService.getCurrentUser())
=======
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      setUser(response.user)
>>>>>>> main
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authService.register({ name, email, password })
<<<<<<< HEAD
      // Ensure header is set before fetching user info
      setAuthHeader(response.access_token)
      setUser(await authService.getCurrentUser())
=======
      setUser(response.user)
>>>>>>> main
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || 'Registration failed')
    }
  }

  const logout = () => {
<<<<<<< HEAD
    try { store.dispatch(clearToken()) } catch { /* noop */ }
    // Clear any in-progress policy analysis state on logout so a new user doesn't see WIP data
    try { store.dispatch(resetPolicyState()) } catch { /* noop */ }
    clearAuthHeader()
=======
>>>>>>> main
    authService.logout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
<<<<<<< HEAD
    refreshUser,
    reportsCount,
    refreshReportsCount,
    loading,
    isAuthenticated: !!user,
    isPro: isProUser(user),
=======
    loading,
    isAuthenticated: !!user,
    isPro: user?.tier === 'pro'
>>>>>>> main
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

<<<<<<< HEAD
// Note: `useAuth` is exported from a separate file to avoid hot-reload warnings
=======
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
>>>>>>> main

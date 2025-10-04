import React, { useState, useEffect } from 'react'
import axios from 'axios'
import authService from '../services/authService'
import type { ApiError } from '../services/api'
import type { User } from '@/types/api'
import { AuthContext } from './auth-context'
import type { AuthContextType } from './auth-context'

// Configure axios defaults (use the same VITE_API_URL as other services)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
axios.defaults.baseURL = API_BASE_URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const token = authService.getStoredToken()
    if (token) {
      // Ensure axios sends the Authorization header for subsequent requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

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
          setUser((prev) => {
            const prevObj = (prev ?? {}) as Record<string, unknown>
            return ({ ...prevObj, ...detail } as unknown as User)
          })
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

  const fetchUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      // If the request failed because the token is invalid or forbidden,
      // clear stored credentials. For network errors or other transient
      // failures (which can happen right after returning from an external
      // OAuth/checkout redirect), keep the token so the app can retry and
      // avoid logging the user out unexpectedly.
      console.error('Failed to fetch user:', error)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maybeStatus = (error as any)?.status || (error as any)?.response?.status
      if (maybeStatus === 401 || maybeStatus === 403) {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        authService.logout()
      } else {
        // transient error: keep token and allow background retries
        console.debug('Keeping stored token after transient fetch error')
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const u = await authService.getCurrentUser()
      setUser(u)
    } catch (err) {
      console.error('Failed to refresh user', err)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      // Set the axios Authorization header before fetching the current user
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`
      setUser(await authService.getCurrentUser())
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authService.register({ name, email, password })
      // Ensure header is set before fetching user info
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`
      setUser(await authService.getCurrentUser())
    } catch (error) {
      const apiError = error as ApiError
      throw new Error(apiError.message || 'Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    authService.logout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    isPro: (() => {
      try {
        if (!user) return false
        if (user.tier === 'pro') {
          // if subscription_expires present, ensure it's still in the future
          if (user.subscription_expires) {
            const exp = new Date(user.subscription_expires)
            return exp > new Date()
          }
          return true
        }
        return false
      } catch {
        return false
      }
    })(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Note: `useAuth` is exported from a separate file to avoid hot-reload warnings

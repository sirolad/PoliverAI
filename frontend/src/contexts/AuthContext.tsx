import React, { useState, useEffect } from 'react'
import axios from 'axios'
import authService from '../services/authService'
import type { ApiError } from '../services/api'
import type { User } from '@/types/api'
import { AuthContext } from './auth-context'
import type { AuthContextType } from './auth-context'

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
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
    return () => window.removeEventListener('payment:refresh-user', handler)
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      authService.logout()
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

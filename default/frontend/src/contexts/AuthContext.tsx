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
    loading,
    isAuthenticated: !!user,
    isPro: user?.tier === 'pro',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Note: `useAuth` is exported from a separate file to avoid hot-reload warnings

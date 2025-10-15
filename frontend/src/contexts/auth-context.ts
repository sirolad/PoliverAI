import { createContext } from 'react'
import type { User } from '@/types/api'

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  isPro: boolean
  reportsCount?: number | null
  refreshReportsCount?: () => Promise<number>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

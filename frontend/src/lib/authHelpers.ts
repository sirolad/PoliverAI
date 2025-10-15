import axios from 'axios'
import type { User } from '@/types/api'

export function setAuthHeader(token?: string | null) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
}

export function clearAuthHeader() {
  delete axios.defaults.headers.common['Authorization']
}

export function applyUserUpdate(prev: User | null, detail: Record<string, unknown>): User {
  const prevObj = (prev ?? {}) as Record<string, unknown>
  return ({ ...prevObj, ...detail } as unknown as User)
}

export function isProUser(user: User | null): boolean {
  try {
    if (!user) return false
    if (user.tier === 'pro') {
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
}

export function getAuthHeader(token?: string | null): Record<string, string> {
  if (token) return { Authorization: `Bearer ${token}` }
  return {}
}

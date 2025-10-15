import apiService, { getToken } from './api'
import type { User, UserLogin, UserCreate, Token } from '@/types/api'
import { store } from '@/store/store'
import { setToken, clearToken } from '@/store/authSlice'

class AuthService {
  async login(credentials: UserLogin): Promise<Token> {
    const response = await apiService.post<Token>('/auth/login', credentials)
    // Persist token via auth slice (store subscription will mirror to localStorage)
    if (response.access_token) {
      try { store.dispatch(setToken(response.access_token)) } catch { /* noop */ }
    }
    return response
  }

  async register(userData: UserCreate): Promise<Token> {
    const response = await apiService.post<Token>('/auth/register', userData)
    if (response.access_token) {
      try { store.dispatch(setToken(response.access_token)) } catch { /* noop */ }
    }
    return response
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me')
  }

  async upgradeToProTier(): Promise<User> {
    return apiService.post<User>('/auth/upgrade')
  }

  logout(): void {
    try { store.dispatch(clearToken()) } catch { /* noop */ }
  }

  getStoredToken(): string | null {
    return getToken()
  }

  isTokenStored(): boolean {
    return !!this.getStoredToken()
  }
}

export const authService = new AuthService()
export default authService

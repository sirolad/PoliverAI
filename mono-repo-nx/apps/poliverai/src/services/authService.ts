import apiService, { getToken } from './api'

// Minimal local types to avoid importing web-specific type definitions
type User = { id?: string; email?: string; is_pro?: boolean; credits?: number; subscription_credits?: number } | null
type UserLogin = { email: string; password: string }
type UserCreate = { email: string; password: string; name?: string }
type Token = { access_token?: string; token?: string }

class AuthService {
  async login(credentials: UserLogin): Promise<Token> {
    const response = await apiService.post<Token>('/auth/login', credentials)
    // Persist token via intl store when available; for now, return token
    return response
  }

  async register(userData: UserCreate): Promise<Token> {
    const response = await apiService.post<Token>('/auth/register', userData)
    return response
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me')
  }

  async upgradeToProTier(): Promise<User> {
    return apiService.post<User>('/auth/upgrade')
  }

  logout(): void {
    // No-op: when intl store is integrated, call the clear token action
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

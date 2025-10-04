import apiService from './api'
import type { User, UserLogin, UserCreate, Token } from '@/types/api'
class AuthService {
  async login(credentials: UserLogin): Promise<Token> {
    const response = await apiService.post<Token>('/auth/login', credentials)
    // Store the token in localStorage for future requests
    if (response.access_token) {
      localStorage.setItem('token', response.access_token)
    }
    return response
  }
  async register(userData: UserCreate): Promise<Token> {
    const response = await apiService.post<Token>('/auth/register', userData)
    // Store the token in localStorage for future requests
    if (response.access_token) {
      localStorage.setItem('token', response.access_token)
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
    localStorage.removeItem('token')
  }
  getStoredToken(): string | null {
    return localStorage.getItem('token')
  }
  isTokenStored(): boolean {
    return !!this.getStoredToken()
  }
}
export const authService = new AuthService()
export default authService

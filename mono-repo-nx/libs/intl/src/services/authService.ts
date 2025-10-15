import apiService from './api';
import type { User, UserLogin, UserCreate, Token } from '../types/api';

class AuthService {
  async login(credentials: UserLogin): Promise<Token> {
    return apiService.post<Token>('/auth/login', credentials);
  }
  async register(userData: UserCreate): Promise<Token> {
    return apiService.post<Token>('/auth/register', userData);
  }
  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me');
  }
  async upgradeToProTier(): Promise<User> {
    return apiService.post<User>('/auth/upgrade', {});
  }
  logout(): void {
    // TODO: Integrate with Nx store
  }
  getStoredToken(): string | null {
    // TODO: Integrate with Nx store
    return null;
  }
  isTokenStored(): boolean {
    return !!this.getStoredToken();
  }
}

const authService = new AuthService();
export default authService;

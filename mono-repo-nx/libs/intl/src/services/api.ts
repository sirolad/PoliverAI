import { extractErrorMessage } from '../lib/errorHelpers';
import { getApiBaseOrigin } from '../lib/paymentsHelpers';
import { getPlatformStorage, isWebPlatform } from '../lib/platformStorage';

const API_BASE_URL = getApiBaseOrigin() ?? '';
const TOKEN_KEY = '@poliverai/token';
const storage = getPlatformStorage();

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

async function getStoredToken(): Promise<string | null> {
  try {
    if (isWebPlatform()) {
      return window.localStorage.getItem('token') || window.localStorage.getItem(TOKEN_KEY);
    }
    return await storage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let details: unknown = null;
      let message = `HTTP error! status: ${response.status}`;

      try {
        const text = await response.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            details = parsed;
            message = extractErrorMessage(parsed) ?? message;
          } catch {
            details = text;
            message = text || message;
          }
        }
      } catch {
        message = response.statusText || message;
      }

      const error: ApiError = {
        message,
        status: response.status,
        details,
      };
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
  }

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(this.baseUrl + url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...headers,
        ...(options?.headers ?? {}),
      },
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await fetch(this.baseUrl + url, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
        ...(options?.headers ?? {}),
      },
      body: isFormData ? (body as BodyInit) : JSON.stringify(body),
      ...options,
    });
    return this.handleResponse<T>(response);
  }
}

const apiService = new ApiService();
export default apiService;

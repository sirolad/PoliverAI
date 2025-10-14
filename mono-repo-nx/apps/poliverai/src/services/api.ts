// RN-friendly lightweight ApiService ported from frontend/src/services/api.ts
import { extractErrorMessage } from '../lib/errorHelpers'

const API_BASE_URL = '' // set via environment or runtime config

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

function getTokenFromStore(): string | null {
  // Placeholder: wiring to auth store / @poliverai/intl will be added later.
  return null
}

class ApiService {
  private baseUrl: string
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }
  private getAuthHeaders(): Record<string, string> {
    const token = getTokenFromStore()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      let errorDetails = null
      try {
        const errorData = await response.json()
        const msg = extractErrorMessage(errorData)
        if (msg) errorMessage = msg
        errorDetails = errorData
      } catch {}
      const error: ApiError = { message: errorMessage, status: response.status, details: errorDetails }
      throw error
    }
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) return response.json()
    return (await response.text()) as unknown as T
  }
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...this.getAuthHeaders(), ...options?.headers },
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...this.getAuthHeaders(), ...options?.headers },
      body: isFormData ? (data as BodyInit) : JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders(), ...options?.headers },
      body: JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders(), ...options?.headers },
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async uploadFile<T>(endpoint: string, file: any, additionalData?: Record<string, string>, onProgress?: (p: number) => void): Promise<T> {
    // RN supports fetch with FormData; progress callbacks may require native modules — keep a simple upload for now.
    const fd = new FormData()
    // file is expected to be an object with uri/name,type in RN
    if (file) {
      fd.append('file', file as any)
    }
    if (additionalData) Object.entries(additionalData).forEach(([k, v]) => fd.append(k, v))
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', headers: { ...this.getAuthHeaders() }, body: fd })
    return this.handleResponse<T>(response)
  }
}

export const apiService = new ApiService()
export default apiService

export function getToken(): string | null {
  return getTokenFromStore()
}

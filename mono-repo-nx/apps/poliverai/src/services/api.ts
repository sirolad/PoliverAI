import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { extractErrorMessage } from '../lib/errorHelpers'
import { getApiBaseOrigin } from '../lib/paymentsHelpers'

const API_BASE_URL = getApiBaseOrigin()
const TOKEN_KEY = '@poliverai/token'

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

async function getTokenFromStore(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem('token') || window.localStorage.getItem(TOKEN_KEY)
    }
    return await AsyncStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

class ApiService {
  private baseUrl: string
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getTokenFromStore()
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
    const authHeaders = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders, ...options?.headers },
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData
    const authHeaders = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...authHeaders, ...options?.headers },
      body: isFormData ? (data as BodyInit) : JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const authHeaders = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders, ...options?.headers },
      body: JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const authHeaders = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders, ...options?.headers },
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
    const authHeaders = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', headers: { ...authHeaders }, body: fd })
    return this.handleResponse<T>(response)
  }
}

export const apiService = new ApiService()
export default apiService

export async function getToken(): Promise<string | null> {
  return getTokenFromStore()
}

import { store } from '@/store/store'
import { extractErrorMessage } from '@/lib/errorHelpers'
import { getApiBaseOrigin } from '@/lib/paymentsHelpers'

// Resolve API base using centralized helper: dev -> http://localhost:8000, otherwise VITE_API_URL or window origin.
const API_BASE_URL = getApiBaseOrigin() ?? ''

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

function getTokenFromStore(): string | null {
  try {
    const s = store.getState()?.auth?.token
    return s || null
  } catch {
    return null
  }
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
        // preserve raw detail when available
        if (typeof errorData === 'object' && errorData !== null && 'detail' in (errorData as Record<string, unknown>)) {
          errorDetails = (errorData as Record<string, unknown>).detail
        } else {
          errorDetails = errorData
        }
      } catch {
        // If we can't parse JSON, use the status text
        errorMessage = response.statusText || errorMessage
      }
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        details: errorDetails,
      }
      throw error
    }
    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    return response.text() as unknown as T
  }
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        // Avoid setting Content-Type on GET requests (no body) because
        // it triggers CORS preflight in browsers. Use Accept instead.
        Accept: 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: isFormData ? (data as BodyInit) : JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      body: JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  // Special method for file uploads with progress tracking
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText) as T
            resolve(result)
          } catch (error) {
            const e = error as unknown
            reject(new Error('Failed to parse response', { cause: e }))
          }
        } else {
          let errorMessage = `HTTP error! status: ${xhr.status}`
          try {
            const errorData = JSON.parse(xhr.responseText)
            const msg = extractErrorMessage(errorData)
            if (msg) errorMessage = msg
          } catch {
            errorMessage = xhr.statusText || errorMessage
          }
          const error: ApiError = {
            message: errorMessage,
            status: xhr.status,
          }
          reject(error)
        }
      })
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'))
      })
      xhr.open('POST', `${this.baseUrl}${endpoint}`)
      // Add auth headers (store-only)
      const token = getTokenFromStore()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      xhr.send(formData)
    })
  }
}
export const apiService = new ApiService()
export default apiService

export function getToken(): string | null {
  return getTokenFromStore()
}

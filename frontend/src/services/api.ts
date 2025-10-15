<<<<<<< HEAD
import { store } from '@/store/store'
import { extractErrorMessage } from '@/lib/errorHelpers'
import { getApiBaseOrigin } from '@/lib/paymentsHelpers'

// Resolve API base using centralized helper: dev -> http://localhost:8000, otherwise VITE_API_URL or window origin.
const API_BASE_URL = getApiBaseOrigin() ?? ''
=======
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
>>>>>>> main

export interface ApiError {
  message: string
  status: number
<<<<<<< HEAD
  details?: unknown
}

function getTokenFromStore(): string | null {
  try {
    const s = store.getState()?.auth?.token
    return s || null
  } catch {
    return null
  }
=======
  details?: any
>>>>>>> main
}

class ApiService {
  private baseUrl: string
<<<<<<< HEAD
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }
  private getAuthHeaders(): Record<string, string> {
    const token = getTokenFromStore()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
=======

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

>>>>>>> main
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      let errorDetails = null
<<<<<<< HEAD
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
=======

      try {
        const errorData = await response.json()
        errorMessage = errorData.detail?.message || errorData.detail || errorData.message || errorMessage
        errorDetails = errorData.detail
>>>>>>> main
      } catch {
        // If we can't parse JSON, use the status text
        errorMessage = response.statusText || errorMessage
      }
<<<<<<< HEAD
      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        details: errorDetails,
      }
      throw error
    }
=======

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        details: errorDetails
      }

      throw error
    }

>>>>>>> main
    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
<<<<<<< HEAD
    return response.text() as unknown as T
  }
=======

    return response.text() as unknown as T
  }

>>>>>>> main
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
<<<<<<< HEAD
        // Avoid setting Content-Type on GET requests (no body) because
        // it triggers CORS preflight in browsers. Use Accept instead.
        Accept: 'application/json',
=======
        'Content-Type': 'application/json',
>>>>>>> main
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    })
<<<<<<< HEAD
    return this.handleResponse<T>(response)
  }
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData
=======

    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData

>>>>>>> main
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
<<<<<<< HEAD
      body: isFormData ? (data as BodyInit) : JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
=======
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
>>>>>>> main
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
<<<<<<< HEAD
      body: JSON.stringify(data as unknown),
      ...options,
    })
    return this.handleResponse<T>(response)
  }
=======
      body: JSON.stringify(data),
      ...options,
    })

    return this.handleResponse<T>(response)
  }

>>>>>>> main
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
<<<<<<< HEAD
    return this.handleResponse<T>(response)
  }
=======

    return this.handleResponse<T>(response)
  }

>>>>>>> main
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
<<<<<<< HEAD
      formData.append('file', file)
=======

      formData.append('file', file)

>>>>>>> main
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }
<<<<<<< HEAD
=======

>>>>>>> main
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })
<<<<<<< HEAD
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText) as T
            resolve(result)
          } catch (error) {
            const e = error as unknown
            reject(new Error('Failed to parse response', { cause: e }))
=======

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } catch (error) {
            reject(new Error('Failed to parse response'))
>>>>>>> main
          }
        } else {
          let errorMessage = `HTTP error! status: ${xhr.status}`
          try {
            const errorData = JSON.parse(xhr.responseText)
<<<<<<< HEAD
            const msg = extractErrorMessage(errorData)
            if (msg) errorMessage = msg
          } catch {
            errorMessage = xhr.statusText || errorMessage
          }
          const error: ApiError = {
            message: errorMessage,
            status: xhr.status,
=======
            errorMessage = errorData.detail?.message || errorData.detail || errorData.message || errorMessage
          } catch {
            errorMessage = xhr.statusText || errorMessage
          }

          const error: ApiError = {
            message: errorMessage,
            status: xhr.status
>>>>>>> main
          }
          reject(error)
        }
      })
<<<<<<< HEAD
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'))
      })
      xhr.open('POST', `${this.baseUrl}${endpoint}`)
      // Add auth headers (store-only)
      const token = getTokenFromStore()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
=======

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'))
      })

      xhr.open('POST', `${this.baseUrl}${endpoint}`)

      // Add auth headers
      const token = localStorage.getItem('token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

>>>>>>> main
      xhr.send(formData)
    })
  }
}
<<<<<<< HEAD
export const apiService = new ApiService()
export default apiService

export function getToken(): string | null {
  return getTokenFromStore()
}
=======

export const apiService = new ApiService()
export default apiService
>>>>>>> main

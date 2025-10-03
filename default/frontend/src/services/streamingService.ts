import type { ComplianceResult } from '@/types/api'

export interface StreamingUpdate {
  status: 'starting' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  result?: ComplianceResult
}
export type StreamingCallback = (update: StreamingUpdate) => void
class StreamingService {
  async streamPolicyAnalysis(
    file: File,
    analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast',
    onUpdate: StreamingCallback
  ): Promise<ComplianceResult> {
    return new Promise((resolve, reject) => {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('analysis_mode', analysisMode)
      // Get API base URL
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const url = `${apiBaseUrl}/api/v1/verify-stream`
      // Create EventSource-like functionality with fetch
      const controller = new AbortController()
      fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        signal: controller.signal,
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body reader available')
        }
        const decoder = new TextDecoder()
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true })
            // Process complete lines
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6)) as StreamingUpdate
                  onUpdate(data)
                  // If completed, resolve with result
                  if (data.status === 'completed' && data.result) {
                    resolve(data.result as ComplianceResult)
                    return
                  }
                  // If error, reject
                  if (data.status === 'error') {
                    reject(new Error(data.message))
                    return
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', line, parseError)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      })
      .catch(error => {
        console.error('Streaming request failed:', error)
        reject(error)
      })
      // Return cleanup function
      return () => {
        controller.abort()
      }
    })
  }
  async streamPolicyAnalysisWithEventSource(
    file: File,
    analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast',
    onUpdate: StreamingCallback
  ): Promise<ComplianceResult> {
    return new Promise((resolve, reject) => {
      // For EventSource, we need a different approach since it only supports GET requests
      // We'll use the fetch-based streaming approach above
      this.streamPolicyAnalysis(file, analysisMode, onUpdate)
        .then(resolve)
        .catch(reject)
    })
  }
}
export const streamingService = new StreamingService()
export default streamingService

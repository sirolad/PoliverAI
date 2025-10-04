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
  // Ask the server to ingest the uploaded file into the RAG store
  // and to generate a PDF report after analysis. These flags cause
  // the backend streaming endpoint to run ingestion and report creation
  // and emit corresponding events.
  formData.append('ingest', 'true')
  formData.append('generate_report', 'true')
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
                  // Backend emits JSON with shape: { event: string, data: any }
                  const raw = JSON.parse(line.substring(6)) as { event?: string; data?: unknown }
                  if (raw && raw.event) {
                    const ev = raw.event
                    const payload = (raw.data || {}) as Record<string, unknown>
                    // Map server events to client StreamingUpdate
                    if (ev === 'started') {
                      onUpdate({ status: 'starting', progress: 0, message: 'started' })
                    } else if (ev === 'rule_based' || ev === 'progress') {
                      const processed = typeof payload['processed'] === 'number' ? (payload['processed'] as number) : undefined
                      const total = typeof payload['total'] === 'number' ? (payload['total'] as number) : undefined
                      const progress = processed !== undefined && total !== undefined
                        ? Math.round((processed / Math.max(1, total)) * 100)
                        : (typeof payload['progress'] === 'number' ? (payload['progress'] as number) : 0)
                      onUpdate({ status: 'processing', progress, message: (payload['message'] as string) || '' })
                    } else if (ev === 'completed') {
                      // Completed carries the final result in data
                      const result = payload as unknown as ComplianceResult
                      onUpdate({ status: 'completed', progress: 100, message: 'completed', result })
                      resolve(result)
                      return
                    } else if (ev === 'error') {
                      const msg = typeof payload['message'] === 'string' ? (payload['message'] as string) : 'Unknown error'
                      onUpdate({ status: 'error', progress: 0, message: msg })
                      reject(new Error(msg))
                      return
                    } else {
                      // Unknown event, surface as processing update
                      const p = typeof payload['progress'] === 'number' ? (payload['progress'] as number) : 0
                      const m = typeof payload['message'] === 'string' ? (payload['message'] as string) : ''
                      onUpdate({ status: 'processing', progress: p, message: m })
                    }
                  } else {
                    // Fallback: try to parse as legacy StreamingUpdate
                    const data = JSON.parse(line.substring(6)) as StreamingUpdate
                    onUpdate(data)
                    if (data.status === 'completed' && data.result) {
                      resolve(data.result as ComplianceResult)
                      return
                    }
                    if (data.status === 'error') {
                      reject(new Error(data.message))
                      return
                    }
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

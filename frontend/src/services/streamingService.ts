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
          // Keep track of the latest analysis result emitted by the server.
          // The server may emit additional events after 'completed' (ingest/report/transaction),
          // so we should not resolve immediately when we see 'completed'. Instead, record the
          // result and keep listening for report/ingest events. When a report is generated we
          // dispatch an explicit DOM event so the app can act (download/open the report).
          let latestResult: ComplianceResult | null = null
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
                      // Completed carries the final result in data; record it but keep listening
                      const result = payload as unknown as ComplianceResult
                      latestResult = result
                      onUpdate({ status: 'completed', progress: 100, message: 'completed', result })
                      // Notify app to refresh user/transactions (but don't resolve yet)
                      try {
                        if (typeof window !== 'undefined' && window.dispatchEvent) {
                          window.dispatchEvent(new CustomEvent('payment:refresh-user'))
                          window.dispatchEvent(new CustomEvent('transactions:refresh'))
                        }
                      } catch (e) {
                        console.warn('Failed to dispatch refresh events from streamingService', e)
                      }
                    } else if (ev === 'report_completed') {
                      // Server generated a report; payload should include a path
                      const reportPath = (payload['path'] as string) || (payload['filename'] as string) || null
                      try {
                        if (typeof window !== 'undefined' && window.dispatchEvent) {
                          window.dispatchEvent(new CustomEvent('report:generated', { detail: { path: reportPath } }))
                        }
                      } catch (e) {
                        console.warn('Failed to dispatch report:generated event', e)
                      }
                      // Resolve if we have the analysis result available
                      if (latestResult) {
                        resolve(latestResult)
                        return
                      }
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
                    // Special: transaction event (backend recorded a tx)
                    if (ev === 'transaction') {
                      try {
                        if (typeof window !== 'undefined' && window.dispatchEvent) {
                          window.dispatchEvent(new CustomEvent('transactions:refresh'))
                          window.dispatchEvent(new CustomEvent('payment:refresh-user'))
                        }
                      } catch (e) {
                        console.warn('Failed to dispatch transaction refresh event', e)
                      }
                    }
                  } else {
                    // Fallback: try to parse as legacy StreamingUpdate
                    const data = JSON.parse(line.substring(6)) as StreamingUpdate
                    onUpdate(data)
                    if (data.status === 'completed' && data.result) {
                      latestResult = data.result as ComplianceResult
                      // keep listening in case the server emits additional events (report/ingest)
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

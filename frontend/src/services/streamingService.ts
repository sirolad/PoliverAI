<<<<<<< HEAD
import type { ComplianceResult } from '@/types/api'
import { getToken } from './api'
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
import { buildApiUrl } from '@/lib/fileHelpers'
import { getAuthHeader } from '@/lib/authHelpers'

=======
>>>>>>> main
export interface StreamingUpdate {
  status: 'starting' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
<<<<<<< HEAD
  result?: ComplianceResult
}
export type StreamingCallback = (update: StreamingUpdate) => void
=======
  result?: any
}

export type StreamingCallback = (update: StreamingUpdate) => void

>>>>>>> main
class StreamingService {
  async streamPolicyAnalysis(
    file: File,
    analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast',
    onUpdate: StreamingCallback
<<<<<<< HEAD
  ): Promise<ComplianceResult> {
    return new Promise((resolve, reject) => {
      // Create FormData for file upload
      const formData = new FormData()
  formData.append('file', file)
  formData.append('analysis_mode', analysisMode)
  // By default do not request ingest or generate_report for quick analyses.
  // Ingest/report generation can be triggered separately when the user
  // explicitly requests a Full Report.
  const url = buildApiUrl('/api/v1/verify-stream')
      // Create EventSource-like functionality with fetch
      const controller = new AbortController()
  const token = getToken()
  const headers = getAuthHeader(token)
  fetch(url, {
        method: 'POST',
        body: formData,
        headers,
=======
  ): Promise<any> {
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
>>>>>>> main
        signal: controller.signal,
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
<<<<<<< HEAD
=======

>>>>>>> main
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body reader available')
        }
<<<<<<< HEAD
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
                      // Completed carries the final result in data; resolve now so quick analyses
                      // return to the caller (free analysis should not wait for a report).
                      const result = payload as unknown as ComplianceResult
                      latestResult = result
                      onUpdate({ status: 'completed', progress: 100, message: 'completed', result })
                      // Notify app to refresh user/transactions
                      try {
                        safeDispatchMultiple([{ name: 'payment:refresh-user' }, { name: 'transactions:refresh' }])
                      } catch (e) {
                        console.warn('Failed to dispatch refresh events from streamingService', e)
                      }
                      // Resolve the promise for quick analyses immediately
                      resolve(latestResult)
                      return
                    } else if (ev === 'report_completed') {
                      // Server generated a report; payload should include a path
                      const reportPath = (payload['path'] as string) || (payload['filename'] as string) || null
                      try {
                        safeDispatch('report:generated', { path: reportPath })
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
                        safeDispatchMultiple([{ name: 'transactions:refresh' }, { name: 'payment:refresh-user' }])
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
=======

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
                    resolve(data.result)
                    return
                  }

                  // If error, reject
                  if (data.status === 'error') {
                    reject(new Error(data.message))
                    return
>>>>>>> main
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
<<<<<<< HEAD
=======

>>>>>>> main
      // Return cleanup function
      return () => {
        controller.abort()
      }
    })
  }
<<<<<<< HEAD
=======

>>>>>>> main
  async streamPolicyAnalysisWithEventSource(
    file: File,
    analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast',
    onUpdate: StreamingCallback
<<<<<<< HEAD
  ): Promise<ComplianceResult> {
=======
  ): Promise<any> {
>>>>>>> main
    return new Promise((resolve, reject) => {
      // For EventSource, we need a different approach since it only supports GET requests
      // We'll use the fetch-based streaming approach above
      this.streamPolicyAnalysis(file, analysisMode, onUpdate)
        .then(resolve)
        .catch(reject)
    })
  }
}
<<<<<<< HEAD
=======

>>>>>>> main
export const streamingService = new StreamingService()
export default streamingService

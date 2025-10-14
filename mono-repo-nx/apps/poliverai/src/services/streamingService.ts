import type { ComplianceResult } from '../types/api'
import type { UploadFile } from './policyService'

export interface StreamingUpdate {
  status: 'starting' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  result?: ComplianceResult
}
export type StreamingCallback = (update: StreamingUpdate) => void

class StreamingService {
  async streamPolicyAnalysis(file: UploadFile, analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast', onUpdate?: StreamingCallback): Promise<ComplianceResult> {
    // Basic fallback for RN: perform a single POST and return the JSON result.
    const url = `/api/v1/verify`
    const fd = new FormData()
    // RN file objects are appended as-is; cast to unknown then FormDataEntryValue to satisfy TS
    fd.append('file', file as unknown as FormDataEntryValue)
    fd.append('analysis_mode', analysisMode)
    const resp = await fetch(url, { method: 'POST', body: fd })
    if (!resp.ok) throw new Error(`Streaming analyze failed: ${resp.status}`)
    const data = await resp.json()
    if (onUpdate) onUpdate({ status: 'completed', progress: 100, message: 'completed', result: data })
    return data as ComplianceResult
  }
}

export const streamingService = new StreamingService()
export default streamingService

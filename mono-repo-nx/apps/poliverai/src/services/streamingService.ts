import type { ComplianceResult } from '../types/api'
import type { UploadFile } from './policyService'
import apiService from './api'

export interface StreamingUpdate {
  status: 'starting' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  result?: ComplianceResult
}
export type StreamingCallback = (update: StreamingUpdate) => void

class StreamingService {
  async streamPolicyAnalysis(file: UploadFile, analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast', onUpdate?: StreamingCallback): Promise<ComplianceResult> {
    onUpdate?.({ status: 'starting', progress: 5, message: 'Uploading policy...' })
    onUpdate?.({ status: 'processing', progress: 20, message: 'Analyzing policy...' })

    const data = await apiService.uploadFile<ComplianceResult>(
      '/api/v1/verify',
      file as unknown as FormDataEntryValue,
      { analysis_mode: analysisMode }
    )

    onUpdate?.({ status: 'completed', progress: 100, message: 'Completed', result: data })
    return data
  }
}

export const streamingService = new StreamingService()
export default streamingService

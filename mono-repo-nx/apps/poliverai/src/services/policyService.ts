import apiService from './api'
import streamingService from './streamingService'
import type { ComplianceResult } from '../types/api'
import { getReportDownloadUrl } from '../lib/policyHelpers'

export type AnalysisMode = 'fast' | 'balanced' | 'detailed'

// RN upload file shape (uri based)
export type UploadFile = { uri: string; name?: string; type?: string }

export type ReportDetail = {
  filename: string
  content?: string
  score?: number
  verdict?: string
  findings?: Array<Record<string, unknown>>
  recommendations?: Array<Record<string, unknown>>
  evidence?: Array<Record<string, unknown>>
  metrics?: Record<string, unknown>
  document_name?: string
  gcs_url?: string
  is_full_report?: boolean
  type?: string
  file_size?: number
  created_at?: string | null
}

class PolicyService {
  async analyzePolicy(file: UploadFile, analysisMode: AnalysisMode = 'fast', onProgress?: (progress: number) => void): Promise<ComplianceResult> {
    const additionalData = { analysis_mode: analysisMode }
    return apiService.uploadFile<ComplianceResult>('/api/v1/verify', file, additionalData, onProgress)
  }

  async analyzePolicyStreaming(file: UploadFile, analysisMode: AnalysisMode = 'fast', onProgress?: (p: number, m?: string) => void): Promise<ComplianceResult> {
    if (streamingService && typeof streamingService.streamPolicyAnalysis === 'function') {
      return streamingService.streamPolicyAnalysis(file, analysisMode, (update) => {
        if (onProgress) onProgress(update.progress, update.message)
      })
    }
    const additionalData = { analysis_mode: analysisMode }
    return apiService.uploadFile<ComplianceResult>('/api/v1/verify', file, additionalData, undefined)
  }

  async generateVerificationReport(result: ComplianceResult, fileName: string, analysisMode: AnalysisMode) {
    const reportRequest = {
      verdict: result.verdict,
      score: result.score,
      confidence: result.confidence,
      findings: result.findings,
      recommendations: result.recommendations,
      evidence: result.evidence,
      metrics: result.metrics,
      analysis_mode: analysisMode,
      document_name: fileName,
    }
    return apiService.post<{ filename: string; download_url: string }>('/api/v1/verification-report', reportRequest)
  }

  async generatePolicyRevision(original: string, findings: Array<Record<string, unknown>>, recommendations: Array<Record<string, unknown>>, evidence: Array<Record<string, unknown>>, documentName?: string, revisionMode: 'comprehensive' | 'minimal' | 'targeted' = 'comprehensive', instructions?: string) {
    const payload = { original_document: original, findings, recommendations, evidence, document_name: documentName, revision_mode: revisionMode, instructions: instructions || undefined }
    return apiService.post<{ filename: string; download_url: string }>('/api/v1/generate-revision', payload)
  }

  async downloadReport(filename: string): Promise<void> {
    const url = getReportDownloadUrl(filename)
    console.warn('downloadReport: implement RN download for', url)
    throw new Error('downloadReport not implemented for RN')
  }

  async getDetailedReport(filename: string): Promise<ReportDetail> {
    const url = `/api/v1/reports/detailed/${encodeURIComponent(filename)}`
    return apiService.get<ReportDetail>(url)
  }

  async saveReport(filename: string, documentName?: string, options?: { is_quick?: boolean; save_type?: 'regular' | 'html'; image_base64?: string }) {
    const payload: Record<string, unknown> = { filename, document_name: documentName }
    if (options?.is_quick) payload.is_quick = true
    if (options?.save_type) payload.save_type = options.save_type
    if (options?.image_base64) payload.image_base64 = options.image_base64
    return apiService.post<{ filename: string; download_url: string }>('/api/v1/reports/save', payload)
  }

  async saveReportInline(content: string, filename?: string, documentName?: string, options?: { is_quick?: boolean; save_type?: 'regular' | 'html'; image_base64?: string }) {
    const finalContent = options?.save_type === 'regular' ? `${content}` : content
    const payload: Record<string, unknown> = { content: finalContent }
    if (filename) payload.filename = filename
    if (documentName) payload.document_name = documentName
    if (options?.is_quick) payload.is_quick = true
    if (options?.save_type) payload.save_type = options.save_type
    if (options?.image_base64) payload.image_base64 = options.image_base64
    return apiService.post<{ filename: string; download_url: string }>('/api/v1/reports/save', payload)
  }

  transformResultForUI(result: ComplianceResult, filename: string, analysisMode: AnalysisMode) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      filename,
      analysisType: analysisMode === 'fast' ? 'basic' : 'ai',
      timestamp: new Date(),
      reportUrl: analysisMode !== 'fast' ? '/api/v1/reports/detailed' : undefined,
      verdict: result.verdict,
      score: result.score,
  confidence: result.confidence,
  evidence: result.evidence,
  summary: result.summary,
      metrics: result.metrics,
      recommendations: result.recommendations,
      violations: (result.findings || []).map((finding) => ({
        category: finding.article,
        severity: finding.severity,
        description: finding.issue,
        recommendation: `Article ${finding.article}: Consider addressing this compliance issue`,
        confidence: finding.confidence,
      })),
    }
  }

  getAnalysisModeFromType(analysisType: 'basic' | 'ai'): AnalysisMode {
    return analysisType === 'basic' ? 'fast' : 'balanced'
  }

  async getUserReports(opts?: { page?: number; limit?: number; date_from?: string | null; date_to?: string | null }) {
    let url = '/api/v1/user-reports'
    const qs: string[] = []
    if (opts?.page && opts?.limit) qs.push(`page=${opts.page}`, `limit=${opts.limit}`)
    if (opts?.date_from) qs.push(`date_from=${encodeURIComponent(opts.date_from)}`)
    if (opts?.date_to) qs.push(`date_to=${encodeURIComponent(opts.date_to)}`)
    if (qs.length) url += `?${qs.join('&')}`
    return apiService.get(url)
  }

  async getReportVerdicts() {
    return apiService.get<{ verdicts: string[] }>('/api/v1/reports/verdicts')
  }

  async getUserReportsCount(opts?: { date_from?: string | null; date_to?: string | null; analysis_mode?: string | null }) {
    try {
      let url = '/api/v1/user-reports/count'
      const qs: string[] = []
      if (opts?.date_from) qs.push(`date_from=${encodeURIComponent(opts.date_from)}`)
      if (opts?.date_to) qs.push(`date_to=${encodeURIComponent(opts.date_to)}`)
      if (opts?.analysis_mode) qs.push(`analysis_mode=${encodeURIComponent(opts.analysis_mode)}`)
      if (qs.length) url += `?${qs.join('&')}`
      const resp = await apiService.get<{ count: number }>(url)
      return resp?.count ?? 0
    } catch (e) {
      console.warn('getUserReportsCount failed', e)
      return 0
    }
  }

  async openReport(report: ReportDetail): Promise<void> {
    try {
      // Prefer GCS http(s) direct links or fallback to download endpoint
      if (report.gcs_url && typeof report.gcs_url === 'string' && (report.gcs_url.startsWith('http://') || report.gcs_url.startsWith('https://'))) {
        // TODO: use Linking.openURL in RN UI layer
        return
      }
      const downloadUrl = getReportDownloadUrl(report.filename)
      void downloadUrl
    } catch (e) {
      console.error('Failed to open report', e)
      throw e
    }
  }

  async deleteReport(filename: string) {
    try {
      return apiService.delete(`/api/v1/reports/${encodeURIComponent(filename)}`)
    } catch (e) {
      console.warn('deleteReport failed', e)
      throw e
    }
  }

  async bulkDeleteReports(filenames: string[]) {
    try {
      return apiService.post('/api/v1/reports/bulk-delete', { filenames })
    } catch (e) {
      console.warn('bulkDeleteReports failed', e)
      throw e
    }
  }
}

export const policyService = new PolicyService()
export default policyService

import apiService, { getToken } from './api'
import streamingService from './streamingService'
import type { ComplianceResult, AnalysisResultForUI } from '@/types/api'
import { downloadFileFromApi, buildApiUrl } from '@/lib/fileHelpers'
export type AnalysisMode = 'fast' | 'balanced' | 'detailed'

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
  async analyzePolicy(
    file: File,
    analysisMode: AnalysisMode = 'fast',
    onProgress?: (progress: number) => void
  ): Promise<ComplianceResult> {
    const additionalData = {
      analysis_mode: analysisMode
    }
    return apiService.uploadFile<ComplianceResult>(
      '/api/v1/verify',
      file,
      additionalData,
      onProgress
    )
  }
  async analyzePolicyStreaming(
    file: File,
    analysisMode: AnalysisMode = 'fast',
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ComplianceResult> {
    return streamingService.streamPolicyAnalysis(
      file,
      analysisMode,
      (update) => {
        if (onProgress) {
          onProgress(update.progress, update.message)
        }
      }
    )
  }
  async generateVerificationReport(
    result: ComplianceResult,
    fileName: string,
    analysisMode: AnalysisMode
  ): Promise<{ filename: string; download_url: string }> {
    const reportRequest = {
      verdict: result.verdict,
      score: result.score,
      confidence: result.confidence,
      findings: result.findings,
      recommendations: result.recommendations,
      evidence: result.evidence,
      metrics: result.metrics,
      analysis_mode: analysisMode,
      document_name: fileName
    }
    return apiService.post<{ filename: string; download_url: string }>(
      '/api/v1/verification-report',
      reportRequest
    )
  }
  async generatePolicyRevision(
    original: string,
  findings: Array<Record<string, unknown>>,
  recommendations: Array<Record<string, unknown>>,
  evidence: Array<Record<string, unknown>>,
    documentName?: string,
    revisionMode: 'comprehensive' | 'minimal' | 'targeted' = 'comprehensive',
    instructions?: string
  ): Promise<{ filename: string; download_url: string }> {
    const payload = {
      original_document: original,
      findings,
      recommendations,
      evidence,
      document_name: documentName,
      revision_mode: revisionMode,
      instructions: instructions || undefined,
    }
    return apiService.post<{ filename: string; download_url: string }>('/api/v1/generate-revision', payload)
  }
  async downloadReport(filename: string): Promise<void> {
    try {
      const token = getToken()
      await downloadFileFromApi(`/api/v1/reports/download/${encodeURIComponent(filename)}`, filename, token)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }

  async getDetailedReport(filename: string): Promise<ReportDetail> {
    type ReportDetail = {
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
    const url = `/api/v1/reports/detailed/${encodeURIComponent(filename)}`
    return apiService.get<ReportDetail>(url)
  }
  
  async saveReport(
    filename: string,
    documentName?: string,
    options?: { is_quick?: boolean; save_type?: 'markdown' | 'prettify'; image_base64?: string }
  ): Promise<{ filename: string; download_url: string }> {
    try {
  const payload: Record<string, unknown> = { filename, document_name: documentName }
  if (options?.is_quick) payload.is_quick = true
  if (options?.save_type) payload.save_type = options.save_type
  if (options?.image_base64) payload.image_base64 = options.image_base64
      return apiService.post<{ filename: string; download_url: string }>('/api/v1/reports/save', payload)
    } catch (e) {
      console.warn('saveReport failed', e)
      throw e
    }
  }

  // Persist inline content on the server and register the saved report.
  async saveReportInline(
    content: string,
    filename?: string,
    documentName?: string,
    options?: { is_quick?: boolean; save_type?: 'markdown' | 'prettify'; image_base64?: string }
  ): Promise<{ filename: string; download_url: string }> {
    try {
      // If the client asked to save as rendered markdown, append the
      // Poliver AI Logo markdown snippet to the end of the content so the
      // exported PDF includes the logo. Keep content unchanged for other
      // save types (e.g. 'prettify').
      const LOGO_MD = '![Poliver AI Logo](https://poliverai.com/poliverai-logo.svg "Poliver AI Logo"){height=80 align=center}'
      const finalContent = (options?.save_type === 'markdown') ? `${content}\n\n${LOGO_MD}` : content
      const payload: Record<string, unknown> = { content: finalContent }
      if (filename) payload.filename = filename
      if (documentName) payload.document_name = documentName
  if (options?.is_quick) payload.is_quick = true
  if (options?.save_type) payload.save_type = options.save_type
  if (options?.image_base64) payload.image_base64 = options.image_base64
      return apiService.post<{ filename: string; download_url: string }>('/api/v1/reports/save', payload)
    } catch (e) {
      console.warn('saveReportInline failed', e)
      throw e
    }
  }
  
  // Convert backend response to frontend UI format
  transformResultForUI(
    result: ComplianceResult,
    filename: string,
    analysisMode: AnalysisMode
  ): AnalysisResultForUI {
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
      violations: result.findings.map(finding => ({
        category: finding.article,
        severity: finding.severity,
        description: finding.issue,
        recommendation: `Article ${finding.article}: Consider addressing this compliance issue`,
        confidence: finding.confidence
      }))
    }
  }
  // Map frontend analysis type to backend mode
  getAnalysisModeFromType(analysisType: 'basic' | 'ai'): AnalysisMode {
    return analysisType === 'basic' ? 'fast' : 'balanced'
  }
  // List user reports from backend
  async getUserReports(opts?: { page?: number; limit?: number; date_from?: string | null; date_to?: string | null }): Promise<{
    reports?: import('@/types/api').ReportMetadata[]
    total?: number
    total_pages?: number
    page?: number
    limit?: number
  }> {
    // Backend route is mounted at /api/v1 and defines GET /user-reports
    let url = '/api/v1/user-reports'
    const qs: string[] = []
    if (opts?.page && opts?.limit) qs.push(`page=${opts.page}`, `limit=${opts.limit}`)
    if (opts?.date_from) qs.push(`date_from=${encodeURIComponent(opts.date_from)}`)
    if (opts?.date_to) qs.push(`date_to=${encodeURIComponent(opts.date_to)}`)
    if (qs.length) url += `?${qs.join('&')}`
    return apiService.get<{
      reports?: import('@/types/api').ReportMetadata[]
      total?: number
      total_pages?: number
      page?: number
      limit?: number
    }>(url)
  }

  async getReportVerdicts(): Promise<{ verdicts: string[] }> {
    return apiService.get<{ verdicts: string[] }>('/api/v1/reports/verdicts')
  }

  // Optionally accept filters (date range, analysis_mode) to let the backend return a filtered count
  async getUserReportsCount(opts?: { date_from?: string | null; date_to?: string | null; analysis_mode?: string | null }): Promise<number> {
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

  // Open report in new tab: prefer GCS signed URL if available, otherwise hit download endpoint
  async openReport(report: import('@/types/api').ReportMetadata): Promise<void> {
    try {
      if (report.gcs_url) {
        // If the backend stored a gs:// URL (deep link) the browser cannot
        // open it directly. Prefer opening the app download endpoint which
        // will stream the file (and handle auth/signed URLs).
        if (typeof report.gcs_url === 'string' && report.gcs_url.startsWith('gs://')) {
          const downloadUrl = buildApiUrl(`/api/v1/reports/download/${encodeURIComponent(report.filename)}`)
          window.open(downloadUrl, '_blank')
          return
        }
        // If it's an http(s) URL, open directly
        if (typeof report.gcs_url === 'string' && (report.gcs_url.startsWith('http://') || report.gcs_url.startsWith('https://'))) {
          window.open(report.gcs_url, '_blank')
          return
        }
        // Unknown scheme: fall back to download endpoint
        const downloadUrl = buildApiUrl(`/api/v1/reports/download/${encodeURIComponent(report.filename)}`)
        window.open(downloadUrl, '_blank')
        return
      }
      // fallback to download endpoint
      const downloadUrl = buildApiUrl(`/api/v1/reports/download/${encodeURIComponent(report.filename)}`)
      window.open(downloadUrl, '_blank')
    } catch (e) {
      console.error('Failed to open report', e)
      throw e
    }
  }

  async deleteReport(filename: string): Promise<{ deleted: boolean; deleted_from_gcs?: boolean }> {
    try {
      return apiService.delete<{ deleted: boolean; deleted_from_gcs?: boolean }>(`/api/v1/reports/${encodeURIComponent(filename)}`)
    } catch (e) {
      console.warn('deleteReport failed', e)
      throw e
    }
  }

  async bulkDeleteReports(filenames: string[]): Promise<{ results: Array<{ filename: string; deleted: boolean; deleted_from_gcs?: boolean; reason?: string }> }> {
    try {
      return apiService.post<{ results: Array<{ filename: string; deleted: boolean; deleted_from_gcs?: boolean; reason?: string }> }>('/api/v1/reports/bulk-delete', { filenames })
    } catch (e) {
      console.warn('bulkDeleteReports failed', e)
      throw e
    }
  }
}
export const policyService = new PolicyService()
export default policyService

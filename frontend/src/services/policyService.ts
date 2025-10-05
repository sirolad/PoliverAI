import apiService from './api'
import streamingService from './streamingService'
import type { ComplianceResult, AnalysisResultForUI } from '@/types/api'
export type AnalysisMode = 'fast' | 'balanced' | 'detailed'
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
    findings: Array<Record<string, any>>,
    recommendations: Array<Record<string, any>>,
    evidence: Array<Record<string, any>>,
    documentName?: string,
    revisionMode: 'comprehensive' | 'minimal' | 'targeted' = 'comprehensive'
  ): Promise<{ filename: string; download_url: string }> {
    const payload = {
      original_document: original,
      findings,
      recommendations,
      evidence,
      document_name: documentName,
      revision_mode: revisionMode,
    }
    return apiService.post<{ filename: string; download_url: string }>('/api/v1/generate-revision', payload)
  }
  async downloadReport(filename: string): Promise<void> {
    const downloadUrl = `/api/v1/reports/download/${encodeURIComponent(filename)}`
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${downloadUrl}`, {
        method: 'GET',
        headers
      })
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`)
      }
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }
  
  async saveReport(
    filename: string,
    documentName?: string,
    options?: { is_quick?: boolean }
  ): Promise<{ filename: string; download_url: string }> {
    try {
  const payload: Record<string, unknown> = { filename, document_name: documentName }
      if (options?.is_quick) payload.is_quick = true
      return apiService.post<{ filename: string; download_url: string }>('/api/v1/reports/save', payload)
    } catch (e) {
      console.warn('saveReport failed', e)
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
          const downloadUrl = `/api/v1/reports/download/${encodeURIComponent(report.filename)}`
          const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${downloadUrl}`
          window.open(url, '_blank')
          return
        }
        // If it's an http(s) URL, open directly
        if (typeof report.gcs_url === 'string' && (report.gcs_url.startsWith('http://') || report.gcs_url.startsWith('https://'))) {
          window.open(report.gcs_url, '_blank')
          return
        }
        // Unknown scheme: fall back to download endpoint
        const downloadUrl = `/api/v1/reports/download/${encodeURIComponent(report.filename)}`
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${downloadUrl}`
        window.open(url, '_blank')
        return
      }
      // fallback to download endpoint
      const downloadUrl = `/api/v1/reports/download/${encodeURIComponent(report.filename)}`
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${downloadUrl}`
      window.open(url, '_blank')
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

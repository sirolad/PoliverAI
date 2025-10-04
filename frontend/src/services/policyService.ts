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
  
  async saveReport(filename: string, documentName?: string): Promise<{ filename: string; download_url: string }> {
    try {
      return apiService.post<{ filename: string; download_url: string }>('/api/v1/reports/save', { filename, document_name: documentName })
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
  async getUserReports(): Promise<import('@/types/api').ReportMetadata[]> {
    // Backend route is mounted at /api/v1 and defines GET /user-reports
    return apiService.get<import('@/types/api').ReportMetadata[]>('/api/v1/user-reports')
  }

  async getUserReportsCount(): Promise<number> {
    try {
      const resp = await apiService.get<{ count: number }>('/api/v1/user-reports/count')
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
        window.open(report.gcs_url, '_blank')
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
}
export const policyService = new PolicyService()
export default policyService

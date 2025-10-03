import apiService from './api'
import streamingService, { type StreamingCallback } from './streamingService'
import type { ComplianceResult, AnalysisResultForUI } from '../types/api'

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

  // Mock method for listing user reports - would be replaced with real API endpoint
  async getUserReports(): Promise<any[]> {
    // This would be a real API call in production:
    // return apiService.get<ReportMetadata[]>('/api/v1/user-reports')

    // For now, return mock data
    await new Promise(resolve => setTimeout(resolve, 1000))

    return [
      {
        filename: 'gdpr-verification-20241228-143025.pdf',
        title: 'GDPR Compliance Verification Report',
        type: 'verification',
        created_at: new Date('2024-12-28T14:30:25Z').toISOString(),
        file_size: 2456789,
        document_name: 'Privacy Policy v2.1',
        analysis_mode: 'balanced'
      },
      {
        filename: 'gdpr-verification-20241227-091234.pdf',
        title: 'GDPR Compliance Verification Report',
        type: 'verification',
        created_at: new Date('2024-12-27T09:12:34Z').toISOString(),
        file_size: 1987654,
        document_name: 'Terms of Service',
        analysis_mode: 'detailed'
      },
      {
        filename: 'revised-privacy-policy-20241226-165543.txt',
        title: 'Revised Privacy Policy',
        type: 'revision',
        created_at: new Date('2024-12-26T16:55:43Z').toISOString(),
        file_size: 45623,
        document_name: 'Privacy Policy v2.0'
      }
    ]
  }
}

export const policyService = new PolicyService()
export default policyService

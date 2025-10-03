import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  FileCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import policyService from '../services/policyService'

interface ReportMetadata {
  filename: string
  title: string
  type: 'verification' | 'revision'
  created_at: string
  file_size: number
  document_name?: string
  analysis_mode?: string
}

export default function Reports() {
  const { isAuthenticated, isPro, loading } = useAuth()
  const navigate = useNavigate()

  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isPro) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userReports = await policyService.getUserReports()
      setReports(userReports)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError('Failed to load reports. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (filename: string) => {
    setDownloadingReport(filename)
    try {
      await policyService.downloadReport(filename)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download report. Please try again.')
    } finally {
      setDownloadingReport(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
    return Math.round(bytes / (1024 * 1024)) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <FileCheck className="h-6 w-6 text-blue-600" />
      case 'revision':
        return <FileText className="h-6 w-6 text-green-600" />
      default:
        return <FileText className="h-6 w-6 text-gray-600" />
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'verification':
        return 'Compliance Report'
      case 'revision':
        return 'Policy Revision'
      default:
        return 'Report'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Reports
              </h1>
              <p className="text-gray-600">
                Access and download your generated compliance reports and policy revisions
              </p>
            </div>

            <Button
              onClick={fetchReports}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Reports List */}
        {!isLoading && reports.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reports Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't generated any reports yet. Start by analyzing a privacy policy.
              </p>
              <Button
                onClick={() => navigate('/analyze')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Analyze New Policy
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.filename} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getReportIcon(report.type)}
                      <div>
                        <CardTitle className="text-lg">
                          {getReportTypeLabel(report.type)}
                        </CardTitle>
                        <CardDescription>
                          {report.document_name && `Document: ${report.document_name}`}
                          {report.analysis_mode && ` • Mode: ${report.analysis_mode}`}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="text-right">
                      <Button
                        onClick={() => handleDownload(report.filename)}
                        disabled={downloadingReport === report.filename}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingReport === report.filename ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.created_at)}
                      </span>
                      <span>{formatFileSize(report.file_size)}</span>
                    </div>
                    <span className="font-mono text-xs text-gray-500">
                      {report.filename}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Your Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <strong>Compliance Reports:</strong> Comprehensive GDPR analysis results with detailed findings, recommendations, and evidence from your policy analyses.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Policy Revisions:</strong> AI-generated revised policy documents that address identified compliance issues.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

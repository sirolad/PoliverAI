import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import policyService from '@/services/policyService'
import type { ReportMetadata } from '@/types/api'

export default function Reports() {
  const { isAuthenticated, isPro, loading, user } = useAuth()
  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selected_report')
    } catch {
      return null
    }
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const r = await policyService.getUserReports()
      setReports(r)
      if (!r || r.length === 0) {
        setError('You have no reports on file with us yet 🙂')
      } else {
        setError(null)
      }
    } catch (e) {
      console.error('Failed to fetch reports', e)
      setError('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const onSelect = (report: ReportMetadata) => {
    setSelected(report.filename)
    try {
      localStorage.setItem('selected_report', report.filename)
    } catch (err) {
      console.warn('Could not persist selected report', err)
    }
  }

  const onOpen = async (report: ReportMetadata) => {
    try {
      await policyService.openReport(report)
    } catch (err) {
      console.error('Failed to open report', err)
      setError('Failed to open report')
    }
  }

  const onDownload = async (report: ReportMetadata) => {
    try {
      await policyService.downloadReport(report.filename)
    } catch (err) {
      console.error('Failed to download report', err)
      setError('Failed to download report')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Allow access to Reports if user is PRO or has credits available
  const hasCredits = (user?.credits ?? 0) > 0
  if (!isPro && !hasCredits) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Your Reports</h1>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="space-y-4">
        {reports.map((r) => (
          <div key={r.filename} className={`p-4 border rounded ${selected === r.filename ? 'border-blue-600 bg-blue-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold">{r.title || r.document_name}</div>
                <div className="text-sm text-gray-600">{r.document_name}</div>
                <div className="text-sm text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                {r.file_size ? (
                  <div className="text-sm text-gray-500">Size: {(r.file_size / 1024).toFixed(1)} KB</div>
                ) : null}
              </div>
              <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                {r.gcs_url ? (
                  <a href={r.gcs_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Open</a>
                ) : null}
                <button onClick={() => onOpen(r)} className="bg-transparent text-blue-600 px-3 py-1 rounded border border-blue-200">View</button>
                <button onClick={() => onDownload(r)} className="bg-blue-600 text-white px-3 py-1 rounded">Download</button>
                <button onClick={() => onSelect(r)} className={`px-3 py-1 rounded ${selected === r.filename ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                  {selected === r.filename ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

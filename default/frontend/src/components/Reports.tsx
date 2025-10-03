import React, { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import policyService from '@/services/policyService'

export default function Reports() {
  const { isAuthenticated, isPro, loading } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const r = await policyService.getUserReports()
      setReports(r)
    } catch (e) {
      setError('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isPro) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Your Reports</h1>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="space-y-4">
        {reports.map((r, idx) => (
          <div key={idx} className="p-4 border rounded">
            <div className="flex justify-between">
              <div>{r.title}</div>
              <div>{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-2">
              <button onClick={() => policyService.downloadReport(r.filename)} className="bg-blue-600 text-white px-3 py-1 rounded">Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

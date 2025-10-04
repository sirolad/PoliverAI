import React, { useEffect, useState } from 'react'
import policyService from '@/services/policyService'
import useAuth from '@/contexts/useAuth'
import type { ComplianceResult } from '@/types/api'

export default function PolicyAnalysis() {
  const { isAuthenticated, loading } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [showBar, setShowBar] = useState<boolean>(false)

  // If progress hits 100 (for any reason) ensure we hide the bar after a short delay
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setShowBar(false), 800)
      return () => clearTimeout(t)
    }
    return undefined
  }, [progress])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center">Please login to analyze policies.</div>

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0])
  }

  const handleAnalyze = async () => {
    if (!file) return
    setProgress(0)
    setMessage('Starting...')
    setShowBar(true)
    try {
      const res = await policyService.analyzePolicyStreaming(file, 'balanced', (progressVal, msg) => {
        setProgress(progressVal ?? 0)
        setMessage(msg ?? '')
      })
      setResult(res)
      setMessage('Completed')
      // ensure the bar fills to 100% on completion and then hide shortly after
      setProgress(100)
      setTimeout(() => setShowBar(false), 700)
    } catch (err: unknown) {
      if (err instanceof Error) setMessage(err.message)
      else if (typeof err === 'string') setMessage(err)
      else setMessage('Analysis failed')
      // hide bar on error after a short pause so user can see failure state
      setTimeout(() => setShowBar(false), 700)
    }
  }


  return (
    <div className="h-screen p-8 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Policy Analysis</h1>
        <div className="mb-4">
          <input type="file" onChange={handleFileChange} />
        </div>
        
        <div className="mb-4 flex items-center gap-4">
          <button onClick={handleAnalyze} className="bg-blue-600 text-white px-4 py-2 rounded">Analyze</button>
        </div>
      </div>
      
      {/* Top full-width progress bar (fixed) */}
      {showBar && (
        <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
          <div className="h-1 w-full bg-transparent">
            <div
              className="h-1 rounded-r-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(2, progress)}%` }}
              aria-hidden
            />
          </div>
          {/* Optional percentage pill beneath the bar */}
          <div className="w-full flex justify-center mt-1 pointer-events-none">
            <div className="text-xs bg-white/90 text-blue-700 px-2 py-0.5 rounded-md shadow-sm">
              {progress}%
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-sm font-medium">Progress: {progress}%</div>
        <div className="text-sm text-gray-600">Message: {message}</div>
      </div>
      <div>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}

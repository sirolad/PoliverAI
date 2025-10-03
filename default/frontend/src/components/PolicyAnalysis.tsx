import React, { useState } from 'react'
import policyService from '@/services/policyService'
import useAuth from '@/contexts/useAuth'
import type { ComplianceResult } from '@/types/api'

export default function PolicyAnalysis() {
  const { isAuthenticated, loading } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<ComplianceResult | null>(null)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center">Please login to analyze policies.</div>

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0])
  }

  const handleAnalyze = async () => {
    if (!file) return
    setProgress(0)
    setMessage('Starting...')
    try {
      const res = await policyService.analyzePolicyStreaming(file, 'balanced', (progressVal, msg) => {
        setProgress(progressVal ?? 0)
        setMessage(msg ?? '')
      })
      setResult(res)
      setMessage('Completed')
    } catch (err: unknown) {
      if (err instanceof Error) setMessage(err.message)
      else if (typeof err === 'string') setMessage(err)
      else setMessage('Analysis failed')
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Policy Analysis</h1>
      <div className="mb-4">
        <input type="file" onChange={handleFileChange} />
      </div>
      <div className="mb-4">
        <button onClick={handleAnalyze} className="bg-blue-600 text-white px-4 py-2 rounded">Analyze</button>
      </div>
      <div className="mb-4">
        <div>Progress: {progress}%</div>
        <div>Message: {message}</div>
      </div>
      <div>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}

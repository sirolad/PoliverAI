import React from 'react'
import { ScrollView } from 'react-native'
import {
  LoadingSpinner,
  NoDataView,
  TopControls,
  PolicyWorkspace,
  EnterTitleModal,
  EnterInstructionsModal,
  InsufficientCreditsModal,
  PolicyMainPanel,
} from '@poliverai/shared-ui'
import policyService from '../services/policyService'

export default function PolicyAnalysisScreen() {
  // Core UI state mirrored from web version (simplified for RN)
  const [progress, setProgress] = React.useState<number>(0)
  const [message, setMessage] = React.useState<string>('')
  const [result, setResult] = React.useState<any | null>(null)
  const [reportFilename, setReportFilename] = React.useState<string | null>(null)
  const [revisedReportFilename, setRevisedReportFilename] = React.useState<string | null>(null)
  const [isFullReportGenerated, setIsFullReportGenerated] = React.useState<boolean>(false)
  const [userReportsCount, setUserReportsCount] = React.useState<number | null>(null)
  const [file, setFile] = React.useState<any | null>(null)
  const [activeTab, setActiveTab] = React.useState<'free' | 'full' | 'revised'>('free')
  const [detailedContent, setDetailedContent] = React.useState<string | null>(null)
  const [detailedReport, setDetailedReport] = React.useState<Record<string, unknown> | null>(null)
  const [revisedPolicy, setRevisedPolicy] = React.useState<Record<string, unknown> | null>(null)
  const [loadingDetailed, setLoadingDetailed] = React.useState<boolean>(false)
  const [loadingRevised, setLoadingRevised] = React.useState<boolean>(false)

  // modal state
  const [titleModalOpen, setTitleModalOpen] = React.useState(false)
  const [instructionsModalOpen, setInstructionsModalOpen] = React.useState(false)
  const [insufficientOpen, setInsufficientOpen] = React.useState(false)

  // helpers
  const startIndeterminateProgress = (startMessage = 'Analyzing') => {
    setMessage(startMessage)
    setProgress(5)
    const id = setInterval(() => {
      setProgress((cur) => Math.min(90, cur + Math.floor(Math.random() * 5) + 1))
    }, 300)
    return () => clearInterval(id as unknown as number)
  }

  const handleAnalyze = async () => {
    setActiveTab('free')
    setDetailedReport(null)
    setRevisedPolicy(null)
    setDetailedContent(null)
    setProgress(0)
    setMessage('Analyzing')
    const stop = startIndeterminateProgress('Analyzing')
    try {
      const res = await policyService.analyzePolicyStreaming(file, 'fast', (p?: number, m?: string) => {
        if (typeof p === 'number') setProgress(p)
        if (m) setMessage(m)
      })
      setResult(res)
      setProgress(100)
      try { stop() } catch {}
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Analysis failed')
      try { stop() } catch {}
    }
  }

  const loadDetailed = async (filename?: string | null, mode: 'full' | 'revised' = 'full') => {
    const fn = filename ?? (mode === 'revised' ? revisedReportFilename ?? null : reportFilename ?? null)
    if (!fn) return
    if (mode === 'full') setLoadingDetailed(true)
    else setLoadingRevised(true)
    try {
      const resp = await policyService.getDetailedReport(fn)
      if (mode === 'full') setDetailedReport(resp as any)
      else {
        setRevisedPolicy(resp as any)
        const maybeContent = (resp as any)?.content
        setDetailedContent(typeof maybeContent === 'string' ? maybeContent : null)
      }
      setMessage('Loaded')
      setProgress(100)
    } catch (err) {
      if (mode === 'full') setDetailedReport(null)
      else setRevisedPolicy(null)
      setMessage('Failed to load report')
      setProgress(0)
    } finally {
      if (mode === 'full') setLoadingDetailed(false)
      else setLoadingRevised(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!result) return
    const stop = startIndeterminateProgress('Generating full report')
    try {
      const resp = await policyService.generateVerificationReport(result, file?.name ?? 'policy', 'balanced')
      if (resp && (resp as any).filename) {
        const fn = (resp as any).filename
        setReportFilename(fn)
        setIsFullReportGenerated(true)
        try { await loadDetailed(fn, 'full') } catch {}
      }
      setProgress(100)
      try { stop() } catch {}
    } catch (e: unknown) {
      setMessage('Generate failed')
      try { stop() } catch {}
    }
  }

  const handleGenerateRevision = async (instructions?: string) => {
    if (!result) return
    const stop = startIndeterminateProgress('Generating revision')
    try {
      const original = ''
      const resp = await policyService.generatePolicyRevision(original, result.findings || [], result.recommendations || [], result.evidence || [], file?.name ?? 'policy', 'comprehensive', instructions)
      if (resp?.filename) {
        setRevisedReportFilename((resp as any).filename)
        try { await loadDetailed((resp as any).filename, 'revised') } catch {}
        setActiveTab('revised')
      }
      try { stop() } catch {}
    } catch (e: unknown) {
      setMessage('Revision failed')
      try { stop() } catch {}
    }
  }

  const handleResetAll = () => {
    setFile(null); setResult(null); setReportFilename(null); setRevisedReportFilename(null); setIsFullReportGenerated(false); setProgress(0); setMessage('')
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <TopControls result={result} resetAll={handleResetAll} openSaveModal={() => setTitleModalOpen(true)} openInstructions={() => setInstructionsModalOpen(true)} />

  <PolicyWorkspace handleAnalyze={handleAnalyze} file={file} setFile={setFile} handleGenerateReport={handleGenerateReport} />

      <PolicyMainPanel
        activeTab={activeTab}
        progress={progress}
        message={message}
        isLoadingForTab={activeTab === 'free' ? (progress > 0 && progress < 100) : (activeTab === 'full' ? loadingDetailed : loadingRevised)}
        result={result}
        reportFilename={reportFilename}
        detailedContent={detailedContent}
        detailedReport={detailedReport}
        revisedPolicy={revisedPolicy}
        fullReportSource={null}
        detailedDownloadUrl={null}
        setLoadingDetailed={setLoadingDetailed}
        setLoadingRevised={setLoadingRevised}
        setActiveTab={setActiveTab}
        handleGenerateReport={handleGenerateReport}
      />

      <EnterTitleModal open={titleModalOpen} initial={undefined} onClose={() => setTitleModalOpen(false)} onConfirm={(t?: string) => { console.log('save confirmed', t); setTitleModalOpen(false) }} />
      <EnterInstructionsModal open={instructionsModalOpen} initial={undefined} onClose={() => setInstructionsModalOpen(false)} onConfirm={(instr?: string) => { handleGenerateRevision(instr); setInstructionsModalOpen(false) }} />
      <InsufficientCreditsModal open={insufficientOpen} onClose={() => setInsufficientOpen(false)} />

      <LoadingSpinner message="" />
    </ScrollView>
  )
}

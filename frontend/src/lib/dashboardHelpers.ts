import type { ReportMetadata } from '@/types/api'

export function getDefaultMonthRange() {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  const from = startOfMonth.toISOString().slice(0, 10)
  const to = endOfMonth.toISOString().slice(0, 10)
  return { startOfMonth, endOfMonth, from, to }
}

export const getCost = (key: string | undefined): { credits: number; usd: number } | undefined => {
  const MAP: Record<string, { credits: number; usd: number }> = {
    analysis: { credits: 5, usd: 0.5 },
    report: { credits: 5, usd: 0.5 },
    ingest: { credits: 10, usd: 1 },
  }
  if (!key) return undefined
  return MAP[key]
}

export const getCostForReport = (r: ReportMetadata) => {
  if (r.type === 'revision') return getCost('ingest') ?? { credits: 0, usd: 0 }
  if (r.is_full_report) return getCost('report') ?? { credits: 0, usd: 0 }
  return getCost('analysis') ?? { credits: 0, usd: 0 }
}

export function computeSavedTotals(userReports: ReportMetadata[] | null) {
  if (!userReports) return {
    totalSavedFiles: null,
    fullReportsSaved: null,
    revisedDocsSaved: null,
    totalSavedCredits: null,
    totalSavedUsd: null,
    freeReportsSaved: null,
  }
  const totalSavedFiles = userReports.length
  const fullReportsSaved = userReports.filter((r) => !!r.is_full_report).length
  const revisedDocsSaved = userReports.filter((r) => r.type === 'revision').length
  const totalSavedCredits = userReports.reduce((acc, r) => acc + (getCostForReport(r).credits || 0), 0)
  const totalSavedUsd = userReports.reduce((acc, r) => acc + (getCostForReport(r).usd || 0), 0)
  const freeReportsSaved = userReports.filter((r) => (r.analysis_mode || '').toString() === 'fast').length
  return { totalSavedFiles, fullReportsSaved, revisedDocsSaved, totalSavedCredits, totalSavedUsd, freeReportsSaved }
}

export function computeDerivedFree(totalSavedFiles: number | null, fullReportsSaved: number | null, revisedDocsSaved: number | null) {
  if (totalSavedFiles === null || fullReportsSaved === null || revisedDocsSaved === null) return null
  const val = (totalSavedFiles || 0) - (fullReportsSaved || 0) - (revisedDocsSaved || 0)
  return Math.max(0, val)
}

export function formatRangeLabel(range: { from: string | null; to: string | null } | null, defFrom: string, defTo: string) {
  if (!range || (!range.from && !range.to)) return 'Showing: all time'
  if (range.from === defFrom && range.to === defTo) return `Showing: this month (${defFrom} → ${defTo})`
  if (range.from && range.to) return `Showing: ${range.from} → ${range.to}`
  if (range.from) return `Showing from ${range.from}`
  return `Showing up to ${range.to}`
}

export function computeCompletedCosts(userReports: ReportMetadata[] | null) {
  if (!userReports) return { credits: 0, usd: 0 }
  const completed = userReports.filter((r) => (typeof r.status !== 'undefined') ? r.status === 'completed' : true)
  const creds = completed.reduce((acc, r) => acc + getCostForReport(r).credits, 0)
  const usd = completed.reduce((acc, r) => acc + getCostForReport(r).usd, 0)
  return { credits: creds, usd }
}

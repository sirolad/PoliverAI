import type { ReportMetadata } from '../types/api'

export function normalizeStatus(s?: string): string {
  if (!s) return ''
  return s.toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

export function isFullReport(r?: ReportMetadata): boolean {
  if (!r) return false
  return Boolean(r.is_full_report || (r.type && String(r.type).toLowerCase() === 'verification'))
}

export function isRevisionReport(r?: ReportMetadata): boolean {
  if (!r) return false
  return Boolean(r.type && String(r.type).toLowerCase() === 'revision')
}

export function isFreeAnalysis(r?: ReportMetadata): boolean {
  if (!r) return false
  return ((r.analysis_mode || '').toString() === 'fast')
}

export function formatFileSize(bytes?: number): string {
  if (!bytes && bytes !== 0) return ''
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function formatDateTime(iso?: string): string {
  try {
    if (!iso) return ''
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso || '')
  }
}

export function getStarCounts(score?: number) {
  if (typeof score !== 'number') return { full: 0, half: 0, empty: 5, percentage: undefined }
  const percentage = Math.max(0, Math.min(100, score))
  const stars = (percentage / 100) * 5
  const full = Math.floor(stars)
  const half = stars - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return { full, half, empty, percentage }
}

export function classifyDeletedDetails(reports: ReportMetadata[], filenames: string[]) {
  return filenames.map((fn) => {
    const found = reports.find((x) => x.filename === fn)
    return {
      filename: fn,
      is_full_report: isFullReport(found),
      is_revision: isRevisionReport(found),
      is_free: isFreeAnalysis(found),
    }
  })
}

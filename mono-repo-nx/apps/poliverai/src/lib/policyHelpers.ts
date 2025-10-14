import { getApiBaseOrigin } from './paymentsHelpers'

export function formatVerdictLabel(v?: string | null) {
  if (!v) return ''
  return String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function computeStarCounts(score?: number) {
  const sc = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0
  const stars = (sc / 100) * 5
  const full = Math.floor(stars)
  const half = stars - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return { full, half, empty }
}

export function formatFileSize(bytes?: number) {
  if (bytes == null) return 'n/a'
  const kb = Math.round(bytes / 1024)
  if (kb < 1024) return `${kb} KB`
  const mb = (bytes / (1024 * 1024)).toFixed(1)
  return `${mb} MB`
}

export function formatFileMeta(file?: { name?: string; size?: number; type?: string } | null) {
  if (!file) return ''
  return `${file.name ?? ''} • ${formatFileSize(file.size as number)} • ${file.type || 'n/a'}`
}

export function getReportDownloadUrl(filename: string) {
  const apiBase = getApiBaseOrigin() ?? 'http://localhost:8000'
  return `${apiBase}/api/v1/reports/download/${encodeURIComponent(filename)}`
}

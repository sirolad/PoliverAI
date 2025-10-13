import type { ReportMetadata } from '@/types/api'

function normalizeString(s?: string) {
  return (s || '').toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

export function filterReports(
  reports: ReportMetadata[],
  opts: { query?: string; statusFilter?: string; startDate?: string; endDate?: string }
): ReportMetadata[] {
  const { query, statusFilter, startDate, endDate } = opts
  return reports.filter((r) => {
    if (query) {
      const q = query.toLowerCase()
      if (!((r.title || r.document_name || '').toLowerCase().includes(q) || r.filename.toLowerCase().includes(q))) return false
    }
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'full') {
        if (!(r.is_full_report || (r.type && String(r.type).toLowerCase() === 'verification'))) return false
      } else {
        const v = normalizeString((r.verdict || r.status) as string)
        if (!v || v !== statusFilter) return false
      }
    }
    if (startDate) {
      const d = new Date(r.created_at)
      if (d < new Date(startDate)) return false
    }
    if (endDate) {
      const d = new Date(r.created_at)
      const ed = new Date(endDate)
      ed.setHours(23, 59, 59, 999)
      if (d > ed) return false
    }
    return true
  })
}

export default { filterReports }

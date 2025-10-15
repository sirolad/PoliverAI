import { useCallback, useState } from 'react'
import type { ReportMetadata } from '@/types/api'

export default function useSelection(initial: Record<string, boolean> = {}) {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>(initial)

  const syncWithReports = useCallback((reports: ReportMetadata[]) => {
    setSelectedFiles((prev) => {
      const next: Record<string, boolean> = {}
      reports.forEach((r) => { if (prev[r.filename]) next[r.filename] = true })
      return next
    })
  }, [setSelectedFiles])

  return { selectedFiles, setSelectedFiles, syncWithReports }
}

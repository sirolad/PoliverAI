import { useCallback, useState } from 'react'
import type { ReportMetadata } from './useReports'

export default function useSelection() {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({})

  const toggle = useCallback((filename: string) => {
    setSelectedFiles(prev => ({ ...prev, [filename]: !prev[filename] }))
  }, [])

  const clear = useCallback(() => setSelectedFiles({}), [])

  const setAll = useCallback((filenames: string[]) => {
    const m: Record<string, boolean> = {}
    filenames.forEach(f => (m[f] = true))
    setSelectedFiles(m)
  }, [])

  const getSelected = useCallback(() => Object.keys(selectedFiles).filter(k => selectedFiles[k]), [selectedFiles])

  const syncWithReports = useCallback((reports: ReportMetadata[]) => {
    setSelectedFiles(prev => {
      const next: Record<string, boolean> = {}
      reports.forEach(r => {
        if (prev[r.filename]) next[r.filename] = true
      })
      return next
    })
  }, [])

  return { selectedFiles, toggle, clear, setAll, getSelected, syncWithReports }
}

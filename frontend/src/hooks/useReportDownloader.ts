import { useCallback } from 'react'
import { getReportDownloadUrl } from '@/lib/policyHelpers'

export default function useReportDownloader() {
  const download = useCallback(async (filename?: string, fallbackContent?: string | null) => {
    if (!filename) return
    try {
      const url = getReportDownloadUrl(filename)
      window.open(url, '_blank')
    } catch {
      if (fallbackContent) {
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(`<html><head><title>${filename}</title></head><body><pre style="white-space:pre-wrap; font-family:inherit">${String(fallbackContent)}</pre></body></html>`)
          w.document.close()
          w.print()
        }
      }
    }
  }, [])

  return { download }
}

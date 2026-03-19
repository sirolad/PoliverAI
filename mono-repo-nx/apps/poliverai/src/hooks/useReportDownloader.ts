import { useCallback } from 'react'
import { Linking } from 'react-native'
import { getReportDownloadUrl } from '../lib/policyHelpers'

export default function useReportDownloader() {
  const download = useCallback(async (filename?: string, _fallbackContent?: string | null) => {
    if (!filename) return
    try {
      const url = getReportDownloadUrl(filename)
      await Linking.openURL(url)
    } catch (err) {
      console.warn('download failed', err)
    }
  }, [])

  return { download }
}


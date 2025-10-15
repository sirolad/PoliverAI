import { useEffect, useState } from 'react'

export default function useRevisedPolicyPreview(downloadUrl?: string | null) {
  const [url, setUrl] = useState<string | null>(downloadUrl ?? null)

  useEffect(() => {
    setUrl(downloadUrl ?? null)
  }, [downloadUrl])

  return { downloadUrl: url, hasDownload: Boolean(url) }
}

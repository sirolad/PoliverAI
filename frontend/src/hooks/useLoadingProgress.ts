import { useEffect, useState } from 'react'

export type UseLoadingProgressOptions = {
  initial?: number
  intervalMs?: number
}

export default function useLoadingProgress(isLoading: boolean, opts?: UseLoadingProgressOptions) {
  const { initial = 0, intervalMs = 400 } = opts || {}
  const [progress, setProgress] = useState<number>(initial)
  const [showBar, setShowBar] = useState<boolean>(false)

  useEffect(() => {
    let interval: number | undefined
    let timeout: number | undefined
    if (isLoading) {
      setShowBar(true)
      setProgress(10)
      interval = window.setInterval(() => {
        setProgress((p) => Math.min(90, Math.round(p + Math.random() * 12)))
      }, intervalMs) as unknown as number
    } else {
      setProgress(100)
      timeout = window.setTimeout(() => setShowBar(false), 700) as unknown as number
    }
    return () => {
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [isLoading, intervalMs])

  return { progress, showBar }
}

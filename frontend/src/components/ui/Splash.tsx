import React from 'react'
import LottiePlayer from './LottiePlayer'

type SplashProps = {
  src?: string
  durationMs?: number
  delayMs?: number
  onFinish?: () => void
}

export default function Splash({ src = '/poliverai-splash.json', durationMs = 2000, delayMs = 300, onFinish }: SplashProps) {
  const [animationData, setAnimationData] = React.useState<unknown | null>(null)
  const [usePathFallback, setUsePathFallback] = React.useState(false)
  const destroyTimeoutRef = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    // Simplified: fetch the JSON and pass as animationData to LottiePlayer
  let mounted = true
    const start = async () => {
      try {
        const resp = await fetch(src)
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`)
        const json = await resp.json()
        if (!mounted) return
        // compute duration from op/ip/fr as fallback timeout (ms)
        let computedMs = durationMs
        try {
          const ip = (json && (json.ip || 0)) as number | undefined
          const op = (json && (json.op || json.op === 0 ? json.op : undefined)) as number | undefined
          const fr = (json && (json.fr || json.fr === 0 ? json.fr : undefined)) as number | undefined
          if (typeof op === 'number' && typeof fr === 'number') {
            const frames = op - (ip || 0)
            computedMs = Math.max(0, (frames / fr) * 1000)
            console.debug('Splash: computed playDurationMs from JSON', { ip, op, fr, computedMs })
          }
        } catch (e) { console.debug('Splash: failed to compute playDurationMs', e) }

        // set JSON into state so LottiePlayer can render it
        setAnimationData(json as unknown)

        // as a safety, finish after computedMs + buffer if Lottie doesn't emit complete
        destroyTimeoutRef.current = window.setTimeout(() => {
          try { if (onFinish) onFinish() } catch (e) { console.debug('Splash: onFinish call failed', e) }
        }, Math.max(100, Math.round(computedMs + 160)))
      } catch (e) {
        console.error('Splash: failed to fetch animation JSON, will fallback to path', e)
        if (!mounted) return
        // fallback: let LottiePlayer load by path
        setUsePathFallback(true)
      }
    }

    const timer = window.setTimeout(start, delayMs)
    return () => {
      mounted = false
      clearTimeout(timer)
      if (destroyTimeoutRef.current) clearTimeout(destroyTimeoutRef.current)
    }
  }, [src, durationMs, delayMs, onFinish])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm" style={{ zIndex: 99999 }}>
      {animationData && !usePathFallback ? (
        <LottiePlayer
          animationData={animationData}
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto"
          onComplete={() => {
            if (destroyTimeoutRef.current) { clearTimeout(destroyTimeoutRef.current); destroyTimeoutRef.current = undefined }
            try { if (onFinish) onFinish() } catch (e) { console.debug('Splash: onFinish failed', e) }
          }}
        />
      ) : (
        <LottiePlayer
          path={src}
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto"
          onComplete={() => { try { if (onFinish) onFinish() } catch (e) { console.debug('Splash: onFinish failed', e) } }}
        />
      )}
    </div>
  )
}

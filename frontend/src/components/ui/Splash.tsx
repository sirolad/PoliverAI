import React from 'react'
import { twFromTokens, colors, spacing } from '@/styles/styleTokens'
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type SplashProps = {
  src?: string
  durationMs?: number
  delayMs?: number
  onFinish?: () => void
}

export default function Splash({
  src = './poliverai-splash.lottie',
  durationMs = 2000,
  delayMs = 300,
  onFinish,
}: SplashProps) {
  const [style, setStyle] = React.useState<React.CSSProperties | undefined>()
  const timeoutRef = React.useRef<number | undefined>(undefined)
  const playerRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    // Try to fetch `src` and detect type. If it's JSON, render via LottiePlayer;
    // otherwise prefer the dotLottie web component (DotLottiePlayer).
    let mounted = true
    const probe = async () => {
      try {
        const resp = await fetch(src)
        if (!mounted) return
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`)
        const ct = (resp.headers.get('content-type') || '').toLowerCase()
        if (ct.includes('application/json') || src.toLowerCase().endsWith('.json')) {
          const json = await resp.json()
          if (!mounted) return

          // compute responsive size
          try {
            const w = typeof json.w === 'number' ? json.w : undefined
            const h = typeof json.h === 'number' ? json.h : undefined
            if (w && h && typeof window !== 'undefined') {
              const maxW = Math.max(100, Math.round(window.innerWidth * 0.9))
              const maxH = Math.max(100, Math.round(window.innerHeight * 0.9))
              const scale = Math.min(1, maxW / w, maxH / h)
              const width = Math.max(100, Math.round(w * scale))
              const height = Math.max(100, Math.round(h * scale))
              setStyle({ width: `${width}px`, height: `${height}px` })
            } else {
              setStyle({ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' })
            }
          } catch {
            setStyle({ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' })
          }
        } else {
          setStyle({ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' })
        }
      } catch (e) {
        console.debug('Splash: probe failed, falling back to dotLottie', e)
        // fallback: try JSON path in public
        try {
          const fallback = '/poliverai-splash.json'
          const r2 = await fetch(fallback)
          if (r2.ok) {
            // const json = await r2.json()
            if (!mounted) return
            setStyle({ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' })
            return
          }
  } catch { /* ignore */ }
        setStyle({ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto' })
      }

      // safety timeout if no 'complete' event fires
      timeoutRef.current = window.setTimeout(() => {
        try { onFinish?.() } catch (e) { console.debug('Splash: onFinish failed', e) }
      }, Math.max(100, Math.round(durationMs + 160)))
    }

  const timer = window.setTimeout(() => { void probe() }, delayMs)

    return () => {
      mounted = false
      clearTimeout(timer)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [durationMs, delayMs, onFinish, src])

  // Attach to the dotlottie player's `complete` event via ref since
  // the `DotLottieReact` props type doesn't include an `onComplete` callback.
  React.useEffect(() => {
    const el = playerRef.current
    if (!el || typeof el.addEventListener !== 'function') return
    const handleComplete = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      try { onFinish?.() } catch (e) { console.debug('Splash: onFinish failed', e) }
    }
    // 'complete' is the event emitted by dotlottie-player when playback finishes
    el.addEventListener('complete', handleComplete)
    return () => { el.removeEventListener('complete', handleComplete) }
  }, [onFinish])

  return (
    <div className={twFromTokens('fixed inset-0', spacing.fullScreenCenter, colors.surfaceOverlay, 'backdrop-blur-sm')} style={{ zIndex: 99999 }}>
        <DotLottieReact
          src="https://lottie.host/60d101b5-d7e9-4e51-8c0c-2624f51e642a/sGDt58V29f.lottie"
          autoplay
          style={style}
        />
    </div>
  )
}

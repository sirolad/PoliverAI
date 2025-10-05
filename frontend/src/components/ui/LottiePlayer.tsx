import React from 'react'
import Lottie from 'react-lottie-player'

type LottiePlayerProps = {
  animationData?: unknown
  path?: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  onComplete?: () => void
  useWebWorker?: boolean
}

export default function LottiePlayer({
  animationData,
  path,
  loop = false,
  autoplay = true,
  className,
  onComplete,
}: LottiePlayerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = React.useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadedData, setLoadedData] = React.useState<any>(animationData ?? null)

  React.useEffect(() => {
    let mounted = true
    if (!animationData && path) {
      fetch(path).then(async (r) => {
        if (!mounted) return
        if (!r.ok) throw new Error(`Failed to fetch Lottie at ${path}: ${r.status}`)
        try {
          const json = await r.json()
          if (mounted) setLoadedData(json)
        } catch (e) {
          console.error('LottiePlayer: failed to parse JSON from path', e)
        }
      }).catch((e) => {
        console.error('LottiePlayer: fetch path failed', e)
      })
    }
    return () => { mounted = false }
  }, [animationData, path])

  React.useEffect(() => {
    // attach/remove complete listener on the underlying lottie instance when available
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = (lottieRef.current as any)?.getLottie ? (lottieRef.current as any).getLottie() : (lottieRef.current as any)?.animationItem
      if (instance && onComplete) {
        instance.addEventListener?.('complete', onComplete)
  return () => { try { instance.removeEventListener?.('complete', onComplete) } catch { /* ignore */ } }
      }
    } catch (e) { console.debug('LottiePlayer: attach listener failed', e) }
    return () => {}
  }, [loadedData, onComplete])

  // react-lottie-player expects 'animationData' or 'src', 'play' boolean and 'loop'
  const play = Boolean(autoplay)
  const lottieProps: any = { loop, play }
  if (loadedData) lottieProps.animationData = loadedData
  else if (path) lottieProps.src = path

  return (
    <div className={className || ''}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Lottie ref={lottieRef as any} {...lottieProps} />
    </div>
  )
}

import React from 'react'
import { makeLottieOptions, loadLottieAnimation, attachLottieComplete, destroyLottie } from '@/lib/lottieHelpers'

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
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const animRef = React.useRef<unknown | null>(null)

  React.useEffect(() => {
    // Clean up any previous animation
    if (animRef.current) {
      try {
        destroyLottie(animRef.current)
      } catch (e) {
        console.debug('LottiePlayer: destroy previous animation failed', e)
      }
      animRef.current = null
    }

    // Build options: prefer provided animationData; otherwise use path
    try {
      const opts = animationData
        ? ({ container: containerRef.current, renderer: 'svg', loop, autoplay, animationData, useWebWorker: false } as Record<string, unknown>)
        : makeLottieOptions(containerRef.current, path ?? '', loop, autoplay, false)

      const anim = loadLottieAnimation(opts)
      animRef.current = anim
      attachLottieComplete(anim, onComplete)
    } catch (e) {
      console.debug('LottiePlayer: failed to load animation', e)
    }

    return () => {
      if (animRef.current) {
        try {
          destroyLottie(animRef.current)
        } catch (e) {
          console.debug('LottiePlayer: destroy failed', e)
        }
        animRef.current = null
      }
    }
  }, [animationData, path, loop, autoplay, onComplete])

  return <div ref={containerRef} className={className || ''} />
}

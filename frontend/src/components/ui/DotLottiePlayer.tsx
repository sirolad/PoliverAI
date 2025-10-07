/* eslint-disable @typescript-eslint/no-namespace */
// DotLottiePlayer.tsx
import React from 'react'
import '@dotlottie/player-component' // registers <dotlottie-player>

type DotLottiePlayerProps = {
  src: string // <-- point to .lottie file
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: React.CSSProperties
  onComplete?: () => void
}

export default function DotLottiePlayer({
  src,
  loop = false,
  autoplay = true,
  className,
  style,
  onComplete,
}: DotLottiePlayerProps) {
  const ref = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleComplete = () => {
      try { onComplete?.() } catch {}
    }

    el.addEventListener('complete', handleComplete as EventListener)
    return () => {
      el.removeEventListener('complete', handleComplete as EventListener)
    }
  }, [onComplete])

  // Build props object for the element
  const props: any = {
    ref,
    src,
    autoplay: autoplay ? true : undefined,
    loop: loop ? true : undefined,
    class: className,
    style,
  }

  // Create element without JSX intrinsic typing for 'dotlottie-player'
  return React.createElement('dotlottie-player', props)
}

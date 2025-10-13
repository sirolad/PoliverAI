import React from 'react'
import { makeLottieOptions, loadLottieAnimation, attachLottieComplete, destroyLottie } from '@/lib/lottieHelpers'
import { twFromTokens } from '@/styles/styleTokens'

type SimpleLottieProps = {
  src: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  classTokens?: Array<string | { tw?: string } | undefined>
  onComplete?: () => void
  // allow opting into the worker; default is false to avoid worker XHR issues
  useWebWorker?: boolean
}

export default function SimpleLottie({
  src,
  loop = false,
  autoplay = true,
  className,
  classTokens,
  onComplete,
  useWebWorker = false,
}: SimpleLottieProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    let anim: unknown = null
    try {
      const opts = makeLottieOptions(ref.current as Element | null, src, loop, autoplay, useWebWorker)
      anim = loadLottieAnimation(opts)
      attachLottieComplete(anim, onComplete)
    } catch (e) {
      console.error('SimpleLottie: failed to load animation', e)
    }

    return () => {
      destroyLottie(anim)
    }
  }, [src, loop, autoplay, onComplete, useWebWorker])

  const finalClassName = className ?? twFromTokens(...(classTokens ?? []))

  return <div ref={ref} className={finalClassName} />
}

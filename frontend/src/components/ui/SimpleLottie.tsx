import React from 'react'
import lottie from 'lottie-web'

type SimpleLottieProps = {
  src: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  onComplete?: () => void
  // allow opting into the worker; default is false to avoid worker XHR issues
  useWebWorker?: boolean
}

export default function SimpleLottie({
  src,
  loop = false,
  autoplay = true,
  className,
  onComplete,
  useWebWorker = false,
}: SimpleLottieProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    let anim: unknown = null
    try {
      const opts: unknown = {
        container: ref.current as Element,
        renderer: 'svg',
        loop,
        autoplay,
        path: src,
        useWebWorker,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      anim = lottie.loadAnimation(opts as any)

      try {
        // prefer Lottie's event system when available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(anim as any)?.addEventListener?.('complete', () => {
          try { onComplete?.() } catch (e) { console.debug('SimpleLottie onComplete handler failed', e) }
        })
      } catch (e) {
        console.debug('SimpleLottie: failed to attach complete listener', e)
      }
    } catch (e) {
      console.error('SimpleLottie: failed to load animation', e)
    }

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { (anim as any)?.destroy?.() } catch (e) { console.debug('SimpleLottie destroy failed', e) }
    }
  }, [src, loop, autoplay, onComplete, useWebWorker])

  return <div ref={ref} className={className || ''} />
}

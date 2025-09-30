import React, { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import animations from '../assets/lottie-animations'

export default function Splash({ onComplete }: { onComplete?: () => void }) {
  const container = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!container.current) return
    const anim = lottie.loadAnimation({
      container: container.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: animations.poliveraiSplash,
    })

    anim.addEventListener('complete', () => {
      onComplete?.()
      anim.destroy()
    })

    return () => {
      try { anim.destroy() } catch (e) {}
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950">
      <div ref={container} className="w-64 h-64" />
    </div>
  )
}

import React from 'react'
import { makeLottieOptions, loadLottieAnimation, attachLottieComplete, destroyLottie } from '@/lib/lottieHelpers'
import { twFromTokens, spacing, alignment, colors, hoverBgFromColor, hoverFromColor } from '@/styles/styleTokens'

type SimpleLottieProps = {
  src: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  classTokens?: Array<string | { tw?: string } | undefined>
  // optional token keys to build classes from centralized tokens
  spacingToken?: keyof typeof spacing
  alignToken?: keyof typeof alignment
  bgToken?: keyof typeof colors
  hoverBgToken?: keyof typeof colors
  hoverTextToken?: keyof typeof colors
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
  // token props
  spacingToken,
  alignToken,
  bgToken,
  hoverBgToken,
  hoverTextToken,
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

  const tokenList: Array<string | { tw?: string } | undefined> = []
  // start with explicit classTokens when provided
  if (classTokens && classTokens.length) tokenList.push(...classTokens)
  // add token-based classes from token keys
  if (spacingToken) tokenList.push(spacing[spacingToken])
  if (alignToken) tokenList.push(alignment[alignToken])
  if (bgToken) tokenList.push(colors[bgToken])
  // hover helpers return raw class strings (e.g. 'hover:bg-...')
  if (hoverBgToken) tokenList.push(hoverBgFromColor(colors[hoverBgToken]))
  if (hoverTextToken) tokenList.push(hoverFromColor(colors[hoverTextToken]))

  // compose all tokens, then append any raw className string
  const composed = twFromTokens(...tokenList)
  const finalClassName = [composed, className].filter(Boolean).join(' ').trim()

  return <div ref={ref} className={finalClassName} />
}

import lottie from 'lottie-web'

// Build a simple options object for lottie.loadAnimation
export function makeLottieOptions(container: Element | null, path: string, loop = false, autoplay = true, useWebWorker = false) {
  return {
    container: container ?? undefined,
    renderer: 'svg',
    loop,
    autoplay,
    path,
    useWebWorker,
  } as Record<string, unknown>
}

// Load animation and return the instance (typed as unknown to avoid coupling)
export type LottieLoadOptions = {
  container: Element | null
  renderer?: 'svg' | 'canvas' | 'html'
  loop?: boolean | number
  autoplay?: boolean
  path?: string
  useWebWorker?: boolean
}

export function loadLottieAnimation(opts: Record<string, unknown>): unknown {
  // Cast to a narrowed LottieLoadOptions type before calling the library.
  const o = opts as unknown as LottieLoadOptions
  return lottie.loadAnimation(o)
}

export type LottieAnimationLike = {
  addEventListener?: (event: string, cb: () => void) => void
  destroy?: () => void
}

export function attachLottieComplete(anim: unknown, onComplete?: () => void) {
  try {
    const a = anim as LottieAnimationLike | undefined
    a?.addEventListener?.('complete', () => {
      try {
        onComplete?.()
      } catch (e) {
        console.debug('lottie onComplete handler failed', e)
      }
    })
  } catch (e) {
    console.debug('attachLottieComplete failed', e)
  }
}

export function destroyLottie(anim: unknown) {
  try {
    const a = anim as LottieAnimationLike | undefined
    a?.destroy?.()
  } catch (e) {
    console.debug('destroyLottie failed', e)
  }
}

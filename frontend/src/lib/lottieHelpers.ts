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
export function loadLottieAnimation(opts: Record<string, unknown>): unknown {
  // lottie types are not imported here to keep helper decoupled; cast where needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lottie.loadAnimation(opts as any)
}

export function attachLottieComplete(anim: unknown, onComplete?: () => void) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (anim as any)?.addEventListener?.('complete', () => {
      try { onComplete?.() } catch (e) { console.debug('lottie onComplete handler failed', e) }
    })
  } catch (e) {
    console.debug('attachLottieComplete failed', e)
  }
}

export function destroyLottie(anim: unknown) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (anim as any)?.destroy?.()
  } catch (e) {
    console.debug('destroyLottie failed', e)
  }
}

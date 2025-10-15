// RN shim for lottie helpers — real animations should use lottie-react-native or similar
export function makeLottieOptions() {
  return {}
}

export function loadLottieAnimation(): null {
  // not supported in this shim
  return null
}

export function attachLottieComplete(_: unknown, onComplete?: () => void) {
  // immediately call onComplete to avoid hanging code paths
  try {
    onComplete?.()
  } catch {
    // ignore
  }
}

export function destroyLottie(_: unknown) {
  // noop
}

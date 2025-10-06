import type { CSSProperties } from 'react'

// Return a safe CSSProperties object for the progress indicator transform.
export function progressTransformStyle(value?: number | null): CSSProperties {
  const v = Math.max(0, Math.min(100, typeof value === 'number' ? value : 0))
  return { transform: `translateX(-${100 - v}%)` }
}

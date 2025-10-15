export function progressTransformStyle(value?: number | null) {
  const v = Math.max(0, Math.min(100, typeof value === 'number' ? value : 0))
  // RN consumers can use translateX with Animated; provide numeric percent
  return { percent: v }
}
export function progressPercent(value?: number | null): number {
  const v = Math.max(0, Math.min(100, typeof value === 'number' ? value : 0))
  return v
}

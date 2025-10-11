/**
 * Convert a 0-100 numeric score into a rounded 0-5 star count.
 */
export function useRoundedStars(score?: number | null) {
  const s = Math.max(0, Math.min(100, Number(score ?? 0)))
  const stars = Math.round((s / 100) * 5)
  return { stars, percent: s }
}

export default useRoundedStars

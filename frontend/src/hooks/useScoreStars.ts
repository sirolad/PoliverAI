/**
 * Derive star counts (full, half, empty) from a 0-100 score.
 * Returns normalized score and counts to keep rendering code simple.
 */
export function useScoreStars(scoreInput: number | undefined | null) {
  const sc = Math.max(0, Math.min(100, Number(scoreInput ?? 0)))
  const stars = (sc / 100) * 5
  const full = Math.floor(stars)
  const half = stars - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return { sc, full, half, empty }
}

export default useScoreStars

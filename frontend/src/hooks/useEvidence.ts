import { useMemo } from 'react'

/**
 * Simple hook to derive a limited list of evidence items and total count.
 * Keeps the slicing logic out of presentation and memoizes the derived array.
 */
export function useEvidence(evidence?: Array<Record<string, unknown>> | null, limit = 6) {
  const count = (evidence || []).length
  const items = useMemo(() => ((evidence || []) as Array<Record<string, unknown>>).slice(0, limit), [evidence, limit])
  return { items, count }
}

export default useEvidence

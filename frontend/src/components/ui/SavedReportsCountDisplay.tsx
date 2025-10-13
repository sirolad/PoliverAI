import useSavedReportsCounter from '@/hooks/useSavedReportsCounter'
import { twFromTokens, fontWeights } from '@/styles/styleTokens'

export default function SavedReportsCountDisplay({ count }: { count: number }) {
  const enabled = count !== null && typeof count !== 'undefined'
  const animated = useSavedReportsCounter(count ?? 0, enabled)
  return <span className={twFromTokens(fontWeights.medium)}>{enabled ? animated : ''}</span>
}

import useSavedReportsCounter from '@/hooks/useSavedReportsCounter'

export default function SavedReportsCountDisplay({ count }: { count: number }) {
  const enabled = count !== null && typeof count !== 'undefined'
  const animated = useSavedReportsCounter(count ?? 0, enabled)
  return <span className="font-medium">{enabled ? animated : ''}</span>
}

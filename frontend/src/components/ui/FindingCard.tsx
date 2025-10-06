type Finding = { article?: string | number; issue?: string; confidence?: number; severity?: 'high' | 'medium' | 'low' | string }
type Props = { finding: Finding }

export default function FindingCard({ finding }: Props) {
  const sev = finding.severity
  const bg = sev === 'high' ? 'bg-red-600' : sev === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
  return (
    <div className={`${bg} p-3 rounded shadow`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-white/10 flex-shrink-0 flex items-center justify-center">
          {/* report/document icon */}
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 1.5L19.5 10H13V3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white break-words">Article {finding.article}</div>
          <div className="text-sm text-white mt-1 break-words whitespace-pre-wrap">{finding.issue}</div>
          <div className="text-xs text-white/90 mt-1">Confidence: {(finding.confidence ?? 0) * 100}%</div>
        </div>
      </div>
    </div>
  )
}

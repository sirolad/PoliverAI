type Evidence = { article?: string | number; policy_excerpt?: string }
export default function EvidenceItem({ article, policy_excerpt }: Evidence) {
  return (
    <div className="p-3 rounded shadow bg-green-700 text-white">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-white/10 flex-shrink-0">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold break-words">{article}</div>
          <div className="text-xs mt-1 whitespace-pre-wrap break-words">{policy_excerpt}</div>
        </div>
      </div>
    </div>
  )
}

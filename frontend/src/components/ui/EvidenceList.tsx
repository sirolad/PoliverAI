import { FileText, FileSearch } from 'lucide-react'
import { t } from '@/i18n'

type EvidenceItem = Record<string, unknown>

type Props = {
  evidence?: Array<EvidenceItem> | null
  limit?: number
}

/**
 * Presentational evidence list used in PolicyAnalysis. Keeps markup focused
 * and small; does not manage fetching or side-effects.
 */
export default function EvidenceList({ evidence, limit = 6 }: Props) {
  const items = (evidence || []).slice(0, limit)
  const count = (evidence || []).length

  return (
    <div className="mt-4">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-gray-600" />
        <span>{t('policy_analysis.evidence_heading') || 'Evidence'}</span>
        <div className="px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-100">{`(${count})`}</div>
      </div>
      <div className="mt-2 space-y-2 text-sm text-gray-700">
        {items.length > 0 ? (
          items.map((ev, i) => (
            <div key={i} className="p-3 rounded shadow bg-green-700 text-white">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-white/10 flex-shrink-0">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold break-words">{String(ev['article'] ?? '')}</div>
                  <div className="text-xs mt-1 whitespace-pre-wrap break-words">{String(ev['policy_excerpt'] ?? '')}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">{t('policy_analysis.no_evidence_excerpts') || 'No evidence excerpts'}</div>
        )}
      </div>
    </div>
  )
}

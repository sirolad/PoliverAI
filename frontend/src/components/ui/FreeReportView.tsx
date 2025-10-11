import { CheckCircle2, AlertTriangle, BarChart } from 'lucide-react'
import FindingCard from '@/components/ui/FindingCard'
import BrandBlock from '../ui/BrandBlock'
import { t } from '@/i18n'
import useRoundedStars from '@/hooks/useRoundedStars'
import type { ComplianceResult } from '@/types/api'

type Props = {
  result: ComplianceResult | null
}

export default function FreeReportView({ result }: Props) {
  const { stars, percent } = useRoundedStars(result?.score)

  return (
    <div data-view="free" id="report-free-view" className="bg-gray-50 p-4 rounded h-full min-h-0 overflow-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />{t('policy_analysis.verdict_label')}</div>
          <div className="text-lg font-semibold">{String(result?.verdict ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => (c as string).toUpperCase())}</div>
          <div className="text-sm text-gray-500 flex items-center gap-2"><BarChart className="h-4 w-4 text-gray-600" />{t('policy_analysis.confidence_label', { pct: String(Math.round(Number(result?.confidence ?? 0) * 100)) })}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">{t('policy_analysis.score_label')}</div>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, idx) => (
              <svg key={idx} className={`h-5 w-5 ${idx < stars ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.39 2.462a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.39-2.462a1 1 0 00-1.176 0l-3.39 2.462c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.047 9.393c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.966z" />
              </svg>
            ))}
            <div className="ml-3 text-sm text-gray-600">{percent}%</div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-800 whitespace-pre-wrap">{result?.summary}</div>
      <div className="mt-4">
        <h4 className="font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />{t('policy_analysis.top_findings')}</h4>
        <div className="mt-2 space-y-2">
          {result?.findings && result.findings.length > 0 ? result.findings.slice(0, 6).map((f, i) => (
            <FindingCard key={i} finding={f} />
          )) : <div className="text-sm text-gray-500">{t('policy_analysis.no_findings_detected')}</div>}
        </div>
      </div>
      <BrandBlock hasBackground showAndelaLogo={false} showPartnershipText={false} showCopyrightText={false} />
    </div>
  )
}

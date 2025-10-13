import { CheckCircle2, FileText, AlertTriangle, BarChart, Lightbulb } from 'lucide-react'
import { Star, StarHalf, Star as StarEmpty } from 'phosphor-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, fontWeights } from '@/styles/styleTokens'
import useScoreStars from '@/hooks/useScoreStars'
import BrandBlock from '../ui/BrandBlock'

type Props = {
  src: Record<string, unknown>
}

export default function FullReportDashboard({ src }: Props) {
  const confidence = Number(src['confidence'] ?? 0)
  const score = Number(src['score'] ?? 0)
  const findings = (src['findings'] ?? []) as Array<Record<string, unknown>>
  const recommendations = (src['recommendations'] ?? []) as Array<Record<string, unknown>>
  const metrics = (src['metrics'] ?? {}) as Record<string, unknown>

  const { sc, full, half, empty } = useScoreStars(score)

  return (
  <div data-view="full" id="report-full-view" className={twFromTokens(colors.surfaceMuted, 'p-4 rounded h-full min-h-0 overflow-auto w-full')}>
  <div className="flex items-start justify-between gap-6">
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted, 'flex items-center gap-2')}><CheckCircle2 className={twFromTokens('h-4 w-4', colors.success)} />{t('policy_analysis.verdict_label')}</div>
          <div className="mt-1 flex items-center gap-3">
            <div className={twFromTokens('text-lg', textSizes.md, 'font-semibold')}>{String(src['verdict'] ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => (c as string).toUpperCase())}</div>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('policy_analysis.confidence_label', { pct: String(Math.round(confidence * 100)) })}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 mr-6">
            <div className={twFromTokens(textSizes.sm, colors.textMuted, 'flex items-center gap-2')}>{t('policy_analysis.score_label')}</div>
          <div className="flex items-center gap-3">
              <div className={twFromTokens('flex items-center gap-1')}>
                {Array.from({ length: full }).map((_, i) => <Star key={`f-${i}`} size={18} weight="fill" className={twFromTokens(colors.warning)} />)}
                {half ? <StarHalf key="half" size={18} className={twFromTokens(colors.warning)} /> : null}
                {Array.from({ length: empty }).map((_, i) => <StarEmpty key={`e-${i}`} size={18} weight="duotone" className={twFromTokens(colors.textMuted)} />)}
              </div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{sc}%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, 'flex items-center gap-2')}><FileText className={twFromTokens('h-4 w-4', colors.textMuted)}/>{t('policy_analysis.summary_heading')}</div>
          <div className={twFromTokens('mt-2', textSizes.sm, colors.textPrimary, 'whitespace-pre-wrap')}>{String(src['summary'] ?? '')}</div>

          <div className="mt-4">
            <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, 'flex items-center gap-2')}><AlertTriangle className={twFromTokens('h-4 w-4', colors.danger)}/>{t('policy_analysis.top_findings')}</div>
            <div className="mt-2 space-y-3">
              {(() => {
                if ((findings || []).length === 0) return <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('policy_analysis.no_findings_detected')}</div>
                return (['high', 'medium', 'low'] as const).map((sev) => {
                  const items = (findings || []).filter((f) => String(f['severity']) === sev)
                  if (items.length === 0) return null
                  const bg = sev === 'high' ? colors.dangerBg : sev === 'medium' ? colors.warningBg : colors.successBg
                  const pill = sev === 'high' ? colors.danger : sev === 'medium' ? colors.warning : colors.success
                  return (
                    <div key={sev}>
                      <div className="flex items-center gap-2">
                        <div className={twFromTokens('px-2 py-0.5 rounded text-xs font-semibold', colors.onPrimary, pill)}>{sev.toUpperCase()}</div>
                        <div className={twFromTokens('text-xs', colors.textMuted)}>{items.length} issue{items.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="mt-2 space-y-2">
                        {items.slice(0, 5).map((f, idx) => {
                          const article = f['article'] ?? ''
                          const issue = f['issue'] ?? ''
                          const conf = Number(f['confidence'] ?? 0)
                            return (
                            <div key={idx} className={twFromTokens(bg, 'p-3 rounded shadow')}>
                              <div className="flex items-start gap-3">
                                <div className={twFromTokens('p-2 rounded', colors.onPrimary, 'flex-shrink-0')}>
                                  <FileText className={twFromTokens('h-5 w-5', colors.onPrimary)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={twFromTokens(fontWeights.semibold, textSizes.sm, colors.onPrimary, 'break-words')}>{String(article)}</div>
                                  <div className={twFromTokens(textSizes.sm, colors.onPrimary, 'mt-1 break-words whitespace-pre-wrap')}>{String(issue)}</div>
                                  <div className={twFromTokens('text-xs', colors.onPrimary, 'mt-1')}>{t('policy_analysis.confidence_label', { pct: String(Math.round(conf * 100)) })}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div className="mt-4">
            <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, 'flex items-center gap-2')}><Lightbulb className={twFromTokens('h-4 w-4', colors.warning)} />Recommendations</div>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-800">
              {(() => {
                if ((recommendations || []).length === 0) return <li className="text-sm text-gray-500">{t('policy_analysis.no_recommendations')}</li>
                return (recommendations || []).map((r, i) => (
                  <li key={i}>{String(r['suggestion'] ?? JSON.stringify(r))} <span className="text-xs text-gray-500">({String(r['article'] ?? '')})</span></li>
                ))
              })()}
            </ul>
          </div>
        </div>

        <aside className="md:col-span-1">
          <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, 'flex items-center gap-2')}><BarChart className={twFromTokens('h-4 w-4', colors.primary)}/>Metrics</div>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            {(() => {
              const total = Number(metrics['total_violations'] ?? 0)
              const fulfills = Number(metrics['total_fulfills'] ?? 0)
              const critical = Number(metrics['critical_violations'] ?? 0)
              return (
                <>
                  <div>{t('policy_analysis.metrics_total_violations')} <span className="font-semibold">{total}</span></div>
                  <div>{t('policy_analysis.metrics_requirements_met')} <span className="font-semibold">{fulfills}</span></div>
                  <div>{t('policy_analysis.metrics_critical_violations')} <span className={twFromTokens('font-semibold', colors.danger)}>{critical}</span></div>
                </>
              )
            })()}
          </div>

          {/* Evidence slot is handled by the parent component in PolicyAnalysis */}
        </aside>
      </div>
      <BrandBlock hasBackground showCopyrightText={false} showAndelaLogo={false} showPartnershipText={false} />
    </div>
  )
}

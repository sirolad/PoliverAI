import { CheckCircle2, FileText, AlertTriangle, BarChart, Lightbulb } from 'lucide-react'
import { Star, StarHalf, Star as StarEmpty } from 'phosphor-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, fontWeights, spacing, alignment } from '@/styles/styleTokens'
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
  <div data-view="full" id="report-full-view" className={twFromTokens(colors.surfaceMuted, spacing.card, 'rounded h-full min-h-0 overflow-auto w-full')}>
    <div className={twFromTokens(alignment.flexRow, alignment.itemsStart, alignment.justifyBetween, spacing.gridGapLarge)}>
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}><CheckCircle2 className={twFromTokens(spacing.iconsMd, colors.success)} />{t('policy_analysis.verdict_label')}</div>
          <div className={twFromTokens(spacing.tinyTop, alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
            <div className={twFromTokens(textSizes.md, fontWeights.semibold)}>{String(src['verdict'] ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => (c as string).toUpperCase())}</div>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('policy_analysis.confidence_label', { pct: String(Math.round(confidence * 100)) })}</div>
          </div>
        </div>

        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, spacing.gridGapLarge, 'mr-6')}>
            <div className={twFromTokens(textSizes.sm, colors.textMuted, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>{t('policy_analysis.score_label')}</div>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
              <div className={twFromTokens(alignment.flexRow, 'gap-1')}>
                {Array.from({ length: full }).map((_, i) => <Star key={`f-${i}`} size={18} weight="fill" className={twFromTokens(colors.warning)} />)}
                {half ? <StarHalf key="half" size={18} className={twFromTokens(colors.warning)} /> : null}
                {Array.from({ length: empty }).map((_, i) => <StarEmpty key={`e-${i}`} size={18} weight="duotone" className={twFromTokens(colors.textMuted)} />)}
              </div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{sc}%</div>
          </div>
        </div>
      </div>

      <div className={twFromTokens(spacing.sectionBlock, 'grid grid-cols-1 md:grid-cols-3', alignment.gap4)}>
        <div className="md:col-span-2">
          <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}><FileText className={twFromTokens(spacing.iconsMd, colors.textMuted)}/>{t('policy_analysis.summary_heading')}</div>
          <div className={twFromTokens(spacing.smallTop, textSizes.sm, colors.textPrimary, 'whitespace-pre-wrap')}>{String(src['summary'] ?? '')}</div>

          <div className={twFromTokens(spacing.sectionBlock)}>
            <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}><AlertTriangle className={twFromTokens(spacing.iconsMd, colors.danger)}/>{t('policy_analysis.top_findings')}</div>
            <div className={twFromTokens(spacing.tinyTop, 'space-y-3')}>
              {(() => {
                if ((findings || []).length === 0) return <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('policy_analysis.no_findings_detected')}</div>
                return (['high', 'medium', 'low'] as const).map((sev) => {
                  const items = (findings || []).filter((f) => String(f['severity']) === sev)
                  if (items.length === 0) return null
                  const bg = sev === 'high' ? colors.dangerBg : sev === 'medium' ? colors.warningBg : colors.successBg
                  const pill = sev === 'high' ? colors.danger : sev === 'medium' ? colors.warning : colors.success
                  return (
                    <div key={sev}>
                      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
                        <div className={twFromTokens(spacing.badgePadding, 'rounded', 'text-xs', fontWeights.semibold, colors.onPrimary, pill)}>{sev.toUpperCase()}</div>
                        <div className={twFromTokens('text-xs', colors.textMuted)}>{items.length} issue{items.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div className={twFromTokens(spacing.tinyTop, 'space-y-2')}>
                        {items.slice(0, 5).map((f, idx) => {
                          const article = f['article'] ?? ''
                          const issue = f['issue'] ?? ''
                          const conf = Number(f['confidence'] ?? 0)
                            return (
                            <div key={idx} className={twFromTokens(bg, spacing.cardDefault, 'rounded shadow')}>
                              <div className={twFromTokens(alignment.flexRow, 'items-start', alignment.gap3)}>
                                <div className={twFromTokens(spacing.cardCompact, colors.onPrimary, 'flex-shrink-0')}>
                                  <FileText className={twFromTokens(spacing.iconsMd, colors.onPrimary)} />
                                </div>
                                <div className={twFromTokens('flex-1 min-w-0')}>
                                  <div className={twFromTokens(fontWeights.semibold, textSizes.sm, colors.onPrimary, 'break-words')}>{String(article)}</div>
                                  <div className={twFromTokens(textSizes.sm, colors.onPrimary, spacing.tinyTop, 'break-words whitespace-pre-wrap')}>{String(issue)}</div>
                                  <div className={twFromTokens('text-xs', colors.onPrimary, spacing.tinyTop)}>{t('policy_analysis.confidence_label', { pct: String(Math.round(conf * 100)) })}</div>
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
            <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}><Lightbulb className={twFromTokens(spacing.iconsMd, colors.warning)} />Recommendations</div>
            <ul className={twFromTokens(spacing.tinyTop, 'list-disc list-inside', textSizes.sm, colors.textPrimary)}>
              {(() => {
                if ((recommendations || []).length === 0) return <li className="text-sm text-gray-500">{t('policy_analysis.no_recommendations')}</li>
                return (recommendations || []).map((r, i) => (
                  <li key={i}>{String(r['suggestion'] ?? JSON.stringify(r))} <span className={twFromTokens('text-xs', colors.textMuted)}>{`(${String(r['article'] ?? '')})`}</span></li>
                ))
              })()}
            </ul>
          </div>
        </div>

        <aside className="md:col-span-1">
          <div className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textSecondary, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}><BarChart className={twFromTokens(spacing.iconsMd, colors.primary)}/>Metrics</div>
          <div className={twFromTokens(spacing.tinyTop, 'space-y-2', textSizes.sm, colors.textPrimary)}>
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

// top controls presentational component
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'
import { twFromTokens, textSizes, baseFontSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'
import type { ComplianceResult } from '@/types/api'

type Props = {
  result?: ComplianceResult | null
  resetAll: () => void
  openSaveModal: () => void
  openInstructions: () => void
}

export default function TopControls({ result, resetAll, openSaveModal, openInstructions }: Props) {
  return (
    <div className={twFromTokens('w-full', alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween, spacing.headingMargin)}>
      <div>
  <h1 className={twFromTokens(baseFontSizes['2xl'], fontWeights.semibold)}>{t('policy_analysis.top_controls.title')}</h1>
  <p className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('policy_analysis.top_controls.subtitle')}</p>
        {result && (
          <div className={twFromTokens(spacing.smallTop, textSizes.sm, colors.textMuted)}>{t('policy_analysis.top_controls.summary', { verdict: result.verdict, score: String(result.score) })}</div>
        )}
      </div>

      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
  <Button variant="ghost" onClick={openInstructions}>{t('policy_analysis.top_controls.how_it_works')}</Button>
  <Button variant="outline" onClick={resetAll}>{t('policy_analysis.top_controls.reset')}</Button>
  <Button onClick={openSaveModal}>{t('policy_analysis.top_controls.save_report')}</Button>
      </div>
    </div>
  )
}

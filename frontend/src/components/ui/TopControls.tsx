// top controls presentational component
import { Button } from '@/components/ui/Button'
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
  <h1 className={twFromTokens(baseFontSizes['2xl'], fontWeights.semibold)}>{/* localized title */}Policy analysis</h1>
  <p className={twFromTokens(textSizes.sm, colors.textMuted)}>{/* localized subtitle */}Review and generate reports for uploaded policies.</p>
        {result && (
          <div className={twFromTokens(spacing.smallTop, textSizes.sm, colors.textMuted)}>{`Summary: ${result.verdict} — score ${result.score}`}</div>
        )}
      </div>

      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
        <Button variant="ghost" onClick={openInstructions}>How it works</Button>
        <Button variant="outline" onClick={resetAll}>Reset</Button>
        <Button onClick={openSaveModal}>Save report</Button>
      </div>
    </div>
  )
}

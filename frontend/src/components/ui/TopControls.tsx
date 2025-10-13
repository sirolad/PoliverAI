// top controls presentational component
import { Button } from '@/components/ui/Button'
import { twFromTokens, textSizes, baseFontSizes, fontWeights, colors } from '@/styles/styleTokens'
import type { ComplianceResult } from '@/types/api'

type Props = {
  result?: ComplianceResult | null
  resetAll: () => void
  openSaveModal: () => void
  openInstructions: () => void
}

export default function TopControls({ result, resetAll, openSaveModal, openInstructions }: Props) {
  return (
    <div className={twFromTokens('w-full flex items-center justify-between', 'mb-4')}>
      <div>
  <h1 className={twFromTokens(baseFontSizes['2xl'], fontWeights.semibold)}>{/* localized title */}Policy analysis</h1>
  <p className={twFromTokens(textSizes.sm, colors.textMuted)}>{/* localized subtitle */}Review and generate reports for uploaded policies.</p>
        {result && (
          <div className={twFromTokens('mt-2', textSizes.sm, colors.textMuted)}>{`Summary: ${result.verdict} — score ${result.score}`}</div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={openInstructions}>How it works</Button>
        <Button variant="outline" onClick={resetAll}>Reset</Button>
        <Button onClick={openSaveModal}>Save report</Button>
      </div>
    </div>
  )
}

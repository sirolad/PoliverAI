// top controls presentational component
import { Button } from '@/components/ui/Button'
import type { ComplianceResult } from '@/types/api'

type Props = {
  result?: ComplianceResult | null
  resetAll: () => void
  openSaveModal: () => void
  openInstructions: () => void
}

export default function TopControls({ result, resetAll, openSaveModal, openInstructions }: Props) {
  return (
    <div className="w-full flex items-center justify-between mb-4">
      <div>
  <h1 className="text-2xl font-semibold">{/* localized title */}Policy analysis</h1>
  <p className="text-sm text-muted-foreground">{/* localized subtitle */}Review and generate reports for uploaded policies.</p>
        {result && (
          <div className="mt-2 text-sm text-neutral-600">Summary: {result.verdict} — score {result.score}</div>
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

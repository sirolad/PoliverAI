import * as React from 'react'
import { XCircle } from 'lucide-react'
import { Button } from './Button'
import EnterCreditsModal from './EnterCreditsModal'
import PaymentsService from '@/services/payments'

export default function InsufficientCreditsModal({
  open,
  title = 'Insufficient Credits',
  message = 'You do not have enough credits to perform this action. Top up your credits to continue.',
  onClose,
}: {
  open: boolean
  title?: string
  message?: string
  onClose: () => void
}) {
  const [showEnter, setShowEnter] = React.useState(false)

  if (!open) return null

  const handleTopUp = () => {
    setShowEnter(true)
  }

  const handleConfirm = async (amount_usd: number) => {
    // Call PaymentsService to initiate buy credits flow
    await PaymentsService.purchaseCredits(amount_usd)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <div className="rounded-lg shadow-lg overflow-hidden border bg-white">
            <div className="p-4 flex items-center gap-3 border-b border-red-100">
              <div className="p-2 rounded-full bg-red-50 text-red-600">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="font-semibold text-sm">{title}</div>
                {message && <div className="text-sm text-muted-foreground">{message}</div>}
              </div>
            </div>
            <div className="p-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleTopUp}>
                Top-Up Credits
              </Button>
            </div>
          </div>
        </div>
      </div>
      <EnterCreditsModal open={showEnter} onClose={() => setShowEnter(false)} onConfirm={handleConfirm} />
    </>
  )
}

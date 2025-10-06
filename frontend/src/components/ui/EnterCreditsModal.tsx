import * as React from 'react'
import { Button } from './Button'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import { getInputClassName } from '@/lib/ui/inputHelpers'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (amount_usd: number) => Promise<void>
}

export default function EnterCreditsModal({ open, onClose, onConfirm }: Props) {
  const [amount, setAmount] = React.useState<string>('1.00')
  const [isProcessing, setIsProcessing] = React.useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    const v = parseFloat(amount)
    if (isNaN(v) || v <= 0) return
    setIsProcessing(true)
    try {
      await onConfirm(v)
      onClose()
    } catch {
      // Let caller show error via PaymentResult
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className={getModalBackdropClass()} onClick={onClose}></div>
  <div className={getModalContainerClass()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">Buy Credits</div>
          <IconButton onClick={onClose} aria-label="close"><X /></IconButton>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Enter the amount in USD to purchase credits (1 USD = 10 credits)</p>
          <div className="flex items-center gap-2">
            <input
              className={getInputClassName('border rounded px-3 py-2 w-full')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Buy'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

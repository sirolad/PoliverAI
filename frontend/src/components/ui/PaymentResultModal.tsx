import { Button } from './Button'
import MetaLine from './MetaLine'
import { getPaymentStatusClasses, renderPaymentStatusIcon } from '@/lib/paymentHelpers'

export default function PaymentResultModal({
  open,
  success,
  title,
  message,
  onClose,
}: {
  open: boolean
  success: boolean
  title: string
  message?: string
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <div className="rounded-lg shadow-lg overflow-hidden border bg-white">
          <div className={`p-4 flex items-center gap-3 ${getPaymentStatusClasses(success ? 'success' : 'error').border}`}>
            <div className={getPaymentStatusClasses(success ? 'success' : 'error').iconWrap}>
              {renderPaymentStatusIcon(success ? 'success' : 'error')}
            </div>
            <div>
              <div className="font-semibold text-sm">{title}</div>
              <MetaLine>{message}</MetaLine>
            </div>
          </div>
          <div className="p-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

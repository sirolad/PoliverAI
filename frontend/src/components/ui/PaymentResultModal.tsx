import { Button } from './Button'
import { t } from '@/i18n'
import MetaLine from './MetaLine'
import { getPaymentStatusClasses, renderPaymentStatusIcon } from '@/lib/paymentHelpers'
import { twFromTokens, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

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
        <div className={twFromTokens('rounded-lg shadow-lg overflow-hidden border', colors.surface)}>
          <div className={twFromTokens('p-4 flex items-center gap-3', getPaymentStatusClasses(success ? 'success' : 'error').border)}>
            <div className={getPaymentStatusClasses(success ? 'success' : 'error').iconWrap}>
              {renderPaymentStatusIcon(success ? 'success' : 'error')}
            </div>
            <div>
              <div className={twFromTokens(fontWeights.semibold, baseFontSizes.sm)}>{title}</div>
              <MetaLine>{message}</MetaLine>
            </div>
          </div>
          <div className="p-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('payment_result_modal.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

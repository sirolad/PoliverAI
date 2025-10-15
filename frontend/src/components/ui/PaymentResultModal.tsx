import { Button } from './Button'
import { t } from '@/i18n'
import MetaLine from './MetaLine'
import { getPaymentStatusClasses, renderPaymentStatusIcon } from '@/lib/paymentHelpers'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

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
    <div className={twFromTokens('fixed inset-0 z-50', alignment.justifyCenter, alignment.itemsStart, alignment.flex, spacing.modalPadding, 'pointer-events-none')}>
      <div className={twFromTokens(spacing.containerMaxMd, 'pointer-events-auto')}>
        <div className={twFromTokens('rounded-lg shadow-lg overflow-hidden border', colors.surface)}>
          <div className={twFromTokens(spacing.card, alignment.flexRow, alignment.itemsCenter, 'gap-3', getPaymentStatusClasses(success ? 'success' : 'error').border)}>
            <div className={getPaymentStatusClasses(success ? 'success' : 'error').iconWrap}>
              {renderPaymentStatusIcon(success ? 'success' : 'error')}
            </div>
            <div>
              <div className={twFromTokens(fontWeights.semibold, baseFontSizes.sm, spacing.mt3)}>{title}</div>
              <MetaLine>{message}</MetaLine>
            </div>
          </div>
          <div className={twFromTokens(spacing.card, alignment.flexRow, alignment.justifyEnd, 'gap-2')}>
            <Button variant="ghost" onClick={onClose}>
              {t('payment_result_modal.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
import { XCircle, CreditCard } from 'lucide-react'
import { Button } from './Button'
import MetaLine from './MetaLine'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'
import EnterCreditsModal from './EnterCreditsModal'
import PaymentsService from '@/services/payments'
import { t } from '@/i18n'

export default function InsufficientCreditsModal({
  open,
  title = t('insufficient_credits.default_title'),
  message = t('insufficient_credits.default_message'),
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
      <div className={twFromTokens('fixed inset-0 z-50', alignment.justifyCenter, alignment.itemsStart, spacing.modalPadding, 'pointer-events-none')}>
        <div className={twFromTokens(spacing.containerMaxMd, 'pointer-events-auto')}>
          <div className={twFromTokens('rounded-lg shadow-lg overflow-hidden border', colors.surface)}>
            <div className={twFromTokens(spacing.cardDefault, alignment.flexRow, alignment.itemsCenter, alignment.gap3, 'border-b', colors.dangerBg)}>
              <div className={twFromTokens('p-2 rounded-full', colors.danger)}>
                <XCircle className={twFromTokens(spacing.iconsMd)} />
              </div>
              <div>
                <div className={twFromTokens(fontWeights.semibold, baseFontSizes.sm)}>{title}</div>
                <MetaLine>{message}</MetaLine>
              </div>
            </div>
            <div className={twFromTokens(spacing.cardDefault, alignment.flexRow, alignment.justifyEnd, alignment.gap2)}>
              <Button variant="ghost" onClick={onClose}>
                {t('insufficient_credits.close')}
              </Button>
              <Button onClick={handleTopUp} icon={<CreditCard className={twFromTokens(spacing.iconsXs)} />}>
                {t('insufficient_credits.top_up')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <EnterCreditsModal open={showEnter} onClose={() => setShowEnter(false)} onConfirm={handleConfirm} />
    </>
  )
}

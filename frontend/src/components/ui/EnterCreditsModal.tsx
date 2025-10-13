import * as React from 'react'
import { Button } from './Button'
import { X, CreditCard } from 'lucide-react'
import IconButton from './IconButton'
import { getInputClassName } from '@/lib/ui/inputHelpers'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import MetaLine from './MetaLine'
import { t } from '@/i18n'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (amount_usd: number) => Promise<void>
  icon?: React.ReactNode
}

export default function EnterCreditsModal({ open, onClose, onConfirm, icon }: Props) {
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
    <div className={twFromTokens('fixed inset-0 z-50', spacing.fullScreenCenter)}>
      <div className={getModalBackdropClass()} onClick={onClose}></div>
      <div className={getModalContainerClass()}>
        <div className={twFromTokens(spacing.modalPadding, 'border-b', alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
            {/** optional icon shown left of title */}
            {typeof icon !== 'undefined' ? <div className={twFromTokens(colors.textSecondary)}>{icon}</div> : null}
            <div className={twFromTokens(baseFontSizes.lg, fontWeights.semibold)}>{t('enter_credits_modal.title')}</div>
          </div>
          <IconButton onClick={onClose} aria-label={t('enter_credits_modal.close_aria')}><X /></IconButton>
        </div>
        <div className={twFromTokens(spacing.modalPadding)}>
          <p className={twFromTokens(baseFontSizes.sm, colors.textMuted, spacing.smallTop)}>{t('enter_credits_modal.description')}</p>
          <MetaLine>{t('enter_credits_modal.meta')}</MetaLine>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
            <input
              className={getInputClassName(twFromTokens(spacing.input))}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
            <Button onClick={handleConfirm} disabled={isProcessing} icon={<CreditCard className={twFromTokens(spacing.iconsXs, colors.onPrimary)} />}>
              {isProcessing ? t('enter_credits_modal.processing') : t('enter_credits_modal.buy')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

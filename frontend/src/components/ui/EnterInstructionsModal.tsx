import * as React from 'react'
import { Button } from './Button'
import IconButton from './IconButton'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { X, Bot } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  open: boolean
  initial?: string
  onClose: () => void
  onConfirm: (instructions: string) => Promise<void>
}

export default function EnterInstructionsModal({ open, initial = '', onClose, onConfirm }: Props) {
  const [instructions, setInstructions] = React.useState<string>(initial)
  const [isProcessing, setIsProcessing] = React.useState(false)

  React.useEffect(() => {
    setInstructions(initial)
  }, [initial])

  if (!open) return null

  const handleConfirm = async () => {
    const v = (instructions || '').trim()
    // allow empty value (client will treat empty as use default guidance)
    setIsProcessing(true)
    try {
      await onConfirm(v)
      onClose()
    } catch {
      // let caller handle errors
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
            <div className={twFromTokens(spacing.iconWrapperCompact, 'rounded-full', 'bg-purple-50', 'text-purple-600')}>
              <Bot className={twFromTokens(spacing.iconsMd, baseFontSizes.sm)} />
            </div>
            <div>
              <div className={twFromTokens(baseFontSizes.lg, fontWeights.semibold)}>{t('enter_instructions_modal.title')}</div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('enter_instructions_modal.subtitle')}</div>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('enter_instructions_modal.close_aria')}><X /></IconButton>
        </div>
        <div className={twFromTokens(spacing.modalPadding)}>
          <p className={twFromTokens(textSizes.sm, colors.textMuted, spacing.smallTop)}>{t('enter_instructions_modal.description')}</p>
          <div className={twFromTokens(alignment.flexCol, alignment.gap3)}>
            <textarea
              className={twFromTokens(spacing.input, 'h-40', 'resize-y')}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('enter_instructions_modal.placeholder')}
            />
            <div className={twFromTokens(alignment.flexRow, alignment.justifyEnd)}>
              <Button onClick={handleConfirm} disabled={isProcessing} icon={<Bot className={twFromTokens(spacing.iconsXs, colors.onPrimary)} />} iconColor="text-white">
                {isProcessing ? t('enter_instructions_modal.generating') : t('enter_instructions_modal.generate')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

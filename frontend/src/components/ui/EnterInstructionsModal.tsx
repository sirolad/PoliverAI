import * as React from 'react'
import { Button } from './Button'
import IconButton from './IconButton'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { X, Bot } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={getModalBackdropClass()} onClick={onClose}></div>
      <div className={getModalContainerClass()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={twFromTokens('p-2 rounded-full', 'bg-purple-50', 'text-purple-600')}>
              <Bot className={twFromTokens('h-5 w-5', baseFontSizes.sm)} />
            </div>
            <div>
              <div className={twFromTokens(baseFontSizes.lg, fontWeights.semibold)}>{t('enter_instructions_modal.title')}</div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('enter_instructions_modal.subtitle')}</div>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('enter_instructions_modal.close_aria')}><X /></IconButton>
        </div>
        <div className="p-4">
          <p className={twFromTokens(textSizes.sm, colors.textMuted, 'mb-4')}>{t('enter_instructions_modal.description')}</p>
          <div className="flex flex-col gap-3">
            <textarea
              className="border rounded px-3 py-2 w-full h-40 resize-y"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('enter_instructions_modal.placeholder')}
            />
            <div className="flex justify-end">
              <Button onClick={handleConfirm} disabled={isProcessing} icon={<Bot className={twFromTokens('h-4 w-4', colors.onPrimary)} />} iconColor="text-white">
                {isProcessing ? t('enter_instructions_modal.generating') : t('enter_instructions_modal.generate')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import * as React from 'react'
import { Button } from './Button'
import { X, Trash2 } from 'lucide-react'
import IconButton from './IconButton'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { getDangerButtonClass, getConfirmDeleteLabel } from '@/lib/ui/confirmHelpers'
import MetaLine from './MetaLine'
import { t } from '@/i18n'
import { twFromTokens, baseFontSizes, fontWeights, colors } from '@/styles/styleTokens'

type Props = {
  open: boolean
  filename?: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
  icon?: React.ReactNode
}

export default function ConfirmDeleteModal({ open, filename, onClose, onConfirm, icon }: Props) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  if (!open) return null

  const handleYes = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // caller may display error
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
            {typeof icon !== 'undefined' ? <div className={twFromTokens(colors.textSecondary)}>{icon}</div> : null}
            <div>
              <div className={twFromTokens(baseFontSizes.lg, fontWeights.semibold)}>{t('confirm_delete_modal.title')}</div>
              <MetaLine>{t('confirm_delete_modal.warning')}</MetaLine>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('confirm_delete_modal.close')}><X /></IconButton>
        </div>
        <div className="p-4">
          <p className={twFromTokens(baseFontSizes.sm, colors.textSecondary, 'mb-4')}>{t('confirm_delete_modal.question', { filename: filename ?? '' })}</p>
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={onClose} disabled={isProcessing}>{t('confirm_delete_modal.close')}</Button>
            <Button onClick={handleYes} disabled={isProcessing} className={getDangerButtonClass()} icon={<Trash2 className={twFromTokens('h-4 w-4', colors.onPrimary)} />} iconColor="text-white">{getConfirmDeleteLabel(isProcessing)}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

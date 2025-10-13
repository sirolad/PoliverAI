import * as React from 'react'
import { Button } from './Button'
import { X, Trash2 } from 'lucide-react'
import IconButton from './IconButton'
import FileList from './FileList'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { getDangerButtonClass, getConfirmDeleteLabel } from '@/lib/ui/confirmHelpers'
import MetaLine from './MetaLine'
import { twFromTokens, textSizes, fontWeights, colors, baseFontSizes, spacing, alignment } from '@/styles/styleTokens'
import { t } from '@/i18n'

type Props = {
  open: boolean
  filenames: string[]
  onClose: () => void
  onConfirm: () => Promise<void>
  icon?: React.ReactNode
}

export default function ConfirmBulkDeleteModal({ open, filenames, onClose, onConfirm, icon }: Props) {
  const [isProcessing, setIsProcessing] = React.useState(false)

  if (!open) return null

  const handleYes = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // caller shows error
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={twFromTokens('fixed inset-0 z-50', spacing.fullScreenCenter)}>
      <div className={getModalBackdropClass()} onClick={onClose}></div>
      <div className={getModalContainerClass().replace('max-w-md', 'max-w-lg')}>
        <div className={twFromTokens(spacing.modalPadding, 'border-b', alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
            {typeof icon !== 'undefined' ? <div className={twFromTokens(colors.textSecondary)}>{icon}</div> : null}
            <div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{filenames.length === 1 ? t('confirm_bulk_delete_modal.title_single') : t('confirm_bulk_delete_modal.title_many')}</div>
              <MetaLine>{filenames.length === 1 ? t('confirm_bulk_delete_modal.meta_single') : t('confirm_bulk_delete_modal.meta_many')}</MetaLine>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('confirm_bulk_delete_modal.close')}><X /></IconButton>
        </div>
        <div className={twFromTokens(spacing.modalPadding)}>
          {filenames.length === 1 ? (
            <>
              <p className={twFromTokens(textSizes.sm, colors.textSecondary, spacing.smallTop)}>{t('confirm_bulk_delete_modal.question_single', { filename: filenames[0] })}</p>
              <div className={twFromTokens(baseFontSizes.sm, colors.surfaceMuted, colors.mutedBorder, spacing.smallTop, 'rounded', 'p-2', 'truncate', 'border')}>{filenames[0]}</div>
            </>
          ) : (
            <>
              <p className={twFromTokens(textSizes.sm, colors.textSecondary, spacing.smallTop)}>{t('confirm_bulk_delete_modal.question_many', { count: filenames.length })}</p>
              <div className={twFromTokens(baseFontSizes.sm, colors.surfaceMuted, colors.mutedBorder, 'max-h-40 overflow-auto', spacing.smallTop, 'rounded', 'p-2', 'border')}>
                <FileList items={filenames.slice(0, 50).map((n) => ({ name: n }))} onOpen={() => {}} />
                <MetaLine>{t('confirm_bulk_delete_modal.showing_first', { count: 50, total: filenames.length })}</MetaLine>
              </div>
            </>
          )}
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, alignment.justifyEnd)}>
            <Button onClick={onClose} disabled={isProcessing}>Close</Button>
            <Button onClick={handleYes} disabled={isProcessing} className={getDangerButtonClass()} icon={<Trash2 className={twFromTokens(spacing.iconsXs)} />} iconColor="text-white">{getConfirmDeleteLabel(isProcessing)}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

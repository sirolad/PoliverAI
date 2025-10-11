import * as React from 'react'
import { Button } from './Button'
import { X, Trash2 } from 'lucide-react'
import IconButton from './IconButton'
import FileList from './FileList'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { getDangerButtonClass, getConfirmDeleteLabel } from '@/lib/ui/confirmHelpers'
import MetaLine from './MetaLine'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={getModalBackdropClass()} onClick={onClose}></div>
      <div className={getModalContainerClass().replace('max-w-md', 'max-w-lg')}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            {typeof icon !== 'undefined' ? <div className="text-gray-700">{icon}</div> : null}
            <div>
              <div className="text-lg font-semibold">{filenames.length === 1 ? t('confirm_bulk_delete_modal.title_single') : t('confirm_bulk_delete_modal.title_many')}</div>
              <MetaLine>{filenames.length === 1 ? t('confirm_bulk_delete_modal.meta_single') : t('confirm_bulk_delete_modal.meta_many')}</MetaLine>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label={t('confirm_bulk_delete_modal.close')}><X /></IconButton>
        </div>
        <div className="p-4">
          {filenames.length === 1 ? (
            <>
              <p className="text-sm text-gray-700 mb-4">{t('confirm_bulk_delete_modal.question_single', { filename: filenames[0] })}</p>
              <div className="mb-4 border rounded p-2 text-sm bg-gray-50 truncate">{filenames[0]}</div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-4">{t('confirm_bulk_delete_modal.question_many', { count: filenames.length })}</p>
              <div className="max-h-40 overflow-auto mb-4 border rounded p-2 text-sm bg-gray-50">
                <FileList items={filenames.slice(0, 50).map((n) => ({ name: n }))} onOpen={() => {}} />
                <MetaLine>{t('confirm_bulk_delete_modal.showing_first', { count: 50, total: filenames.length })}</MetaLine>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={onClose} disabled={isProcessing}>Close</Button>
            <Button onClick={handleYes} disabled={isProcessing} className={getDangerButtonClass()} icon={<Trash2 className="h-4 w-4" />} iconColor="text-white">{getConfirmDeleteLabel(isProcessing)}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

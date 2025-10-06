import * as React from 'react'
import { Button } from './Button'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import FileList from './FileList'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { getDangerButtonClass, getConfirmDeleteLabel } from '@/lib/ui/confirmHelpers'
import MetaLine from './MetaLine'

type Props = {
  open: boolean
  filenames: string[]
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function ConfirmBulkDeleteModal({ open, filenames, onClose, onConfirm }: Props) {
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
          <div className="text-lg font-semibold">{filenames.length === 1 ? 'Confirm Delete' : 'Confirm Bulk Delete'}</div>
          <IconButton onClick={onClose} aria-label="close"><X /></IconButton>
        </div>
        <div className="p-4">
          {filenames.length === 1 ? (
            <>
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete the report <span className="font-medium">{filenames[0]}</span>? This action cannot be undone.</p>
              <div className="mb-4 border rounded p-2 text-sm bg-gray-50 truncate">{filenames[0]}</div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete the following {filenames.length} reports? This action cannot be undone.</p>
              <div className="max-h-40 overflow-auto mb-4 border rounded p-2 text-sm bg-gray-50">
                <FileList items={filenames.slice(0, 50).map((n) => ({ name: n }))} onOpen={() => {}} />
                <MetaLine>Showing first 50 of {filenames.length}</MetaLine>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={onClose} disabled={isProcessing}>Close</Button>
            <Button onClick={handleYes} disabled={isProcessing} className={getDangerButtonClass()}>{getConfirmDeleteLabel(isProcessing)}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

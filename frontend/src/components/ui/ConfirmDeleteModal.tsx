import * as React from 'react'
import { Button } from './Button'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { getDangerButtonClass, getConfirmDeleteLabel } from '@/lib/ui/confirmHelpers'

type Props = {
  open: boolean
  filename?: string | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function ConfirmDeleteModal({ open, filename, onClose, onConfirm }: Props) {
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
          <div className="text-lg font-semibold">Confirm Delete</div>
          <IconButton onClick={onClose} aria-label="close"><X /></IconButton>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete <span className="font-medium">{filename}</span>? This action cannot be undone.</p>
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={onClose} disabled={isProcessing}>Close</Button>
            <Button onClick={handleYes} disabled={isProcessing} className={getDangerButtonClass()}>{getConfirmDeleteLabel(isProcessing)}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

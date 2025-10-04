import * as React from 'react'
import { Button } from './Button'
import { X } from 'lucide-react'

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">Confirm Bulk Delete</div>
          <button className="p-2" onClick={onClose}><X /></button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700 mb-4">Are you sure you want to delete the following {filenames.length} reports? This action cannot be undone.</p>
          <div className="max-h-40 overflow-auto mb-4 border rounded p-2 text-sm bg-gray-50">
            <ul className="list-disc pl-5 space-y-1">
              {filenames.slice(0, 50).map((f) => (<li key={f} className="truncate">{f}</li>))}
            </ul>
            {filenames.length > 50 ? <div className="text-xs text-gray-500 mt-2">Showing first 50 of {filenames.length}</div> : null}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button onClick={onClose} disabled={isProcessing}>Close</Button>
            <Button onClick={handleYes} disabled={isProcessing} className="bg-red-600 text-white">{isProcessing ? 'Deleting...' : 'Yes, Delete'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

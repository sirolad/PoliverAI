import * as React from 'react'
import { Button } from './Button'
import IconButton from './IconButton'
import { getInputClassName } from '@/lib/ui/inputHelpers'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  initial?: string
  onClose: () => void
  onConfirm: (title: string) => Promise<void>
}

export default function EnterTitleModal({ open, initial = '', onClose, onConfirm }: Props) {
  const [title, setTitle] = React.useState<string>(initial)
  const [isProcessing, setIsProcessing] = React.useState(false)

  React.useEffect(() => {
    setTitle(initial)
  }, [initial])

  if (!open) return null

  const handleConfirm = async () => {
    const v = (title || '').trim()
    if (!v) return
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
          <div className="text-lg font-semibold">Save Report</div>
          <IconButton onClick={onClose} aria-label="close"><X /></IconButton>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Enter a title for the report. This will be shown in your Reports list.</p>
          <div className="flex items-center gap-2">
            <input
              className={getInputClassName('border rounded px-3 py-2 w-full')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              placeholder="Document title"
            />
            <Button onClick={handleConfirm} disabled={isProcessing || !title.trim()}>
              {isProcessing ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

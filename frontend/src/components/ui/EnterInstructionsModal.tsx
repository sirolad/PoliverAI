import * as React from 'react'
import { Button } from './Button'
import IconButton from './IconButton'
import { getModalBackdropClass, getModalContainerClass } from '@/lib/ui/modalHelpers'
import { X, Bot } from 'lucide-react'

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
            <div className="p-2 rounded-full bg-purple-50 text-purple-600">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">Revised Policy Instructions</div>
              <div className="text-sm text-gray-600">Optional guidance to customize how the policy is revised</div>
            </div>
          </div>
          <IconButton onClick={onClose} aria-label="close"><X /></IconButton>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Provide optional natural-language instructions to guide how the policy should be revised (tone, scope, sections to prioritize, etc.). Leave empty to use default guidance.</p>
          <div className="flex flex-col gap-3">
            <textarea
              className="border rounded px-3 py-2 w-full h-40 resize-y"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g. keep language plain-English, focus on cookie consent section, use bullet lists"
            />
            <div className="flex justify-end">
              <Button onClick={handleConfirm} disabled={isProcessing} icon={<Bot className="h-4 w-4" />} iconColor="text-white">
                {isProcessing ? 'Generating...' : 'Generate Revised Policy'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

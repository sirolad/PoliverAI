import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from './Button'

export default function PaymentResultModal({
  open,
  success,
  title,
  message,
  onClose,
}: {
  open: boolean
  success: boolean
  title: string
  message?: string
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <div className="rounded-lg shadow-lg overflow-hidden border bg-white">
          <div className={`p-4 flex items-center gap-3 ${success ? 'border-b border-green-100' : 'border-b border-red-100'}`}>
            <div className={`p-2 rounded-full ${success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {success ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <div className="font-semibold text-sm">{title}</div>
              {message && <div className="text-sm text-muted-foreground">{message}</div>}
            </div>
          </div>
          <div className="p-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

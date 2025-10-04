import * as React from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from './Button'

type State = {
  open: boolean
  status: string
  title: string
  message?: string
}

const PaymentResultContext = React.createContext<{
  show: (status: string, title: string, message?: string) => void
} | null>(null)

export function PaymentResultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>({ open: false, status: 'success', title: '', message: '' })

  const show = (status: string, title: string, message?: string) => {
    setState({ open: true, status, title, message })
    // Auto-close after 3 seconds
    setTimeout(() => {
      setState((s) => ({ ...s, open: false }))
    }, 3000)
  }

  return (
    <PaymentResultContext.Provider value={{ show }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto">
            <div className="rounded-lg shadow-lg overflow-hidden border bg-white">
              <div className={`p-4 flex items-center gap-3 ${state.status === 'success' ? 'border-b border-green-100' : state.status === 'pending' ? 'border-b border-yellow-100' : 'border-b border-red-100'}`}>
                <div className={`p-2 rounded-full ${state.status === 'success' ? 'bg-green-50 text-green-600' : state.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                  {state.status === 'success' ? <CheckCircle2 className="h-6 w-6" /> : state.status === 'pending' ? <AlertTriangle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{state.title}</div>
                  {state.message && <div className="text-sm text-muted-foreground">{state.message}</div>}
                </div>
              </div>
              <div className="p-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setState((s) => ({ ...s, open: false }))}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PaymentResultContext.Provider>
  )
}

export { PaymentResultContext }
export default PaymentResultProvider

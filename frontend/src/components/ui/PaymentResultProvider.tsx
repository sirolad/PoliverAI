import * as React from 'react'
import { Button } from './Button'
import { t } from '@/i18n'
import MetaLine from './MetaLine'
import { getPaymentStatusClasses, renderPaymentStatusIcon } from '@/lib/paymentHelpers'
import type { PaymentStatus } from '@/lib/paymentHelpers'

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

  const show = (status: PaymentStatus, title: string, message?: string) => {
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
              <div className={`p-4 flex items-center gap-3 ${getPaymentStatusClasses(state.status).border}`}>
                <div className={getPaymentStatusClasses(state.status).iconWrap}>
                  {renderPaymentStatusIcon(state.status)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{state.title}</div>
                    <MetaLine>{state.message}</MetaLine>
                </div>
              </div>
              <div className="p-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setState((s) => ({ ...s, open: false }))}>
                  {t('payment_result.close')}
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

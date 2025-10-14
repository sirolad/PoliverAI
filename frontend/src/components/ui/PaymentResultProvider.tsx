import * as React from 'react'
import { Button } from './Button'
import { t } from '@/i18n'
import MetaLine from './MetaLine'
import { getPaymentStatusClasses, renderPaymentStatusIcon } from '@/lib/paymentHelpers'
import type { PaymentStatus } from '@/lib/paymentHelpers'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

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
        <div className={twFromTokens('fixed inset-0 z-50', alignment.justifyCenter, alignment.itemsStart, alignment.flex, spacing.modalPadding, 'pointer-events-none')}>
          <div className={twFromTokens(spacing.containerMaxMd, 'pointer-events-auto')}> 
            <div className={twFromTokens('rounded-lg shadow-lg overflow-hidden border', colors.surface)}>
              <div className={twFromTokens(spacing.card, alignment.flexRow, alignment.itemsCenter, 'gap-3', getPaymentStatusClasses(state.status).border)}>
                <div className={getPaymentStatusClasses(state.status).iconWrap}>
                  {renderPaymentStatusIcon(state.status)}
                </div>
                <div>
                  <div className={twFromTokens(fontWeights.semibold, baseFontSizes.sm, spacing.mt3)}>{state.title}</div>
                    <MetaLine>{state.message}</MetaLine>
                </div>
              </div>
              <div className={twFromTokens(spacing.card, alignment.flexRow, alignment.justifyEnd, 'gap-2')}>
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

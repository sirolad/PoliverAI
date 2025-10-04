import * as React from 'react'
import { PaymentResultContext } from './PaymentResultProvider'

export function usePaymentResult() {
  const ctx = React.useContext(PaymentResultContext)
  if (!ctx) throw new Error('usePaymentResult must be used within PaymentResultProvider')
  return ctx
}

export default usePaymentResult

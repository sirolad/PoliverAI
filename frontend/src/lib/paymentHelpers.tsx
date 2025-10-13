import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { twFromTokens, colors } from '@/styles/styleTokens'

export type PaymentStatus = 'success' | 'pending' | 'error' | string

export function getPaymentStatusClasses(status: PaymentStatus) {
  if (status === 'success') {
    return {
      border: twFromTokens('border-b', colors.successBg),
      iconWrap: twFromTokens('p-2 rounded-full', colors.successBg, colors.success),
    }
  }
  if (status === 'pending') {
    return {
      border: twFromTokens('border-b', colors.warningBg),
      iconWrap: twFromTokens('p-2 rounded-full', colors.warningBg, colors.warning),
    }
  }
  // default/error
  return {
    border: twFromTokens('border-b', colors.dangerBg),
    iconWrap: twFromTokens('p-2 rounded-full', colors.dangerBg, colors.danger),
  }
}

export function renderPaymentStatusIcon(status: PaymentStatus) {
  if (status === 'success') return <CheckCircle2 className={twFromTokens('h-6 w-6', colors.success)} />
  if (status === 'pending') return <AlertTriangle className={twFromTokens('h-6 w-6', colors.warning)} />
  return <XCircle className={twFromTokens('h-6 w-6', colors.danger)} />
}

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { twFromTokens, colors, spacing } from '@/styles/styleTokens'

export type PaymentStatus = 'success' | 'pending' | 'error' | string

export function getPaymentStatusClasses(status: PaymentStatus) {
  if (status === 'success') {
    return {
      border: twFromTokens('border-b', colors.successBg),
      iconWrap: twFromTokens('rounded-full', spacing.iconWrapperCompact, colors.successBg, colors.success),
    }
  }
  if (status === 'pending') {
    return {
      border: twFromTokens('border-b', colors.warningBg),
      iconWrap: twFromTokens('rounded-full', spacing.iconWrapperCompact, colors.warningBg, colors.warning),
    }
  }
  // default/error
  return {
    border: twFromTokens('border-b', colors.dangerBg),
    iconWrap: twFromTokens('rounded-full', spacing.iconWrapperCompact, colors.dangerBg, colors.danger),
  }
}

export function renderPaymentStatusIcon(status: PaymentStatus) {
  if (status === 'success') return <CheckCircle2 className={twFromTokens(spacing.iconsMd, colors.success)} />
  if (status === 'pending') return <AlertTriangle className={twFromTokens(spacing.iconsMd, colors.warning)} />
  return <XCircle className={twFromTokens(spacing.iconsMd, colors.danger)} />
}

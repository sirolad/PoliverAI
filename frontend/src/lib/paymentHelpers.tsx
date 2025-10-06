import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export type PaymentStatus = 'success' | 'pending' | 'error' | string

export function getPaymentStatusClasses(status: PaymentStatus) {
  if (status === 'success') {
    return {
      border: 'border-b border-green-100',
      iconWrap: 'p-2 rounded-full bg-green-50 text-green-600',
    }
  }
  if (status === 'pending') {
    return {
      border: 'border-b border-yellow-100',
      iconWrap: 'p-2 rounded-full bg-yellow-50 text-yellow-600',
    }
  }
  // default/error
  return {
    border: 'border-b border-red-100',
    iconWrap: 'p-2 rounded-full bg-red-50 text-red-600',
  }
}

export function renderPaymentStatusIcon(status: PaymentStatus) {
  if (status === 'success') return <CheckCircle2 className="h-6 w-6" />
  if (status === 'pending') return <AlertTriangle className="h-6 w-6" />
  return <XCircle className="h-6 w-6" />
}

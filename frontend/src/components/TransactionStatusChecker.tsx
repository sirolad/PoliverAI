import useTransactionStatusChecker from '@/hooks/useTransactionStatusChecker'
import usePaymentResult from '@/components/ui/PaymentResultHook'

type Props = {
  sessionId?: string | null
  fetchTx: () => Promise<void>
  refreshUser?: () => Promise<void>
}

export default function TransactionStatusChecker({ sessionId, fetchTx, refreshUser }: Props) {
  const { checkTransaction } = useTransactionStatusChecker()
  const paymentResult = usePaymentResult()

  return (
    <div className="mt-0 sm:mt-2 ml-2 sm:ml-0">
      <button className="text-sm text-blue-600 underline" onClick={async () => {
        await checkTransaction(sessionId, paymentResult, fetchTx, refreshUser)
      }}>{'Check status'}</button>
    </div>
  )
}

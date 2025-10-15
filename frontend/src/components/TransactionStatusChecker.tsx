import useTransactionStatusChecker from '@/hooks/useTransactionStatusChecker'
import usePaymentResult from '@/components/ui/PaymentResultHook'
import { textSizes, colors, twFromTokens, spacing, alignment, hoverFromColor } from '@/styles/styleTokens'

type Props = {
  sessionId?: string | null
  fetchTx: () => Promise<void>
  refreshUser?: () => Promise<void>
}

export default function TransactionStatusChecker({ sessionId, fetchTx, refreshUser }: Props) {
  const { checkTransaction } = useTransactionStatusChecker()
  const paymentResult = usePaymentResult()

  return (
    <div className={twFromTokens(spacing.formContainer, alignment.center)}>
      <button
        className={twFromTokens(textSizes.sm, colors.primary, hoverFromColor(colors.primary), 'underline')}
        onClick={async () => {
          await checkTransaction(sessionId, paymentResult, fetchTx, refreshUser)
        }}
      >
        {'Check status'}
      </button>
    </div>
  )
}

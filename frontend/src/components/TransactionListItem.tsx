import type { Transaction } from '@/services/transactions'
import type { TransactionStatus } from '@/types/transaction'
import TransactionCard from '@/components/ui/TransactionCard'
import MetaLine from '@/components/ui/MetaLine'
import TransactionStatusChecker from '@/components/TransactionStatusChecker'
import { t } from '@/i18n'

type Props = {
  tx: Transaction
  st: TransactionStatus
  fetchTx: () => Promise<void>
  refreshUser?: () => Promise<void>
}

export default function TransactionListItem({ tx, st, fetchTx, refreshUser }: Props) {
  const badge = tx.failure_code ? failureBadge(tx.failure_code, tx.failure_message) : statusBadge(st)

  function statusBadge(status: TransactionStatus) {
    switch (status) {
      case 'pending':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{t('credits.status_pending')}</span>
      case 'success':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">{t('credits.status_success')}</span>
      case 'failed':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">{t('credits.status_failed')}</span>
      default:
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">{status}</span>
    }
  }

  function failureBadge(failure_code?: string | null, failure_message?: string | null) {
    if (!failure_code) return null
    const map: Record<string, string> = {
      'card_declined': t('credits.failure.card_declined'),
      'insufficient_funds': t('credits.failure.insufficient_funds'),
      'lost_card': t('credits.failure.lost_card'),
      'stolen_card': t('credits.failure.stolen_card'),
      'expired_card': t('credits.failure.expired_card'),
      'incorrect_cvc': t('credits.failure.incorrect_cvc'),
      'processing_error': t('credits.failure.processing_error'),
      'incorrect_number': t('credits.failure.incorrect_number'),
      'card_velocity_exceeded': t('credits.failure.card_velocity_exceeded'),
    }
    const label = map[failure_code] || failure_code
    return (
      <div className="mt-2">
        <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-50 text-red-700">{label}</span>
        <MetaLine>{failure_message}</MetaLine>
      </div>
    )
  }

  const formatDescription = (txLocal: Transaction, statusLocal: TransactionStatus) => {
    const raw = (txLocal.description || txLocal.event_type || 'Payment').toString()
    if (txLocal.failure_code) return raw
    const failureMsg = (txLocal.failure_message || '').toString().toLowerCase()
    if (failureMsg.includes('fail') || failureMsg.includes('error') || failureMsg.includes('declin')) return raw

    const rawLower = raw.toString().toLowerCase()
    const etLower = (txLocal.event_type || '').toString().toLowerCase()
    const isCompleted = (txLocal.status || '').toString().toLowerCase() === 'completed'
      || statusLocal === 'success'
      || rawLower.includes('completed')
      || etLower.includes('completed')
    if (!isCompleted) return raw

    return raw.replace(/(\d{1,3}(?:\.\d+)?)\s*(?:%|percent\b)/gi, '100%')
  }

  const et = (tx.event_type || '').toString().toLowerCase()
  const amt = typeof tx.amount_usd === 'number' ? tx.amount_usd : 0
  const credits = typeof tx.credits === 'number' ? tx.credits : 0
  const positiveEvents = ['manual_credit', 'checkout_session_completed', 'credit', 'subscription', 'subscription_update', 'tier_update']
  const isPositive = positiveEvents.some((p) => et.includes(p)) || amt > 0 || credits > 0
  const negativeEvents = ['charge', 'analysis', 'charge_ingest', 'charge_report', 'ingest', 'report']
  const isNegative = negativeEvents.some((n) => et.includes(n)) || amt < 0 || credits < 0

  // label color for the small email/session badges
  let labelColor = 'text-gray-600'
  if (tx.failure_code) labelColor = 'text-red-600'
  else if (st === 'insufficient_funds') labelColor = 'text-yellow-600'
  else if (st === 'failed') labelColor = 'text-red-600'

  return (
    <div key={tx.id} className="p-4 border rounded bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-end sm:justify-between gap-4">
            <TransactionCard
              description={formatDescription(tx, st)}
              date={tx.timestamp ? new Date(tx.timestamp).toLocaleString() : undefined}
              labels={(
                <div className={`text-xs inline-flex text-xs leading-4 align-middle ${labelColor}`}>
                  {tx.user_email ? (
                    <span className={`px-2 py-1 border ${tx.failure_code ? 'bg-red-50 text-red-700 border-red-200' : st === 'insufficient_funds' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-l-sm truncate max-w-xs`}>
                      {tx.user_email}
                    </span>
                  ) : null}
                  {tx.session_id ? (
                    <span className={`px-2 py-1 border border-l-0 ${tx.failure_code ? 'bg-red-50 text-red-700 border-red-200' : st === 'insufficient_funds' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-r-sm truncate max-w-[20ch]`}>{tx.session_id}</span>
                  ) : null}
                </div>
              )}
              badge={badge}
            />
          </div>
        </div>

        <div className="w-full flex flex-row items-center justify-end gap-3 text-right sm:flex-col sm:items-end sm:justify-start">
          {badge ? <div className="flex-shrink-0 ml-2">{badge}</div> : null}
          <div className="font-semibold">{tx.credits ?? 0} credits</div>
          <div className="text-sm">
            {(() => {
              if (credits === 0 && (!amt || amt === 0)) {
                return <span className="text-yellow-600 font-medium">${Math.abs(amt).toFixed(2)}</span>
              }
              if (isNegative && !isPositive) {
                return <span className="text-red-600 font-medium">−${Math.abs(amt).toFixed(2)}</span>
              }
              return <span className="text-green-600 font-medium">+${Math.abs(amt).toFixed(2)}</span>
            })()}
          </div>

          {tx.session_id && (
            <TransactionStatusChecker sessionId={tx.session_id} fetchTx={fetchTx} refreshUser={refreshUser} />
          )}
        </div>
      </div>
      {tx.failure_code ? (
        <div className="mt-2">{failureBadge(tx.failure_code, tx.failure_message)}</div>
      ) : null}
    </div>
  )
}

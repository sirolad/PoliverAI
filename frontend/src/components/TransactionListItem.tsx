import type { Transaction } from '@/services/transactions'
import type { TransactionStatus } from '@/types/transaction'
import TransactionCard from '@/components/ui/TransactionCard'
import MetaLine from '@/components/ui/MetaLine'
import TransactionStatusChecker from '@/components/TransactionStatusChecker'
import { t } from '@/i18n'
import { textSizes, baseFontSizes, fontWeights, colors, twFromTokens, spacing, alignment } from '@/styles/styleTokens'

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
        return <span className={twFromTokens('inline-block', baseFontSizes.xs, spacing.badgePadding, 'rounded-full', colors.warningBg, colors.warning)}>{t('credits.status_pending')}</span>
      case 'success':
        return <span className={twFromTokens('inline-block', baseFontSizes.xs, spacing.badgePadding, 'rounded-full', colors.successBg, colors.success)}>{t('credits.status_success')}</span>
      case 'failed':
        return <span className={twFromTokens('inline-block', baseFontSizes.xs, spacing.badgePadding, 'rounded-full', colors.dangerBg, colors.danger)}>{t('credits.status_failed')}</span>
      default:
        return <span className={twFromTokens('inline-block', baseFontSizes.xs, spacing.badgePadding, 'rounded-full', colors.dangerBg, colors.danger)}>{status}</span>
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
      <div className={twFromTokens(spacing.smallTop)}>
        <span className={twFromTokens('inline-block', baseFontSizes.xs, spacing.badgePadding, 'rounded-full', colors.dangerBg, colors.danger)}>{label}</span>
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
  // Prefer semantic color token where possible, otherwise fall back to literal Tailwind class.
  let labelColorToken: string | { tw?: string } = colors.textMuted
  if (tx.failure_code) labelColorToken = colors.danger
  else if (st === 'insufficient_funds') labelColorToken = colors.warning
  else if (st === 'failed') labelColorToken = colors.danger

  return (
    <div key={tx.id} className={twFromTokens(spacing.card, 'border', 'rounded', colors.surface)}>
      <div className={twFromTokens(alignment.flexCol, 'sm:flex-row', alignment.justifyBetween, alignment.itemsStart, spacing.cardInnerGap)}>
        <div className="flex-1">
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, 'justify-end', 'sm:justify-between', spacing.cardInnerGap)}>
            <TransactionCard
              description={formatDescription(tx, st)}
              date={tx.timestamp ? new Date(tx.timestamp).toLocaleString() : undefined}
              labels={(
                <div className={twFromTokens(textSizes.sm, alignment.flexRow, alignment.itemsCenter, 'leading-4', 'align-middle', labelColorToken)}>
                  {tx.user_email ? (
                    <span className={twFromTokens(spacing.badgePadding, 'border', tx.failure_code ? twFromTokens(colors.dangerBg, colors.danger) : st === 'insufficient_funds' ? twFromTokens(colors.warningBg, colors.warning) : twFromTokens(colors.surface, colors.textSecondary), 'rounded-l-sm', 'truncate', 'max-w-xs')}>
                      {tx.user_email}
                    </span>
                  ) : null}
                  {tx.session_id ? (
                    <span className={twFromTokens(spacing.badgePadding, 'border', 'border-l-0', tx.failure_code ? twFromTokens(colors.dangerBg, colors.danger) : st === 'insufficient_funds' ? twFromTokens(colors.warningBg, colors.warning) : twFromTokens(colors.surface, colors.textSecondary), 'rounded-r-sm', 'truncate', 'max-w-[20ch]')}>{tx.session_id}</span>
                  ) : null}
                </div>
              )}
              badge={badge}
            />
          </div>
        </div>

        <div className={twFromTokens(spacing.fullWidth, alignment.flexRow, alignment.itemsCenter, 'justify-end', 'text-right', 'sm:flex-col', 'sm:items-end', 'sm:justify-start', spacing.controlsGap)}>
          {badge ? <div className={twFromTokens('flex-shrink-0', spacing.badgeMarginLeft)}>{badge}</div> : null}
          <div className={twFromTokens(fontWeights.semibold, textSizes.md)}>{tx.credits ?? 0} credits</div>
          <div className={twFromTokens(textSizes.md)}>
            {(() => {
              if (credits === 0 && (!amt || amt === 0)) {
                return <span className={twFromTokens(colors.warning, fontWeights.medium)}>${Math.abs(amt).toFixed(2)}</span>
              }
              if (isNegative && !isPositive) {
                return <span className={twFromTokens(colors.danger, fontWeights.medium)}>−${Math.abs(amt).toFixed(2)}</span>
              }
              return <span className={twFromTokens(colors.success, fontWeights.medium)}>+${Math.abs(amt).toFixed(2)}</span>
            })()}
          </div>

          {tx.session_id && (
            <TransactionStatusChecker sessionId={tx.session_id} fetchTx={fetchTx} refreshUser={refreshUser} />
          )}
        </div>
      </div>
      {tx.failure_code ? (
        <div className={twFromTokens(spacing.smallTop)}>{failureBadge(tx.failure_code, tx.failure_message)}</div>
      ) : null}
    </div>
  )
}

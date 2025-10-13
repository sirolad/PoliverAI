import type { ReactNode } from 'react'
import Text from '@/components/ui/Text'
import { twFromTokens, textSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  date?: string
  description?: string
  userEmail?: string | null
  sessionId?: string | null
  labels?: ReactNode
  dateNode?: ReactNode
}

export default function TransactionRow({ date, description, userEmail, sessionId, labels, dateNode }: Props) {
  // This component renders the left column of a transaction row:
  // - first line: description (left) and optional badge (right)
  // - second line: user email • session id
  // - third line: human readable date
  return (
    <div className={twFromTokens('flex-1 min-w-0', spacing.cardCompact)}>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsStart, alignment.justifyBetween, alignment.gap4, spacing.tinyTop)}>
          <div className={twFromTokens(textSizes.lg, colors.textSecondary, 'truncate', fontWeights.medium, 'flex-1 min-w-0')}>
          <span className={twFromTokens('truncate')}>{description || 'Transaction'}</span>
        </div>
      </div>

      {/* allow caller to pass fully styled label nodes; fall back to simple text if not provided */}
      {labels ? (
        <div className={twFromTokens(spacing.tinyTop, 'mb-2')}>{labels}</div>
      ) : (userEmail || sessionId) ? (
        <>
          <div className={twFromTokens(spacing.tinyTop)}>
            {userEmail ? <Text preset="caption" color="textMuted" className={twFromTokens('truncate')}>{userEmail}</Text> : null}
          </div>
          <div className={twFromTokens(spacing.tinyTop)}>
            {sessionId ? <Text preset="caption" color="textMuted" className={twFromTokens('truncate')}>{sessionId}</Text> : null}
          </div>
        </>
      ) : null}

      {dateNode ? (
        <div className={twFromTokens(spacing.tinyTop)}>{dateNode}</div>
      ) : (date ? (
          <div className={twFromTokens(spacing.tinyTop)}><Text preset="small" color="textMuted">{date}</Text></div>
      ) : null)}
    </div>
  )
}

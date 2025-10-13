import type { ReactNode } from 'react'
import Text from '@/components/ui/Text'
import { twFromTokens, textSizes, fontWeights, colors } from '@/styles/styleTokens'

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
    <div className="flex-1 min-w-0 py-2">
      <div className={twFromTokens('flex items-start justify-between gap-4', 'mb-1')}>
          <div className={twFromTokens(textSizes.lg, colors.textSecondary, 'truncate', fontWeights.medium, 'flex-1 min-w-0')}>
          <span className={twFromTokens('truncate')}>{description || 'Transaction'}</span>
        </div>
      </div>

      {/* allow caller to pass fully styled label nodes; fall back to simple text if not provided */}
      {labels ? (
        <div className={twFromTokens('mt-1 mb-2')}>{labels}</div>
      ) : (userEmail || sessionId) ? (
        <>
          <div className={twFromTokens('mt-1')}>
            {userEmail ? <Text preset="caption" color="textMuted" className={twFromTokens('truncate')}>{userEmail}</Text> : null}
          </div>
          <div className={twFromTokens('mt-1')}>
            {sessionId ? <Text preset="caption" color="textMuted" className={twFromTokens('truncate')}>{sessionId}</Text> : null}
          </div>
        </>
      ) : null}

      {dateNode ? (
        <div className={twFromTokens('mt-1')}>{dateNode}</div>
      ) : (date ? (
          <div className={twFromTokens('mt-1')}><Text preset="small" color="textMuted">{date}</Text></div>
      ) : null)}
    </div>
  )
}

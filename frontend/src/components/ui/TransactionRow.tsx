import type { ReactNode } from 'react'

type Props = {
  date?: string
  description?: string
  userEmail?: string | null
  sessionId?: string | null
  // badge?: ReactNode
  labels?: ReactNode
  dateNode?: ReactNode
}

// export default function TransactionRow({ date, description, userEmail, sessionId, badge, labels, dateNode }: Props) {
export default function TransactionRow({ date, description, userEmail, sessionId, labels, dateNode }: Props) {
  // This component renders the left column of a transaction row:
  // - first line: description (left) and optional badge (right)
  // - second line: user email • session id
  // - third line: human readable date
  return (
    <div className="flex-1 min-w-0 py-2">
      <div className="flex items-start justify-between gap-4 mb-1">
          <div className="text-lg text-gray-700 truncate font-medium flex-1 min-w-0">
          <span className="truncate">{description || 'Transaction'}</span>
        </div>
        {/* {badge ? <div className="flex-shrink-0 ml-2">{badge}</div> : null} */}
      </div>

      {/* allow caller to pass fully styled label nodes; fall back to simple text if not provided */}
      {labels ? (
        <div className="mt-1 mb-2">{labels}</div>
      ) : (userEmail || sessionId) ? (
        <>
          <div className="mt-1">
            {userEmail ? <div className="text-xs text-gray-600 truncate">{userEmail}</div> : null}
          </div>
          <div className="mt-1">
            {sessionId ? <div className="text-xs text-gray-600 truncate mt-1">{sessionId}</div> : null}
          </div>
        </>
      ) : null}

      {dateNode ? (
        <div className="mt-1">{dateNode}</div>
      ) : (date ? (
          <div className="text-sm text-gray-600 mt-1">{date}</div>
      ) : null)}
    </div>
  )
}

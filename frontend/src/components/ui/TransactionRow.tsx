type Props = {
  date?: string
  amount?: string | number
  description?: string
  userEmail?: string | null
  sessionId?: string | null
}

export default function TransactionRow({ date, amount, description, userEmail, sessionId }: Props) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 truncate">{description || 'Transaction'}</div>
        {(userEmail || sessionId) ? (
          <div className="text-sm text-gray-600 truncate mt-1">{userEmail ?? ''}{userEmail && sessionId ? ' • ' : ''}{sessionId ?? ''}</div>
        ) : null}
      </div>
      <div className="text-sm text-gray-500 ml-4">{date || ''}</div>
      <div className="text-sm font-medium ml-4">{amount ?? ''}</div>
    </div>
  )
}

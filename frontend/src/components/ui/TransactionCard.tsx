import TransactionRow from './TransactionRow'
import type { ReactNode } from 'react'

type Props = {
  description?: string
  date?: string
  labels?: ReactNode
  badge?: ReactNode
  credits?: number | null
  amountUsd?: number | null
}

export default function TransactionCard({ description, date, labels, badge, credits, amountUsd }: Props) {
  // Mobile-first layout: stack the TransactionRow on top, and place badge + amount/credits
  // in a bottom row. On md+ screens show them on the right side alignment.
  const amountDisplay = (() => {
    const amt = typeof amountUsd === 'number' ? amountUsd : null
    const cr = typeof credits === 'number' ? credits : null
    if (cr === null && amt === null) return null
    // Prefer credits display first
    if (cr !== null) return <div className="font-semibold">{cr} credits</div>
    if (amt !== null) return <div className="font-semibold">${Math.abs(amt).toFixed(2)}</div>
    return null
  })()

  return (
    <div className="p-4 border rounded bg-white flex flex-col md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
        <TransactionRow description={description} labels={labels} dateNode={date ? <div className="text-sm text-gray-600">{date}</div> : undefined} badge={undefined} />
      </div>

      {/* Right/bottom area: on mobile this becomes a bottom inline row */}
      <div className="mt-3 md:mt-0 md:ml-4 flex items-center justify-between gap-3">
        <div className="text-right">
          {amountDisplay}
          {/* On smaller screens we may want a smaller USD line */}
          {amountUsd !== null && amountUsd !== undefined && (
            <div className="text-sm text-gray-600">${(amountUsd ?? 0).toFixed(2)}</div>
          )}
        </div>

        <div className="flex-shrink-0">
          {badge}
        </div>
      </div>
    </div>
  )
}

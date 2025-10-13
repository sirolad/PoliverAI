import TransactionRow from './TransactionRow'
import type { ReactNode } from 'react'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

type Props = {
  description?: string
  date?: string
  labels?: ReactNode
  badge?: ReactNode
}

export default function TransactionCard({ description, date, labels }: Props) {

  return (
    <div className="p-4 bg-white flex flex-col md:flex-row md:items-start md:justify-between">
      <div className="flex-1">
  <TransactionRow description={description} labels={labels} dateNode={date ? <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{date}</div> : undefined} />
      </div>
    </div>
  )
}

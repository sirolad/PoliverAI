import TransactionRow from './TransactionRow'
import type { ReactNode } from 'react'
import { twFromTokens, textSizes, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  description?: string
  date?: string
  labels?: ReactNode
  badge?: ReactNode
}

export default function TransactionCard({ description, date, labels }: Props) {

  return (
    <div className={twFromTokens(spacing.cardDefault, colors.surface, alignment.flexCol, 'md:flex-row md:items-start md:justify-between')}>
      <div className={twFromTokens('flex-1')}>
        <TransactionRow description={description} labels={labels} dateNode={date ? <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{date}</div> : undefined} />
      </div>
    </div>
  )
}

import type { TransactionStatus } from '@/types/transaction'

import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

type Props = {
  name: TransactionStatus
  checked: boolean
  onChange: (name: TransactionStatus) => void
}

export default function StatusFilterItem({ name, checked, onChange }: Props) {
  return (
    <label className={twFromTokens('flex items-center gap-2')}>
      <input type="checkbox" checked={checked} onChange={() => onChange(name)} className={twFromTokens('w-4 h-4')} />
      <span className={twFromTokens(textSizes.sm, colors.textSecondary, 'capitalize')}>{name.replace(/_/g, ' ')}</span>
    </label>
  )
}

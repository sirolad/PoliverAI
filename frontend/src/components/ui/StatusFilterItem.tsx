import type { TransactionStatus } from '@/types/transaction'

import { twFromTokens, textSizes, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  name: TransactionStatus
  checked: boolean
  onChange: (name: TransactionStatus) => void
}

export default function StatusFilterItem({ name, checked, onChange }: Props) {
  return (
    <label className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
      <input type="checkbox" checked={checked} onChange={() => onChange(name)} className={twFromTokens(spacing.iconsXs)} />
      <span className={twFromTokens(textSizes.sm, colors.textSecondary, 'capitalize')}>{name.replace(/_/g, ' ')}</span>
    </label>
  )
}

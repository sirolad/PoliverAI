import type { TransactionStatus } from '@/types/transaction'

type Props = {
  name: TransactionStatus
  checked: boolean
  onChange: (name: TransactionStatus) => void
}

export default function StatusFilterItem({ name, checked, onChange }: Props) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={() => onChange(name)} className="w-4 h-4" />
      <span className="text-sm text-gray-700 capitalize">{name.replace(/_/g, ' ')}</span>
    </label>
  )
}

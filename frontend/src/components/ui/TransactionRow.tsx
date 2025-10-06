type Props = {
  date?: string
  amount?: string | number
  description?: string
}

export default function TransactionRow({ date, amount, description }: Props) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="text-sm text-gray-700">{description || 'Transaction'}</div>
      <div className="text-sm text-gray-500">{date || ''}</div>
      <div className="text-sm font-medium">{amount ?? ''}</div>
    </div>
  )
}

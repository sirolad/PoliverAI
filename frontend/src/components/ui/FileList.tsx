type Item = { name: string; url?: string }
type Props = {
  items?: Item[]
  onOpen?: (item: Item) => void
}

export default function FileList({ items = [], onOpen }: Props) {
  if (!items || items.length === 0) return <div className="text-sm text-gray-500">No files</div>
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-center justify-between">
          <div className="text-sm text-gray-700 break-words">{it.name}</div>
          {onOpen ? (
            <button className="text-blue-600 text-sm" onClick={() => onOpen(it)}>Open</button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

type Props = {
  article?: string | number
  issue?: string
}

export default function SidebarFindingItem({ article, issue }: Props) {
  return (
    <div className="text-sm break-words whitespace-normal">
      <span className="font-medium">Article {article}:</span> <span className="break-words whitespace-normal">{issue}</span>
    </div>
  )
}

import { twFromTokens, baseFontSizes, colors, alignment, hoverTextFromColor } from '@/styles/styleTokens'

type Item = { name: string; url?: string }
type Props = {
  items?: Item[]
  onOpen?: (item: Item) => void
}

export default function FileList({ items = [], onOpen }: Props) {
  if (!items || items.length === 0) return <div className={twFromTokens(baseFontSizes.sm, colors.textMuted)}>{'No files'}</div>
  return (
    <ul className={twFromTokens(alignment.flexCol, alignment.gap2)}>
      {items.map((it, i) => (
        <li key={i} className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          <div className={twFromTokens(baseFontSizes.sm, colors.textSecondary, 'break-words')}>{it.name}</div>
          {onOpen ? (
            <button className={twFromTokens(baseFontSizes.sm, colors.primary, hoverTextFromColor(colors.primary))} onClick={() => onOpen(it)}>{'Open'}</button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

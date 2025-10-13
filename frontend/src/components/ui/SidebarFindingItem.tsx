type Props = {
  article?: string | number
  issue?: string
}
import { t } from '@/i18n'
import { twFromTokens, textSizes, fontWeights, spacing, alignment, colors, hoverFromColor } from '@/styles/styleTokens'

export default function SidebarFindingItem({ article, issue }: Props) {
  return (
    <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, spacing.cardCompact)}>
      <span className={twFromTokens(fontWeights.medium, textSizes.sm, colors.textPrimary)}>{t('sidebar.article', { num: article ?? '' })}</span>
      <span className={twFromTokens(textSizes.sm, colors.textMuted, 'break-words whitespace-normal', hoverFromColor(colors.primary))}>{issue}</span>
    </div>
  )
}

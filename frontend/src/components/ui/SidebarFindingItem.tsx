type Props = {
  article?: string | number
  issue?: string
}
import { t } from '@/i18n'
import { twFromTokens, textSizes, fontWeights } from '@/styles/styleTokens'

export default function SidebarFindingItem({ article, issue }: Props) {
  return (
    <div className={twFromTokens(textSizes.sm, 'break-words whitespace-normal')}>
      <span className={twFromTokens(fontWeights.medium)}>{t('sidebar.article', { num: article ?? '' })}</span> <span className={twFromTokens('break-words whitespace-normal')}>{issue}</span>
    </div>
  )
}

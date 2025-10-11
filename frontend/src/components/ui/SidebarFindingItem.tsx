type Props = {
  article?: string | number
  issue?: string
}

import { t } from '@/i18n'

export default function SidebarFindingItem({ article, issue }: Props) {
  return (
    <div className="text-sm break-words whitespace-normal">
      <span className="font-medium">{t('sidebar.article', { num: article ?? '' })}</span> <span className="break-words whitespace-normal">{issue}</span>
    </div>
  )
}

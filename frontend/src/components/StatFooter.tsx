import type { FC } from 'react'
import { t } from '@/i18n'

type Props = {
  i18nKey?: string
  className?: string
}

const StatFooter: FC<Props> = ({ i18nKey = 'app_platforms.and_counting', className = 'text-xs text-gray-400 mt-1' }) => {
  return <div className={className}>{t(i18nKey)}</div>
}

export default StatFooter

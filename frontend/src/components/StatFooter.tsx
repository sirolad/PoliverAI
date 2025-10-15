import type { FC } from 'react'
import { t } from '@/i18n'
import { textSizes, colors, twFromTokens, spacing } from '@/styles/styleTokens'

type Props = {
  i18nKey?: string
  className?: string
}

const StatFooter: FC<Props> = ({ i18nKey = 'app_platforms.and_counting', className }) => {
  const cls = className ?? twFromTokens(textSizes.sm, colors.textMuted, spacing.tinyTop)
  return <div className={cls}>{t(i18nKey)}</div>
}

export default StatFooter

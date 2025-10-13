import { Link } from 'react-router-dom'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

type Props = {
  className?: string
}

export default function NavBrand({ className }: Props) {
  return (
    <Link to="/" className={className ?? twFromTokens('flex items-center gap-2 font-bold', textSizes.lead)}>
      <img src="/poliverai-icon-transparent.svg" alt={t('brand.alt')} className="h-12" />
      <span>{t('brand.poliver')} <span className={twFromTokens(colors.primary)}>{t('brand.ai')}</span></span>
    </Link>
  )
}

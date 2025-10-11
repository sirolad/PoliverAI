import { Link } from 'react-router-dom'
import { t } from '@/i18n'

type Props = {
  className?: string
}

export default function NavBrand({ className }: Props) {
  return (
    <Link to="/" className={className ?? 'flex items-center gap-2 font-bold text-xl'}>
      <img src="/poliverai-icon-transparent.svg" alt={t('brand.alt')} className="h-12" />
      <span>{t('brand.poliver')} <span className="text-blue-600">{t('brand.ai')}</span></span>
    </Link>
  )
}

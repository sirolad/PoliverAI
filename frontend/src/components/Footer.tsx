import { footerClasses } from '@/lib/uiHelpers'
import BrandBlock from './ui/BrandBlock'
import { t } from '@/i18n'

type FooterProps = {
  hasBackground?: boolean
}

export default function Footer({ hasBackground = true }: FooterProps) {
  const { bgClass, subtitleClass } = footerClasses(hasBackground)

  return (
    <footer className={`${bgClass} py-6`}>
      <div className="container mx-auto px-4 flex flex-col items-center text-center gap-4">
        <div className={`text-sm ${subtitleClass} max-w-xl`}>
          {t('footer.short')}
        </div>

        <div className={`text-sm md:text-base max-w-xl ${hasBackground ? '' : 'text-gray-600'}`}>
          {t('footer.paragraph')}
        </div>

        {/* Reusable brand block */}
        <BrandBlock hasBackground={hasBackground} subtitleClass={subtitleClass} showAndelaLogo showPartnershipText/>
      </div>
    </footer>
  )
}

import { footerClasses } from '@/lib/uiHelpers'
import BrandBlock from './ui/BrandBlock'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

type FooterProps = {
  hasBackground?: boolean
}

export default function Footer({ hasBackground = true }: FooterProps) {
  const { bgClass, subtitleClass } = footerClasses(hasBackground)

  return (
  <footer className={twFromTokens(bgClass, 'py-6')}>
      <div className="container mx-auto px-4 flex flex-col items-center text-center gap-4">
        <div className={twFromTokens(textSizes.sm, subtitleClass, 'max-w-xl')}>
          {t('footer.short')}
        </div>

        <div className={twFromTokens(textSizes.sm, 'md:text-base', 'max-w-xl', hasBackground ? '' : colors.textMuted)}>
          {t('footer.paragraph')}
        </div>

        {/* Reusable brand block */}
        <BrandBlock hasBackground={hasBackground} subtitleClass={subtitleClass} showAndelaLogo showPartnershipText/>
      </div>
    </footer>
  )
}

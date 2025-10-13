import { footerClasses } from '@/lib/uiHelpers'
import BrandBlock from './ui/BrandBlock'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, spacing, alignment } from '@/styles/styleTokens'

type FooterProps = {
  hasBackground?: boolean
}

export default function Footer({ hasBackground = true }: FooterProps) {
  const { bgClass, subtitleClass } = footerClasses(hasBackground)

  return (
  <footer className={twFromTokens(bgClass, spacing.sectionPaddingY)}>
      <div className={twFromTokens(spacing.containerMaxLg, alignment.flexCol, alignment.itemsCenter, 'text-center', alignment.gap4)}>
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

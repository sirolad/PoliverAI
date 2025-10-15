import { getCurrentYear } from '@/lib/uiHelpers'
import { t } from '@/i18n'
import { twFromTokens, alignment, spacing, textSizes, colors } from '@/styles/styleTokens'

type Props = {
  hasBackground?: boolean
  subtitleClass?: string
  showPartnershipText?: boolean
  showAndelaLogo?: boolean
  showCopyrightText?: boolean
}

export default function BrandBlock({ hasBackground = true, subtitleClass = '', showPartnershipText = true, showAndelaLogo = true, showCopyrightText = true }: Props) {
  const wrapperClass = hasBackground ? twFromTokens(colors.surface, spacing.cardDefault, 'rounded-lg', 'shadow-sm') : twFromTokens(spacing.cardDefault)

  return (
    <div className={twFromTokens(alignment.flexCol, alignment.itemsCenter, 'text-center', spacing.smallTop)}>
      {showCopyrightText ? (
        <div className={twFromTokens(textSizes.sm, subtitleClass, spacing.tinyTop)}>
          {t('brand_block.copyright', { year: getCurrentYear() })}
        </div>
      ) : null}

      {showPartnershipText ? (
        <div className={twFromTokens(textSizes.sm, subtitleClass, spacing.tinyTop, spacing.tinyBottom)}>
          {t('brand_block.partnership')}
        </div>
      ) : null}

      <div className={wrapperClass}>
        <div className={twFromTokens(alignment.flexRow, alignment.gap3)}>
          <img src="/poliverai-logo.png" className={twFromTokens(spacing.iconsLg, 'w-auto')} />
          {showAndelaLogo ? (
            <img src="/andela-logo-transparent.png" alt={t('brand_block.andela_alt')} className={twFromTokens(spacing.iconsMdLarge, 'w-auto')} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

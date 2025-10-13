import { t } from '@/i18n'
import HeroCTAs from './HeroCTAs'
import Heading from './ui/Heading'
import Text from './ui/Text'
import { twFromTokens, colors, spacing, alignment } from '@/styles/styleTokens'

export default function HeroSection() {
  return (
    <div className={twFromTokens(spacing.sectionContainer)}>
      <div className={twFromTokens('text-center', spacing.containerMaxLg)}>
        <img src="/poliverai-logo.svg" alt={t('brand.alt')} className={twFromTokens('mx-auto')} />
        <Heading as="h1" className={twFromTokens(spacing.headingMargin)} color="textPrimary">
          {t('landing.hero.prefix')} <span className={twFromTokens(colors.primary)}>{t('landing.hero.highlight')}</span> {t('landing.hero.suffix')}
        </Heading>
        <Text preset="lead" color="textMuted" className={twFromTokens(spacing.smallTop, 'mb-8')}>
          {t('landing.hero.description')}
        </Text>
        <div className={twFromTokens(alignment.flexRow, alignment.gap4, alignment.justifyCenter)}>
          <HeroCTAs />
        </div>

        {/* Andela partnership badge */}
        <div className={twFromTokens(spacing.smallTop, alignment.flexRow, alignment.itemsCenter, alignment.justifyCenter, alignment.gap3)}>
          <Text preset="lg" color="textMuted">{t('landing.partner.prefix')} </Text>
          <img src="/andela-logo-transparent.png" alt={t('landing.partner.alt')} className="h-10" />
          <Text preset="lg" color="textMuted"> {t('landing.partner.suffix')}</Text>
        </div>
      </div>
    </div>
  )
}

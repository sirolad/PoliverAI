import { t } from '@/i18n'
import HeroCTAs from './HeroCTAs'
import Heading from './ui/Heading'
import Text from './ui/Text'
import { twFromTokens, colors } from '@/styles/styleTokens'

export default function HeroSection() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-4xl mx-auto">
        <img src="/poliverai-logo.svg" alt={t('brand.alt')} className="mx-auto" />
        <Heading as="h1" className="mb-6" color="textPrimary">
          {t('landing.hero.prefix')} <span className={twFromTokens(colors.primary)}>{t('landing.hero.highlight')}</span> {t('landing.hero.suffix')}
        </Heading>
        <Text preset="lead" color="textMuted" className="mb-8">
          {t('landing.hero.description')}
        </Text>
        <div className="flex gap-4 justify-center">
          <HeroCTAs />
        </div>

        {/* Andela partnership badge */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <Text preset="lg" color="textMuted">{t('landing.partner.prefix')} </Text>
          <img src="/andela-logo-transparent.png" alt={t('landing.partner.alt')} className="h-10" />
          <Text preset="lg" color="textMuted"> {t('landing.partner.suffix')}</Text>
        </div>
      </div>
    </div>
  )
}

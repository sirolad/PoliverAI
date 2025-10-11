import { t } from '@/i18n'
import HeroCTAs from './HeroCTAs'

export default function HeroSection() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-4xl mx-auto">
        <img src="/poliverai-logo.svg" alt={t('brand.alt')} className="mx-auto" />
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          {t('landing.hero.prefix')} <span className="text-blue-600">{t('landing.hero.highlight')}</span> {t('landing.hero.suffix')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('landing.hero.description')}
        </p>
        <div className="flex gap-4 justify-center">
          <HeroCTAs />
        </div>

        {/* Andela partnership badge */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="text-lg text-gray-600">{t('landing.partner.prefix')} </div>
          <img src="/andela-logo-transparent.png" alt={t('landing.partner.alt')} className="h-10" />
          <div className="text-lg text-gray-600"> {t('landing.partner.suffix')}</div>
        </div>
      </div>
    </div>
  )
}

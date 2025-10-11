import { getCurrentYear } from '@/lib/uiHelpers'
import { t } from '@/i18n'

type Props = {
  hasBackground?: boolean
  subtitleClass?: string
  showPartnershipText?: boolean
  showAndelaLogo?: boolean
  showCopyrightText?: boolean
}

export default function BrandBlock({ hasBackground = true, subtitleClass = '', showPartnershipText = true, showAndelaLogo = true, showCopyrightText = true }: Props) {
  return (
    <div className="flex flex-col items-center text-center gap-2 mt-4">
      {showCopyrightText ? (
        <div className={`text-sm ${subtitleClass} mt-2`}>
          {t('brand_block.copyright', { year: getCurrentYear() })}
        </div>
      ) : null}

      {showPartnershipText ? (
        <div className={`text-sm ${subtitleClass} mt-2`}>
          {t('brand_block.partnership')}
        </div>
      ) : null}

      <div className={hasBackground ? 'bg-white p-3 rounded-lg shadow-sm' : 'p-3'}>
        <div className="flex items-center gap-3">
          <img src="/poliverai-logo.png" className="h-12 w-auto" />
          {showAndelaLogo ? (
            <img src="/andela-logo-transparent.png" alt={t('brand_block.andela_alt')} className="h-10 w-auto" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

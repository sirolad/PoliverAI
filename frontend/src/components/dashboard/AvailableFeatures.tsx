import { t } from '@/i18n'
import { Card, CardHeader } from '@/components/ui/Card'
import FeatureItem from '@/components/ui/FeatureItem'
import useAvailableFeatures from '@/hooks/useAvailableFeatures'
import { Shield, Zap } from 'lucide-react'
import { twFromTokens, textSizes, colors } from '@/styles/styleTokens'

type Props = {
  getCost?: (k?: string) => { credits: number; usd: number } | undefined
  hasCredits: boolean
}

export default function AvailableFeatures({ getCost, hasCredits }: Props) {
  const { freeFeatures, proFeatures } = useAvailableFeatures(hasCredits)

  return (
    <div className="mb-8">
  <h2 className={twFromTokens(textSizes.h2, 'font-semibold', colors.textPrimary, 'mb-4')}>{t('dashboard.features.title')}</h2>

      {/* Free Features */}
      <div className="mb-6">
        <h3 className={twFromTokens(textSizes.lg, 'font-medium', colors.textSecondary, 'mb-3 flex items-center gap-2')}>
          <Shield className={twFromTokens('h-5 w-5', colors.success)} />
          {t('dashboard.features.free_heading')}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {freeFeatures.map((feature, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="pb-2">
                <FeatureItem feature={feature} />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Pro Features */}
      <div>
        <h3 className={twFromTokens(textSizes.lg, 'font-medium', colors.textSecondary, 'mb-3 flex items-center gap-2')}>
          <Zap className={twFromTokens('h-5 w-5', colors.primary)} />
          {t('dashboard.features.pro_heading')}
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {proFeatures.map((feature, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="pb-2">
                <FeatureItem feature={feature} getCost={getCost} />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

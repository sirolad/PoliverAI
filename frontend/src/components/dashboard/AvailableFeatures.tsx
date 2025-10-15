import { t } from '@/i18n'
import { Card, CardHeader } from '@/components/ui/Card'
import FeatureItem from '@/components/ui/FeatureItem'
import useAvailableFeatures from '@/hooks/useAvailableFeatures'
import { Shield, Zap } from 'lucide-react'
import { twFromTokens, textSizes, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  getCost?: (k?: string) => { credits: number; usd: number } | undefined
  hasCredits: boolean
}

export default function AvailableFeatures({ getCost, hasCredits }: Props) {
  const { freeFeatures, proFeatures } = useAvailableFeatures(hasCredits)

  return (
    <div className={twFromTokens('mb-8')}>
      <h2 className={twFromTokens(textSizes.h2, 'font-semibold', colors.textPrimary, spacing.headingMargin)}>{t('dashboard.features.title')}</h2>

      {/* Free Features */}
      <div className={twFromTokens(spacing.smallTop)}>
        <h3 className={twFromTokens(textSizes.lg, 'font-medium', colors.textSecondary, spacing.headingMargin, alignment.flexRow, 'gap-2')}>
          <Shield className={twFromTokens('h-5 w-5', colors.success)} />
          {t('dashboard.features.free_heading')}
        </h3>
        <div className={twFromTokens('grid md:grid-cols-3', spacing.cardInnerGap.tw ? spacing.cardInnerGap.tw : spacing.cardInnerGap)}>
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
      <div className={twFromTokens(spacing.smallTop)}>
        <h3 className={twFromTokens(textSizes.lg, 'font-medium', colors.textSecondary, spacing.headingMargin, alignment.flexRow, 'gap-2')}>
          <Zap className={twFromTokens('h-5 w-5', colors.primary)} />
          {t('dashboard.features.pro_heading')}
        </h3>
        <div className={twFromTokens('grid md:grid-cols-3', spacing.cardInnerGap.tw ? spacing.cardInnerGap.tw : spacing.cardInnerGap)}>
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

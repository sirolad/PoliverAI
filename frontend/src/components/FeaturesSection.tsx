import { t } from '@/i18n'
import { CheckCircle2, Zap } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import Text from '@/components/ui/Text'
import { twFromTokens, colors, textSizes, spacing, alignment } from '@/styles/styleTokens'
import useFeatures from '@/hooks/useFeatures'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
  isPro?: boolean
}

function FeatureCard({ icon: Icon, title, description, isPro = false }: FeatureCardProps) {
  return (
    <Card className={twFromTokens('h-full', isPro ? 'border-blue-200 bg-blue-50/50' : '')}>
      <CardHeader>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
          <Icon className={twFromTokens(spacing.iconsMd, isPro ? colors.primary : colors.success)} />
          <CardTitle>
            <Text preset="lg" className="font-semibold">{title}</Text>
          </CardTitle>
          {isPro && (
            <span className={twFromTokens(spacing.badgePadding, 'rounded-full', textSizes.sm, colors.primaryBg, colors.onPrimary, spacing.badgeMarginLeft)}>PRO</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>
          <Text preset="body">{description}</Text>
        </CardDescription>
      </CardContent>
    </Card>
  )
}

export default function FeaturesSection() {
  const { freeFeatures, proFeatures } = useFeatures()

  return (
    <div className={twFromTokens(spacing.sectionContainer)}>
      <div className={twFromTokens(spacing.sectionTitle)}>
        <Heading as="h2" preset="subheading" className={twFromTokens(spacing.headingMargin)}>{t('landing.features.title')}</Heading>
        <Text preset="lead" color="textMuted">{t('landing.features.subtitle')}</Text>
      </div>

      {/* Free Features */}
      <div className={twFromTokens(spacing.smallTop)}>
        <h3 className={twFromTokens(alignment.flexRow, spacing.headingLarge, alignment.gap2)}>
          <CheckCircle2 className={twFromTokens(spacing.iconsMd, colors.success)} />
          <Heading as="h3" preset="subheading">{t('landing.features.free_heading')}</Heading>
        </h3>
        <div className={twFromTokens('grid md:grid-cols-3', spacing.cardInnerGap.tw ? spacing.cardInnerGap.tw : spacing.cardInnerGap)}>
          {freeFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* Pro Features */}
      <div className={twFromTokens(spacing.smallTop)}>
        <h3 className={twFromTokens(alignment.flexRow, spacing.headingLarge, alignment.gap2)}>
          <Zap className={twFromTokens(spacing.iconsMd, colors.primary)} />
          <Heading as="h3" preset="subheading">{t('landing.features.pro_heading')}</Heading>
        </h3>
        <div className={twFromTokens('grid md:grid-cols-3', spacing.cardInnerGap.tw ? spacing.cardInnerGap.tw : spacing.cardInnerGap)}>
          {proFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  )
}

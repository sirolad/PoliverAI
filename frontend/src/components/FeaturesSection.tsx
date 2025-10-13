import { t } from '@/i18n'
import { CheckCircle2, Zap } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import Text from '@/components/ui/Text'
import { twFromTokens, colors, textSizes } from '@/styles/styleTokens'
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
        <div className="flex items-center gap-2">
          <Icon className={twFromTokens('h-6', 'w-6', isPro ? colors.primary : colors.success)} />
          <CardTitle>
            <Text preset="small" className="font-semibold">{title}</Text>
          </CardTitle>
          {isPro && (
            <span className={twFromTokens('px-2', 'py-1', 'rounded-full', textSizes.sm, colors.primaryBg, colors.onPrimary)}>PRO</span>
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
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Heading as="h2" preset="subheading" className="mb-4">{t('landing.features.title')}</Heading>
        <Text preset="lead" color="textMuted">{t('landing.features.subtitle')}</Text>
      </div>

      {/* Free Features */}
      <div className="mb-12">
        <h3 className="mb-6 flex items-center gap-2">
          <CheckCircle2 className={twFromTokens('h-6', 'w-6', colors.success)} />
          <Heading as="h3" preset="subheading">{t('landing.features.free_heading')}</Heading>
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {freeFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* Pro Features */}
      <div>
        <h3 className="mb-6 flex items-center gap-2">
          <Zap className={twFromTokens('h-6', 'w-6', colors.primary)} />
          <Heading as="h3" preset="subheading">{t('landing.features.pro_heading')}</Heading>
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {proFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  )
}

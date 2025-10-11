import { t } from '@/i18n'
import { CheckCircle2, Zap } from 'lucide-react'
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
    <Card className={`h-full ${isPro ? 'border-blue-200 bg-blue-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={`h-6 w-6 ${isPro ? 'text-blue-600' : 'text-green-600'}`} />
          <CardTitle className="text-lg">{title}</CardTitle>
          {isPro && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">PRO</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default function FeaturesSection() {
  const { freeFeatures, proFeatures } = useFeatures()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.features.title')}</h2>
        <p className="text-lg text-gray-600">{t('landing.features.subtitle')}</p>
      </div>

      {/* Free Features */}
      <div className="mb-12">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          {t('landing.features.free_heading')}
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {freeFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* Pro Features */}
      <div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          {t('landing.features.pro_heading')}
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

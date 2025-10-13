import usePricing from '@/hooks/usePricing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { twFromTokens, colors, textSizes, fontWeights } from '@/styles/styleTokens'
import { t } from '@/i18n'

export default function PricingSection() {
  const { freePlan, proPlan } = usePricing()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
  <h2 className={twFromTokens(textSizes.h2, fontWeights.bold, colors.textPrimary, 'mb-4')}>{freePlan.title ? t('pricing.heading') : ''}</h2>
        <p className={twFromTokens(textSizes.lg, colors.textMuted)}>{freePlan.desc}</p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <Card className="h-full">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{freePlan.title}</CardTitle>
            <div className={twFromTokens('text-4xl font-bold mt-2', colors.success)}>{freePlan.price}</div>
            <CardDescription>{freePlan.desc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {freePlan.features.map((f, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <CheckCircle2 className={twFromTokens('h-4 w-4', colors.success)} />
                  <span className={twFromTokens(textSizes.sm)}>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full mt-6" variant="outline" onClick={freePlan.onGetStarted} icon={<Clock className="h-4 w-4" />} collapseToIcon>
              {t('pricing.get_started_free')}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full border-blue-200 bg-blue-50/30">
          <CardHeader className="text-center pb-2">
            <div className={twFromTokens('text-xs px-3 py-1 rounded-full w-fit mx-auto mb-2', colors.primaryBg, colors.ctaText)}>{t('pricing.popular')}</div>
            <CardTitle className="text-2xl">{proPlan.title}</CardTitle>
            <div className={twFromTokens('text-4xl font-bold mt-2', colors.primary)}>{proPlan.price}</div>
            <CardDescription>{proPlan.period}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {proPlan.features.map((f, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <CheckCircle2 className={twFromTokens('h-4 w-4', colors.primary)} />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <Button className={twFromTokens('w-full mt-6 flex items-center gap-2', colors.primaryBg)} onClick={proPlan.onUpgrade} icon={<CreditCard className={twFromTokens('h-4 w-4', colors.ctaText)} />}>
              {t('pricing.upgrade')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

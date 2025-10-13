import usePricing from '@/hooks/usePricing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { twFromTokens, colors, textSizes, fontWeights, spacing, alignment, baseFontSizes } from '@/styles/styleTokens'
import { t } from '@/i18n'

export default function PricingSection() {
  const { freePlan, proPlan } = usePricing()

  return (
    <div className={twFromTokens(spacing.sectionContainer)}>
      <div className={twFromTokens(spacing.sectionTitle)}>
        <h2 className={twFromTokens(textSizes.h2, fontWeights.bold, colors.textPrimary, spacing.headingMargin)}>{freePlan.title ? t('pricing.heading') : ''}</h2>
        <p className={twFromTokens(textSizes.lg, colors.textMuted)}>{freePlan.desc}</p>
      </div>

      <div className={twFromTokens(spacing.containerMaxLg, 'grid md:grid-cols-2', spacing.gridGapLarge)}>
        <Card className="h-full">
          <CardHeader className={twFromTokens(alignment.centerColumn, 'pb-2')}>
            <CardTitle className={twFromTokens(textSizes.lg)}>{freePlan.title}</CardTitle>
            <div className={twFromTokens(baseFontSizes['3xl'].tw, fontWeights.bold, spacing.smallTop, colors.success)}>{freePlan.price}</div>
            <CardDescription>{freePlan.desc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className={twFromTokens('space-y-3')}>
              {freePlan.features.map((f, i) => (
                <li className={twFromTokens(alignment.flexRow, alignment.itemsCenter, 'gap-2')} key={i}>
                  <CheckCircle2 className={twFromTokens('h-4 w-4', colors.success)} />
                  <span className={twFromTokens(textSizes.sm)}>{f}</span>
                </li>
              ))}
            </ul>
            <Button className={twFromTokens(spacing.fullWidth, spacing.sectionButtonTop)} variant="outline" onClick={freePlan.onGetStarted} icon={<Clock className={twFromTokens('h-4 w-4', colors.textMuted)} />} collapseToIcon>
              {t('pricing.get_started_free')}
            </Button>
          </CardContent>
        </Card>

        <Card className={twFromTokens('h-full', colors.primaryBorder, colors.primaryBgLight)}>
          <CardHeader className={twFromTokens(alignment.centerColumn, 'pb-2')}>
            <div className={twFromTokens(baseFontSizes.xs, spacing.badgePadding, 'rounded-full w-fit mx-auto', colors.primaryBg, colors.ctaText, spacing.smallTop)}>{t('pricing.popular')}</div>
            <CardTitle className={twFromTokens(textSizes.lg)}>{proPlan.title}</CardTitle>
            <div className={twFromTokens(baseFontSizes['3xl'].tw, fontWeights.bold, spacing.smallTop, colors.primary)}>{proPlan.price}</div>
            <CardDescription>{proPlan.period}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className={twFromTokens('space-y-3')}>
              {proPlan.features.map((f, i) => (
                <li className={twFromTokens(alignment.flexRow, alignment.itemsCenter, 'gap-2')} key={i}>
                  <CheckCircle2 className={twFromTokens('h-4 w-4', colors.primary)} />
                  <span className={twFromTokens(textSizes.sm)}>{f}</span>
                </li>
              ))}
            </ul>
            <Button className={twFromTokens(spacing.fullWidth, spacing.sectionButtonTop, alignment.flexRow, alignment.gap2, colors.primaryBg)} onClick={proPlan.onUpgrade} icon={<CreditCard className={twFromTokens('h-4 w-4', colors.ctaText)} />}>
              {t('pricing.upgrade')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

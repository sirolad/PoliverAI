import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { BarChart } from 'lucide-react'
import useCTA from '@/hooks/useCTA'
import Heading from './ui/Heading'
import Text from './ui/Text'
import { twFromTokens, colors, spacing } from '@/styles/styleTokens'

export default function CTASection() {
  const { onStartFree } = useCTA()

  return (
    <div className={twFromTokens(spacing.sectionPaddingY, colors.primaryBg, colors.onPrimary)}>
      <div className={twFromTokens(spacing.containerMaxLg, 'text-center')}>
        <Heading as="h2" preset="subheading" className={twFromTokens(spacing.headingMargin)} color="ctaText">{t('landing.cta.heading')}</Heading>
        <Text preset="lead" className={twFromTokens(spacing.sectionButtonTop)} color="ctaMuted">{t('landing.cta.paragraph')}</Text>
        <Button size="lg" variant="secondary" onClick={onStartFree} className={twFromTokens(spacing.buttonSmall, 'justify-center mx-auto w-fit')} icon={<BarChart className={twFromTokens(spacing.iconsMd, colors.textPrimary)} />} iconColor="text-black">
          {t('landing.buttons.start_free_cta')}
        </Button>
      </div>
    </div>
  )
}

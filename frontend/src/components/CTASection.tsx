import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { BarChart } from 'lucide-react'
import useCTA from '@/hooks/useCTA'
import Heading from './ui/Heading'
import Text from './ui/Text'
import { twFromTokens, colors } from '@/styles/styleTokens'

export default function CTASection() {
  const { onStartFree } = useCTA()

  return (
    <div className={twFromTokens('py-16', colors.primaryBg, colors.onPrimary)}>
      <div className="container mx-auto px-4 text-center">
        <Heading as="h2" preset="subheading" className="mb-4" color="ctaText">{t('landing.cta.heading')}</Heading>
        <Text preset="lead" className="mb-8" color="ctaMuted">{t('landing.cta.paragraph')}</Text>
        <Button size="lg" variant="secondary" onClick={onStartFree} className={twFromTokens('justify-center mx-auto w-fit')} icon={<BarChart className={twFromTokens('h-5 w-5', colors.textPrimary)} />} iconColor="text-black">
          {t('landing.buttons.start_free_cta')}
        </Button>
      </div>
    </div>
  )
}

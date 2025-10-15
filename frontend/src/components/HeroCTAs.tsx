import { Button } from '@/components/ui/Button'
import { Clock, CreditCard, Grid } from 'lucide-react'
import useHeroActions from '@/hooks/useHeroActions'
import { t } from '@/i18n'
import useAuth from '@/contexts/useAuth'
import { twFromTokens, textSizes, colors, spacing, hoverBgFromColor } from '@/styles/styleTokens'

export default function HeroCTAs() {
  const { isAuthenticated } = useAuth()
  const { isProcessing, onStartFree, onUpgrade, onGoDashboard } = useHeroActions()

  if (!isAuthenticated) {
    return (
      <>
        <Button
          onClick={onStartFree}
          size="lg"
          className={twFromTokens(spacing.buttonSmall, textSizes.sm, colors.primaryBg, hoverBgFromColor(colors.primaryBg))}
          icon={<Clock className={twFromTokens('h-5 w-5', textSizes.sm)} />}
          collapseToIcon
        >
          {t('landing.buttons.start_free')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onUpgrade}
          className={twFromTokens(spacing.buttonSmall, textSizes.sm)}
          icon={<CreditCard className={twFromTokens('h-5 w-5', textSizes.sm)} />}
          collapseToIcon
        >
          {isProcessing ? t('landing.buttons.processing') : t('landing.buttons.upgrade_to_pro')}
        </Button>
      </>
    )
  }

  return (
    <Button
      size="lg"
      className={twFromTokens(spacing.buttonSmall, textSizes.sm, colors.primaryBg, hoverBgFromColor(colors.primaryBg))}
      icon={<Grid className={twFromTokens('h-5 w-5', textSizes.sm)} />}
      onClick={onGoDashboard}
    >
      {t('landing.buttons.go_dashboard')}
    </Button>
  )
}

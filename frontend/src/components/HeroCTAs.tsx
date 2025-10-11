import { Button } from '@/components/ui/Button'
import { Clock, CreditCard, Grid } from 'lucide-react'
import useHeroActions from '@/hooks/useHeroActions'
import { t } from '@/i18n'
import useAuth from '@/contexts/useAuth'

export default function HeroCTAs() {
  const { isAuthenticated } = useAuth()
  const { isProcessing, onStartFree, onUpgrade, onGoDashboard } = useHeroActions()

  if (!isAuthenticated) {
    return (
      <>
        <Button
          onClick={onStartFree}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
          icon={<Clock className="h-5 w-5" />}
          collapseToIcon
        >
          {t('landing.buttons.start_free')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onUpgrade}
          icon={<CreditCard className="h-5 w-5" />}
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
      className="bg-blue-600 hover:bg-blue-700"
      icon={<Grid className="h-5 w-5" />}
      onClick={onGoDashboard}
    >
      {t('landing.buttons.go_dashboard')}
    </Button>
  )
}

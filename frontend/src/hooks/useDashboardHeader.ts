import { t } from '@/i18n'
import useAuth from '@/contexts/useAuth'

export default function useDashboardHeader() {
  const { user } = useAuth()

  const title = t('dashboard.welcome', { name: user?.name ?? '' })
  const subtitle = t('dashboard.subtitle')

  return { title, subtitle }
}

// React import not required with the new JSX runtime
import { User } from 'lucide-react'
import useAuth from '@/contexts/useAuth'
import { getCreditsTotal } from '@/lib/paymentsHelpers'
import useRampedCounters from '@/hooks/useRampedCounters'
import { badgeClass, badgeText, formatCredits } from '@/lib/navHelpers'
import { t } from '@/i18n'

function useNavUser() {
  const { user, loading, isPro } = useAuth()
  const navCreditsTotal = getCreditsTotal(user)
  const navRampEnabled = !!user && !loading
  const animatedNavCredits = useRampedCounters({ total: navCreditsTotal }, navRampEnabled, { durationMs: 1400, maxSteps: 6, minIntervalMs: 80 })
  return { user, isPro, navCreditsTotal, navRampEnabled, animatedNavCredits }
}

export default function NavUserInfo({ showName = false, showBadge = false }: { showName?: boolean; showBadge?: boolean }) {
  const { user, isPro, navCreditsTotal, navRampEnabled, animatedNavCredits } = useNavUser()

  return (
    <>
      {showName ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.name}</span>
          </div>
        </div>
      ) : null}

      {showBadge ? (
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${badgeClass(isPro)}`}>{badgeText(isPro)}</span>
          {navRampEnabled ? (
            <div title={`${t('credits.label')} ${navCreditsTotal}`} className="text-sm px-2 py-1 rounded bg-gray-100">
              {t('credits.label')} {formatCredits(animatedNavCredits.total)}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

// React import not required with the new JSX runtime
import { User } from 'lucide-react'
import useAuth from '@/contexts/useAuth'
import { getCreditsTotal } from '@/lib/paymentsHelpers'
import useRampedCounters from '@/hooks/useRampedCounters'
import { badgeClass, badgeText, formatCredits } from '@/lib/navHelpers'
import { t } from '@/i18n'
import { twFromTokens, textSizes, baseFontSizes, colors, spacing, alignment } from '@/styles/styleTokens'

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
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
            <User className={twFromTokens('h-4 w-4', textSizes.sm)} />
            <span className={twFromTokens(textSizes.sm)}>{user?.name}</span>
          </div>
        </div>
      ) : null}

      {showBadge ? (
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
          <span className={twFromTokens(baseFontSizes.xs, spacing.badgePadding, 'rounded-full', badgeClass(isPro))}>{badgeText(isPro)}</span>
          {navRampEnabled ? (
            <div title={`${t('credits.label')} ${navCreditsTotal}`} className={twFromTokens(textSizes.sm, spacing.badgePadding, 'rounded', colors.surfaceMuted)}>
              {t('credits.label')} {formatCredits(animatedNavCredits.total)}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

import type { FC } from 'react'
import { Shield, CreditCard, DollarSign } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, baseFontSizes, colors, fontWeights } from '@/styles/styleTokens'

type Props = {
  isCompactUnderHeader: boolean
  statsLoaded: boolean
  animatedTop: { subscriptionCredits: number; purchasedCredits: number; totalSpent: number }
  subscriptionUsd: number
  purchasedUsd: number
  spentUsd: number
  total: number
  mobileCompact?: boolean
}

const CreditsSummary: FC<Props> = ({ isCompactUnderHeader, statsLoaded, animatedTop, subscriptionUsd, purchasedUsd, spentUsd, total, mobileCompact }) => {
  if (mobileCompact) {
    // compact horizontal bar used on smallest screens
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={twFromTokens('flex-shrink-0 rounded-md flex items-center justify-center p-2', colors.primaryBgLight)}>
            <Shield className={twFromTokens('h-6 w-6', colors.primary)} />
          </div>
          <div className={twFromTokens(textSizes.sm)}>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.subscription_credits')}</div>
            <div className={twFromTokens(textSizes.sm, fontWeights.semibold)}>{statsLoaded ? animatedTop.subscriptionCredits : null} {t('credits.unit')}</div>
            <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_amount', { amount: subscriptionUsd.toFixed(2) })}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={twFromTokens('flex-shrink-0 rounded-md flex items-center justify-center p-2', colors.surfaceMuted)}>
            <CreditCard className={twFromTokens('h-6 w-6', colors.textSecondary)} />
          </div>
          <div className={twFromTokens(textSizes.sm)}>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.purchased_credits')}</div>
            <div className={twFromTokens(textSizes.sm, fontWeights.semibold)}>{statsLoaded ? animatedTop.purchasedCredits : null} {t('credits.unit')}</div>
            <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_amount', { amount: purchasedUsd.toFixed(2) })}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={twFromTokens('flex-shrink-0 rounded-md flex items-center justify-center p-2', colors.dangerBg)}>
            <DollarSign className={twFromTokens('h-6 w-6', colors.danger)} />
          </div>
          <div className={twFromTokens(textSizes.sm)}>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.total_spent')}</div>
            <div className={twFromTokens(textSizes.sm, fontWeights.semibold)}>{statsLoaded ? animatedTop.totalSpent : null} {t('credits.unit')}</div>
            <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_amount', { amount: spentUsd.toFixed(2) })}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      <div className={twFromTokens(textSizes.sm, 'bg-white rounded shadow flex items-center gap-4', isCompactUnderHeader ? 'p-2' : 'p-3')}>
        <div className={twFromTokens('flex-shrink-0 rounded-md flex items-center justify-center', isCompactUnderHeader ? 'p-2' : 'p-3', colors.primaryMuted)}>
          <Shield className={twFromTokens(isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10', colors.primary)} />
        </div>
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.subscription_credits')}</div>
          <div className={twFromTokens(fontWeights.semibold, isCompactUnderHeader ? textSizes.sm : textSizes.lg)}>{statsLoaded ? animatedTop.subscriptionCredits : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_equivalent', { amount: subscriptionUsd.toFixed(2) })}</div>}
        </div>
      </div>

      <div className={twFromTokens(textSizes.sm, 'bg-white rounded shadow flex items-center gap-4', isCompactUnderHeader ? 'p-2' : 'p-3')}>
        <div className={twFromTokens('flex-shrink-0 rounded-md flex items-center justify-center', isCompactUnderHeader ? 'p-2' : 'p-3', colors.surfaceMuted)}>
          <CreditCard className={twFromTokens(isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10', colors.textSecondary)} />
        </div>
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.purchased_credits')}</div>
          <div className={twFromTokens(fontWeights.semibold, isCompactUnderHeader ? textSizes.sm : textSizes.lg)}>{statsLoaded ? animatedTop.purchasedCredits : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_equivalent', { amount: purchasedUsd.toFixed(2) })}</div>}
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.total_available', { total })}</div>}
        </div>
      </div>

      <div className={twFromTokens(textSizes.sm, 'bg-white rounded shadow flex items-center gap-4', isCompactUnderHeader ? 'p-2' : 'p-3')}>
        <div className={twFromTokens('flex-shrink-0 rounded-md flex items-center justify-center', isCompactUnderHeader ? 'p-2' : 'p-3', colors.dangerBg)}>
          <DollarSign className={twFromTokens(isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10', colors.danger)} />
        </div>
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.total_spent')}</div>
          <div className={twFromTokens(fontWeights.semibold, isCompactUnderHeader ? textSizes.sm : textSizes.lg)}>{statsLoaded ? animatedTop.totalSpent : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_spent', { amount: spentUsd.toFixed(2) })}</div>}
        </div>
      </div>
    </div>
  )
}

export default CreditsSummary

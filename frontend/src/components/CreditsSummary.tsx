import type { FC } from 'react'
import { Shield, CreditCard, DollarSign } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, textSizes, baseFontSizes, colors, fontWeights, spacing, alignment } from '@/styles/styleTokens'

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
      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
        <div className={twFromTokens(alignment.flexRow, alignment.gap3)}>
          <div className={twFromTokens(spacing.iconWrapperCompact, colors.primaryBgLight)}>
            <Shield className={twFromTokens(spacing.iconsMd, colors.primary)} />
          </div>
          <div className={twFromTokens(textSizes.sm)}>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.subscription_credits')}</div>
            <div className={twFromTokens(textSizes.sm, fontWeights.semibold)}>{statsLoaded ? animatedTop.subscriptionCredits : null} {t('credits.unit')}</div>
            <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_amount', { amount: subscriptionUsd.toFixed(2) })}</div>
          </div>
        </div>

        <div className={twFromTokens(alignment.flexRow, alignment.gap3)}>
          <div className={twFromTokens(spacing.iconWrapperCompact, colors.surfaceMuted)}>
            <CreditCard className={twFromTokens(spacing.iconsMd, colors.textSecondary)} />
          </div>
          <div className={twFromTokens(textSizes.sm)}>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.purchased_credits')}</div>
            <div className={twFromTokens(textSizes.sm, fontWeights.semibold)}>{statsLoaded ? animatedTop.purchasedCredits : null} {t('credits.unit')}</div>
            <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_amount', { amount: purchasedUsd.toFixed(2) })}</div>
          </div>
        </div>

        <div className={twFromTokens(alignment.flexRow, alignment.gap3)}>
          <div className={twFromTokens(spacing.iconWrapperCompact, colors.dangerBg)}>
            <DollarSign className={twFromTokens(spacing.iconsMd, colors.danger)} />
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
    <div className={twFromTokens(alignment.flexCol, 'md:flex-row', alignment.itemsStart, 'md:items-center', alignment.gap4)}>
      <div className={twFromTokens(textSizes.sm, 'bg-white rounded shadow', alignment.flexRow, alignment.gap4, isCompactUnderHeader ? spacing.cardCompact : spacing.cardDefault)}>
        <div className={twFromTokens(isCompactUnderHeader ? spacing.iconWrapperCompact : spacing.iconWrapperLarge, colors.primaryMuted)}>
          <Shield className={twFromTokens(isCompactUnderHeader ? spacing.iconsSm : spacing.iconsMdLarge, colors.primary)} />
        </div>
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.subscription_credits')}</div>
          <div className={twFromTokens(fontWeights.semibold, isCompactUnderHeader ? textSizes.sm : textSizes.lg)}>{statsLoaded ? animatedTop.subscriptionCredits : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_equivalent', { amount: subscriptionUsd.toFixed(2) })}</div>}
        </div>
      </div>

      <div className={twFromTokens(textSizes.sm, 'bg-white rounded shadow', alignment.flexRow, alignment.gap4, isCompactUnderHeader ? spacing.cardCompact : spacing.cardDefault)}>
        <div className={twFromTokens(isCompactUnderHeader ? spacing.iconWrapperCompact : spacing.iconWrapperLarge, colors.surfaceMuted)}>
          <CreditCard className={twFromTokens(isCompactUnderHeader ? spacing.iconsSm : spacing.iconsMdLarge, colors.textSecondary)} />
        </div>
        <div>
          <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('credits.purchased_credits')}</div>
          <div className={twFromTokens(fontWeights.semibold, isCompactUnderHeader ? textSizes.sm : textSizes.lg)}>{statsLoaded ? animatedTop.purchasedCredits : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.usd_equivalent', { amount: purchasedUsd.toFixed(2) })}</div>}
          {!isCompactUnderHeader && <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('credits.total_available', { total })}</div>}
        </div>
      </div>

      <div className={twFromTokens(textSizes.sm, 'bg-white rounded shadow', alignment.flexRow, alignment.gap4, isCompactUnderHeader ? spacing.cardCompact : spacing.cardDefault)}>
        <div className={twFromTokens(isCompactUnderHeader ? spacing.iconWrapperCompact : spacing.iconWrapperLarge, colors.dangerBg)}>
          <DollarSign className={twFromTokens(isCompactUnderHeader ? spacing.iconsSm : spacing.iconsMdLarge, colors.danger)} />
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

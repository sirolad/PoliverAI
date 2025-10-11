import type { FC } from 'react'
import { Shield, CreditCard, DollarSign } from 'lucide-react'
import { t } from '@/i18n'

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
          <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center p-2`}>
            <Shield className={`h-6 w-6 text-blue-600`} />
          </div>
          <div className="text-sm">
            <div className="text-gray-600">{t('credits.subscription_credits')}</div>
            <div className="font-semibold text-sm">{statsLoaded ? animatedTop.subscriptionCredits : null} {t('credits.unit')}</div>
            <div className="text-xs text-gray-500">{t('credits.usd_amount', { amount: subscriptionUsd.toFixed(2) })}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center p-2`}>
            <CreditCard className={`h-6 w-6 text-gray-700`} />
          </div>
          <div className="text-sm">
            <div className="text-gray-600">{t('credits.purchased_credits')}</div>
            <div className="font-semibold text-sm">{statsLoaded ? animatedTop.purchasedCredits : null} {t('credits.unit')}</div>
            <div className="text-xs text-gray-500">{t('credits.usd_amount', { amount: purchasedUsd.toFixed(2) })}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 bg-red-50 rounded-md flex items-center justify-center p-2`}>
            <DollarSign className={`h-6 w-6 text-red-600`} />
          </div>
          <div className="text-sm">
            <div className="text-gray-600">{t('credits.total_spent')}</div>
            <div className="font-semibold text-sm">{statsLoaded ? animatedTop.totalSpent : null} {t('credits.unit')}</div>
            <div className="text-xs text-gray-500">{t('credits.usd_amount', { amount: spentUsd.toFixed(2) })}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
        <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
          <Shield className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
        </div>
        <div>
          <div className="text-gray-600">{t('credits.subscription_credits')}</div>
          <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.subscriptionCredits : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className="text-xs text-gray-500">{t('credits.usd_equivalent', { amount: subscriptionUsd.toFixed(2) })}</div>}
        </div>
      </div>

      <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
        <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
          <CreditCard className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-gray-700`} />
        </div>
        <div>
          <div className="text-gray-600">{t('credits.purchased_credits')}</div>
          <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.purchasedCredits : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className="text-xs text-gray-500">{t('credits.usd_equivalent', { amount: purchasedUsd.toFixed(2) })}</div>}
          {!isCompactUnderHeader && <div className="text-xs text-gray-500">{t('credits.total_available', { total })}</div>}
        </div>
      </div>

      <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
        <div className={`flex-shrink-0 bg-red-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
          <DollarSign className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-red-600`} />
        </div>
        <div>
          <div className="text-gray-600">{t('credits.total_spent')}</div>
          <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.totalSpent : null} {t('credits.unit')}</div>
          {!isCompactUnderHeader && <div className="text-xs text-gray-500">{t('credits.usd_spent', { amount: spentUsd.toFixed(2) })}</div>}
        </div>
      </div>
    </div>
  )
}

export default CreditsSummary

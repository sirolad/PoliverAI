// React import not required in new JSX transform
import { t } from '@/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { twFromTokens, textSizes, baseFontSizes, colors, fontWeights, hoverFromColor } from '@/styles/styleTokens'
import { Button } from '@/components/ui/Button'
import { FileCheck, Star, ArrowRight, RefreshCcw, Trash2, BarChart, CreditCard } from 'lucide-react'
import useAccountStatusActions from '@/hooks/useAccountStatus'
import type { ReportMetadata } from '@/types/api'

type Props = {
  isPro: boolean
  user: { subscription_expires?: string | null } | null
  dashboardLoaded: boolean
  animatedCredits: { subscriptionCredits: number; purchasedCredits: number; effectiveCredits: number }
  animatedSaved: { totalSavedFiles: number; fullReportsSaved: number; freeReportsSaved: number }
  animatedDeleted: { deletedFull: number; deletedRevision: number; deletedFree: number; deletedTotal: number }
  animatedCompleted: { fullReportsDone: number; revisedCompleted: number; freeReportsCompleted: number }
  animatedTx: { total_bought_credits: number; total_spent_credits: number; total_subscription_usd: number }
  reportsRange: { from: string | null; to: string | null }
  setReportsRange: (r: { from: string | null; to: string | null }) => void
  completedRange: { from: string | null; to: string | null }
  setCompletedRange: (r: { from: string | null; to: string | null }) => void
  txRange: { from: string | null; to: string | null }
  setTxRange: (r: { from: string | null; to: string | null }) => void
  defaultFrom: string | null
  defaultTo: string | null
  getCostForReport: (r: ReportMetadata) => { credits: number; usd: number }
  userReports: ReportMetadata[] | null
  txTotals: { total_bought_credits?: number; total_spent_credits?: number; total_subscription_usd?: number } | null
  totalSavedCredits: number | null
  totalSavedUsd: number | null
  formatRangeLabel: (range: { from: string | null; to: string | null }, defFrom: string | null, defTo: string | null) => string
}

export default function AccountStatus(props: Props) {
  const { purchaseUpgrade, purchaseUpgradeAndDispatch, refresh } = useAccountStatusActions(props.setReportsRange as unknown as undefined)
  const {
    isPro,
    user,
    dashboardLoaded,
    animatedCredits,
    animatedSaved,
    animatedDeleted,
    animatedCompleted,
    animatedTx,
    reportsRange,
    setReportsRange,
    completedRange,
    setCompletedRange,
    txRange,
    setTxRange,
    defaultFrom,
    defaultTo,
    getCostForReport,
    userReports,
    txTotals,
    totalSavedCredits,
    totalSavedUsd,
    formatRangeLabel,
  } = props

  return (
    <Card className={twFromTokens('mb-8')}>
      <CardHeader>
        <div className={twFromTokens('flex items-center justify-between')}>
          <div>
            <CardTitle className={twFromTokens('flex items-center gap-2')}>
                <Star className={twFromTokens('h-5 w-5', isPro ? colors.primary : colors.success)} />
              {t('dashboard.account_status.title')}
            </CardTitle>
            <CardDescription>
              {isPro ? t('dashboard.account_status.on_plan_pro') : t('dashboard.account_status.on_plan_free')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <span className={twFromTokens('px-3 py-1 rounded-full', textSizes.sm, fontWeights.medium, isPro ? colors.primaryBgLight : colors.successBg, isPro ? colors.primaryMuted : colors.success)}>
              {isPro ? t('dashboard.account_status.badge_pro') : t('dashboard.account_status.badge_free')}
            </span>
            {!isPro && (
              <Button
                  className={twFromTokens(colors.primaryBg, hoverFromColor(colors.primaryBg))}
                  onClick={purchaseUpgrade}
                  icon={<ArrowRight className={twFromTokens('h-4 w-4', colors.onPrimary)} />}
                  collapseToIcon
                >
                  {t('dashboard.account_status.upgrade_cta') || 'Upgrade to Pro'}
                </Button>
            )}
            <Button size="sm" variant="outline" onClick={refresh} icon={<RefreshCcw className={twFromTokens('h-4 w-4', colors.textMuted)} />} collapseToIcon>
              {t('dashboard.account_status.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isPro && (
        <CardContent>
          <div className={twFromTokens('rounded-lg p-4', colors.surfaceMuted, colors.mutedBorder)}>
            <h3 className={twFromTokens(fontWeights.medium, colors.primaryMuted, 'mb-2')}>{t('dashboard.account_status.unlock_heading')}</h3>
            <p className={twFromTokens(textSizes.sm, colors.primary)}>{t('dashboard.account_status.unlock_paragraph')}</p>
            <Button
              size="sm"
              className={twFromTokens(colors.primaryBg, hoverFromColor(colors.primary))}
              onClick={purchaseUpgradeAndDispatch}
              icon={<ArrowRight className={twFromTokens('h-4 w-4', colors.onPrimary)} />}
            >
              {t('dashboard.account_status.learn_more')}
            </Button>
          </div>
        </CardContent>
      )}
      <CardContent>
        <div className={twFromTokens('flex items-center justify-between')}>
          <div>
            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.title')}</div>
            <div className={twFromTokens(textSizes.lead, fontWeights.semibold)}>{dashboardLoaded ? animatedCredits.subscriptionCredits : null}</div>
          </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.total_files_saved')}</div>
              <div className={twFromTokens(textSizes.lead, fontWeights.semibold)}>{dashboardLoaded ? animatedCredits.purchasedCredits : null}</div>
            </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.total_full_reports_saved')}</div>
              <div className={twFromTokens(textSizes.lead, fontWeights.semibold)}>{dashboardLoaded ? animatedCredits.effectiveCredits : null}</div>
            </div>
        </div>
        {user && user.subscription_expires && (
          <div className={twFromTokens('mt-2', textSizes.sm, colors.textMutedLight)}>Subscription expires: {new Date(user.subscription_expires).toLocaleDateString()}</div>
        )}
        <div className={twFromTokens('mt-3', textSizes.sm, colors.textMuted)}>
          <strong>{t('dashboard.credits.heading')}</strong> {t('dashboard.credits.explanation')}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, 'mb-2', 'flex items-center gap-2')}><FileCheck className={twFromTokens('h-4 w-4', colors.textMuted)} />{t('dashboard.saved_files.title')}</h4>
            <div className="flex items-center gap-2">
              <input type="date" value={reportsRange.from ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, from: e.target.value || null })} className={twFromTokens('border', colors.mutedBorder, 'px-2 py-1 rounded', textSizes.sm)} />
              <input type="date" value={reportsRange.to ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, to: e.target.value || null })} className={twFromTokens('border', colors.mutedBorder, 'px-2 py-1 rounded', textSizes.sm)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.total_files_saved')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedSaved.totalSavedFiles : null}</div>
            </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.total_full_reports_saved')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedSaved.fullReportsSaved : null}</div>
            </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.total_free_reports_saved')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedSaved.freeReportsSaved : null}</div>
            </div>
          </div>

          <div className="mb-4 mt-4">
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, 'mb-2', 'flex items-center gap-2')}><Trash2 className={twFromTokens('h-4 w-4', colors.textMuted)} />{t('dashboard.deleted_files.title')}</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.deleted_files.deleted_full')}</div>
                <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedDeleted.deletedFull : null}</div>
              </div>
              <div>
                <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.deleted_files.deleted_revision')}</div>
                <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedDeleted.deletedRevision : null}</div>
              </div>
              <div>
                <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.deleted_files.deleted_free')}</div>
                <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedDeleted.deletedFree : null}</div>
              </div>
              <div>
                <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.deleted_files.deleted_total')}</div>
                <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedDeleted.deletedTotal : null}</div>
              </div>
            </div>
          </div>
          <div className={twFromTokens('mt-3', textSizes.sm, colors.textMuted)}>
            <strong>{t('dashboard.deleted_files.how_to_limit')}</strong> {t('dashboard.deleted_files.how_to_limit_explain') || ''}
          </div>
          <div className={twFromTokens('mt-3', textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.estimated_cost')} <span className={twFromTokens(fontWeights.semibold)}>{totalSavedCredits !== null ? `${totalSavedCredits} credits` : '—'}</span> (<span className={twFromTokens(fontWeights.semibold)}>{totalSavedUsd !== null ? `$${totalSavedUsd.toFixed(2)}` : '—'}</span>)</div>
          <div className={twFromTokens('mt-1', baseFontSizes.xs, colors.textMutedLight)}>{formatRangeLabel(reportsRange, defaultFrom, defaultTo)}</div>
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, 'mb-2', 'flex items-center gap-2')}><BarChart className={twFromTokens('h-4 w-4', colors.textMuted)} />{t('dashboard.completed_reports.title')}</h4>
            <div className="flex items-center gap-2">
              <input type="date" value={completedRange.from ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, from: e.target.value || null })} className={twFromTokens('border', colors.mutedBorder, 'px-2 py-1 rounded', textSizes.sm)} />
              <input type="date" value={completedRange.to ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, to: e.target.value || null })} className={twFromTokens('border', colors.mutedBorder, 'px-2 py-1 rounded', textSizes.sm)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.completed_reports.full_reports_completed')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedCompleted.fullReportsDone : null}</div>
            </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.completed_reports.revised_policies_completed')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedCompleted.revisedCompleted : null}</div>
            </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.completed_reports.free_reports_completed')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedCompleted.freeReportsCompleted : null}</div>
              <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{t('dashboard.completed_reports.free_cost_label')}</div>
            </div>
          </div>
          {userReports ? (
            <div className={twFromTokens('mt-3', textSizes.sm, colors.textMuted)}>
              {t('dashboard.completed_reports.estimated_cost_label')} <span className={twFromTokens(fontWeights.semibold)}>{
                (() => {
                  const completed = userReports.filter((r) => {
                    if (typeof r.status !== 'undefined') return r.status === 'completed'
                    return true
                  })
                  const creds = completed.reduce((acc, r) => acc + getCostForReport(r).credits, 0)
                  return `${creds} credits`
                })()
              }</span> (<span className={twFromTokens(fontWeights.semibold)}>{
                (() => {
                  const completed = userReports.filter((r) => {
                    if (typeof r.status !== 'undefined') return r.status === 'completed'
                    return true
                  })
                  const usd = completed.reduce((acc, r) => acc + getCostForReport(r).usd, 0)
                  return `$${usd.toFixed(2)}`
                })()
              }</span>)
            </div>
          ) : null}
          <div className={twFromTokens('mt-1', baseFontSizes.xs, colors.textMutedLight)}>{formatRangeLabel(completedRange, defaultFrom, defaultTo)}</div>
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-600" />{t('dashboard.transactions.title')}</h4>
            <div className="flex items-center gap-2">
              <input type="date" value={txRange.from ?? ''} onChange={(e) => setTxRange({ ...txRange, from: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
              <input type="date" value={txRange.to ?? ''} onChange={(e) => setTxRange({ ...txRange, to: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.transactions.total_bought')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedTx.total_bought_credits : null}</div>
              <div className="text-sm text-gray-500">{dashboardLoaded && txTotals?.total_bought_credits ? `${txTotals.total_bought_credits} credits` : ''}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.transactions.total_spent')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedTx.total_spent_credits : null}</div>
              <div className="text-sm text-gray-500">{dashboardLoaded && txTotals?.total_spent_credits ? `${txTotals.total_spent_credits} credits` : ''}</div>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">{formatRangeLabel(txRange, defaultFrom, defaultTo)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

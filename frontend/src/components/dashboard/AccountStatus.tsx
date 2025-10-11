// React import not required in new JSX transform
import { t } from '@/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className={`h-5 w-5 ${isPro ? 'text-blue-600' : 'text-green-600'}`} />
              {t('dashboard.account_status.title')}
            </CardTitle>
            <CardDescription>
              {isPro ? t('dashboard.account_status.on_plan_pro') : t('dashboard.account_status.on_plan_free')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPro ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}
            >
              {isPro ? t('dashboard.account_status.badge_pro') : t('dashboard.account_status.badge_free')}
            </span>
            {!isPro && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={purchaseUpgrade}
                icon={<ArrowRight className="h-4 w-4" />}
                collapseToIcon
              >
                {t('dashboard.account_status.upgrade_cta') || 'Upgrade to Pro'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={refresh} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
              {t('dashboard.account_status.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isPro && (
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">{t('dashboard.account_status.unlock_heading')}</h3>
            <p className="text-sm text-blue-700 mb-3">{t('dashboard.account_status.unlock_paragraph')}</p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={purchaseUpgradeAndDispatch}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              {t('dashboard.account_status.learn_more')}
            </Button>
          </div>
        </CardContent>
      )}
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">{t('dashboard.saved_files.title')}</div>
            <div className="text-xl font-semibold">{dashboardLoaded ? animatedCredits.subscriptionCredits : null}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">{t('dashboard.saved_files.total_files_saved')}</div>
            <div className="text-xl font-semibold">{dashboardLoaded ? animatedCredits.purchasedCredits : null}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">{t('dashboard.saved_files.total_full_reports_saved')}</div>
            <div className="text-xl font-semibold">{dashboardLoaded ? animatedCredits.effectiveCredits : null}</div>
          </div>
        </div>
        {user && user.subscription_expires && (
          <div className="mt-2 text-sm text-gray-500">Subscription expires: {new Date(user.subscription_expires).toLocaleDateString()}</div>
        )}
        <div className="mt-3 text-sm text-gray-600">
          <strong>{t('dashboard.credits.heading')}</strong> {t('dashboard.credits.explanation')}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><FileCheck className="h-4 w-4 text-gray-600" />{t('dashboard.saved_files.title')}</h4>
            <div className="flex items-center gap-2">
              <input type="date" value={reportsRange.from ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, from: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
              <input type="date" value={reportsRange.to ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, to: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.saved_files.total_files_saved')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.totalSavedFiles : null}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.saved_files.total_full_reports_saved')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.fullReportsSaved : null}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.saved_files.total_free_reports_saved')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.freeReportsSaved : null}</div>
            </div>
          </div>

          <div className="mb-4 mt-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><Trash2 className="h-4 w-4 text-gray-600" />{t('dashboard.deleted_files.title')}</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t('dashboard.deleted_files.deleted_full')}</div>
                <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedFull : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('dashboard.deleted_files.deleted_revision')}</div>
                <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedRevision : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('dashboard.deleted_files.deleted_free')}</div>
                <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedFree : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('dashboard.deleted_files.deleted_total')}</div>
                <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedTotal : null}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <strong>{t('dashboard.deleted_files.how_to_limit')}</strong> {t('dashboard.deleted_files.how_to_limit_explain') || ''}
          </div>
          <div className="mt-3 text-sm text-gray-600">{t('dashboard.saved_files.estimated_cost')} <span className="font-semibold">{totalSavedCredits !== null ? `${totalSavedCredits} credits` : '—'}</span> (<span className="font-semibold">{totalSavedUsd !== null ? `$${totalSavedUsd.toFixed(2)}` : '—'}</span>)</div>
          <div className="mt-1 text-xs text-gray-500">{formatRangeLabel(reportsRange, defaultFrom, defaultTo)}</div>
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><BarChart className="h-4 w-4 text-gray-600" />{t('dashboard.completed_reports.title')}</h4>
            <div className="flex items-center gap-2">
              <input type="date" value={completedRange.from ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, from: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
              <input type="date" value={completedRange.to ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, to: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.completed_reports.full_reports_completed')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedCompleted.fullReportsDone : null}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.completed_reports.revised_policies_completed')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedCompleted.revisedCompleted : null}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('dashboard.completed_reports.free_reports_completed')}</div>
              <div className="text-lg font-semibold">{dashboardLoaded ? animatedCompleted.freeReportsCompleted : null}</div>
              <div className="text-xs text-gray-500">{t('dashboard.completed_reports.free_cost_label')}</div>
            </div>
          </div>
          {userReports ? (
            <div className="mt-3 text-sm text-gray-600">
              {t('dashboard.completed_reports.estimated_cost_label')} <span className="font-semibold">{
                (() => {
                  const completed = userReports.filter((r) => {
                    if (typeof r.status !== 'undefined') return r.status === 'completed'
                    return true
                  })
                  const creds = completed.reduce((acc, r) => acc + getCostForReport(r).credits, 0)
                  return `${creds} credits`
                })()
              }</span> (<span className="font-semibold">{
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
          <div className="mt-1 text-xs text-gray-500">{formatRangeLabel(completedRange, defaultFrom, defaultTo)}</div>
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

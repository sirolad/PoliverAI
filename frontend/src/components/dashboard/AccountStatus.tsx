// React import not required in new JSX transform
import { t } from '@/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { twFromTokens, textSizes, baseFontSizes, colors, fontWeights, hoverFromColor, spacing, alignment } from '@/styles/styleTokens'
import { Button } from '@/components/ui/Button'
import { FileCheck, Star, ArrowRight, RefreshCcw, Trash2, BarChart, CreditCard } from 'lucide-react'
import useAccountStatusActions from '@/hooks/useAccountStatus'
import type { ReportMetadata } from '@/types/api'
import { badgeClass } from '@/lib/navHelpers'

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
    <Card className={twFromTokens(spacing.headingLarge)}>
      <CardHeader>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          <div>
            <CardTitle className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
                <Star className={twFromTokens(spacing.iconsMd, isPro ? colors.primary : colors.success)} />
              {t('dashboard.account_status.title')}
            </CardTitle>
            <CardDescription>
              {isPro ? t('dashboard.account_status.on_plan_pro') : t('dashboard.account_status.on_plan_free')}
            </CardDescription>
          </div>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap4)}>
            <span className={twFromTokens(spacing.badgePadding, 'rounded-full', textSizes.sm, fontWeights.medium, badgeClass(isPro))}>
              {isPro ? t('dashboard.account_status.badge_pro') : t('dashboard.account_status.badge_free')}
            </span>
            
            {!isPro && (
              <Button
                  className={twFromTokens(colors.primaryBg, hoverFromColor(colors.primaryBg))}
                  onClick={purchaseUpgrade}
                  icon={<ArrowRight className={twFromTokens(spacing.iconsXs, colors.onPrimary)} />}
                  collapseToIcon
                >
                  {t('dashboard.account_status.upgrade_cta') || 'Upgrade to Pro'}
                </Button>
            )}
            <Button size="sm" variant="outline" onClick={refresh} icon={<RefreshCcw className={twFromTokens(spacing.iconsXs, colors.textMuted)} />} collapseToIcon>
              {t('dashboard.account_status.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isPro && (
        <CardContent>
          <div className={twFromTokens('rounded-lg', spacing.cardDefault, colors.surfaceMuted, colors.mutedBorder)}>
            <h3 className={twFromTokens(fontWeights.medium, colors.primaryMuted, spacing.headingMargin)}>{t('dashboard.account_status.unlock_heading')}</h3>
            <p className={twFromTokens(textSizes.sm, colors.primary)}>{t('dashboard.account_status.unlock_paragraph')}</p>
            <Button
              size="sm"
              className={twFromTokens(colors.primaryBg, hoverFromColor(colors.primary))}
              onClick={purchaseUpgradeAndDispatch}
              icon={<ArrowRight className={twFromTokens(spacing.iconsXs, colors.onPrimary)} />}
            >
              {t('dashboard.account_status.learn_more')}
            </Button>
          </div>
        </CardContent>
      )}
      <CardContent>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
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
          <div className={twFromTokens(spacing.tinyTop, textSizes.sm, colors.textMutedLight)}>Subscription expires: {new Date(user.subscription_expires).toLocaleDateString()}</div>
        )}
        <div className={twFromTokens(spacing.mt3, textSizes.sm, colors.textMuted)}>
          <strong>{t('dashboard.credits.heading')}</strong> {t('dashboard.credits.explanation')}
        </div>

        <div className={twFromTokens(spacing.sectionButtonTop, 'border-t', spacing.progressTop)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, spacing.headingMargin, alignment.flexRow, alignment.gap2)}><FileCheck className={twFromTokens(spacing.iconsXs, colors.textMuted)} />{t('dashboard.saved_files.title')}</h4>
            <div className={twFromTokens(alignment.flexRow, alignment.gap2)}>
              <input type="date" value={reportsRange.from ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, from: e.target.value || null })} className={twFromTokens(colors.mutedBorder, spacing.input, textSizes.sm)} />
              <input type="date" value={reportsRange.to ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, to: e.target.value || null })} className={twFromTokens(colors.mutedBorder, spacing.input, textSizes.sm)} />
            </div>
          </div>
          <div className={twFromTokens('grid grid-cols-3', alignment.gap4)}>
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

          <div className={twFromTokens(spacing.formRow, spacing.blockSmall)}>
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, spacing.headingMargin, alignment.flexRow, alignment.gap2)}><Trash2 className={twFromTokens(spacing.iconsXs, colors.textMuted)} />{t('dashboard.deleted_files.title')}</h4>
            <div className={twFromTokens('grid grid-cols-4', alignment.gap4)}>
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
          <div className={twFromTokens(spacing.mt3, textSizes.sm, colors.textMuted)}>
            <strong>{t('dashboard.deleted_files.how_to_limit')}</strong> {t('dashboard.deleted_files.how_to_limit_explain') || ''}
          </div>
          <div className={twFromTokens(spacing.mt3, textSizes.sm, colors.textMuted)}>{t('dashboard.saved_files.estimated_cost')} <span className={twFromTokens(fontWeights.semibold)}>{totalSavedCredits !== null ? `${totalSavedCredits} credits` : '—'}</span> (<span className={twFromTokens(fontWeights.semibold)}>{totalSavedUsd !== null ? `$${totalSavedUsd.toFixed(2)}` : '—'}</span>)</div>
          <div className={twFromTokens(spacing.tinyTop, baseFontSizes.xs, colors.textMutedLight)}>{formatRangeLabel(reportsRange, defaultFrom, defaultTo)}</div>
        </div>

        <div className={twFromTokens(spacing.sectionButtonTop, 'border-t', spacing.progressTop)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, spacing.headingMargin, alignment.flexRow, alignment.gap2)}><BarChart className={twFromTokens(spacing.iconsXs, colors.textMuted)} />{t('dashboard.completed_reports.title')}</h4>
            <div className={twFromTokens(alignment.flexRow, alignment.gap2)}>
              <input type="date" value={completedRange.from ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, from: e.target.value || null })} className={twFromTokens(colors.mutedBorder, spacing.input, textSizes.sm)} />
              <input type="date" value={completedRange.to ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, to: e.target.value || null })} className={twFromTokens(colors.mutedBorder, spacing.input, textSizes.sm)} />
            </div>
          </div>
          <div className={twFromTokens('grid grid-cols-3', alignment.gap4)}>
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
            <div className={twFromTokens(spacing.mt3, textSizes.sm, colors.textMuted)}>
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
          <div className={twFromTokens(spacing.tinyTop, baseFontSizes.xs, colors.textMutedLight)}>{formatRangeLabel(completedRange, defaultFrom, defaultTo)}</div>
        </div>

        <div className={twFromTokens(spacing.sectionButtonTop, 'border-t', spacing.progressTop)}>
          <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
            <h4 className={twFromTokens(textSizes.sm, fontWeights.medium, colors.textPrimary, spacing.headingMargin, alignment.flexRow, alignment.gap2)}><CreditCard className={twFromTokens(spacing.iconsXs, colors.textMuted)} />{t('dashboard.transactions.title')}</h4>
            <div className={twFromTokens(alignment.flexRow, alignment.gap2)}>
              <input type="date" value={txRange.from ?? ''} onChange={(e) => setTxRange({ ...txRange, from: e.target.value || null })} className={twFromTokens(colors.mutedBorder, spacing.input, textSizes.sm)} />
              <input type="date" value={txRange.to ?? ''} onChange={(e) => setTxRange({ ...txRange, to: e.target.value || null })} className={twFromTokens(colors.mutedBorder, spacing.input, textSizes.sm)} />
            </div>
          </div>
          <div className={twFromTokens('grid grid-cols-2', alignment.gap4)}>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.transactions.total_bought')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedTx.total_bought_credits : null}</div>
              <div className={twFromTokens(textSizes.sm, colors.textMutedLight)}>{dashboardLoaded && txTotals?.total_bought_credits ? `${txTotals.total_bought_credits} credits` : ''}</div>
            </div>
            <div>
              <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{t('dashboard.transactions.total_spent')}</div>
              <div className={twFromTokens(textSizes.lg, fontWeights.semibold)}>{dashboardLoaded ? animatedTx.total_spent_credits : null}</div>
              <div className={twFromTokens(textSizes.sm, colors.textMutedLight)}>{dashboardLoaded && txTotals?.total_spent_credits ? `${txTotals.total_spent_credits} credits` : ''}</div>
            </div>
          </div>
          <div className={twFromTokens(spacing.tinyTop, baseFontSizes.xs, colors.textMutedLight)}>{formatRangeLabel(txRange, defaultFrom, defaultTo)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

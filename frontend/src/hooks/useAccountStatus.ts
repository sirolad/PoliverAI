import { t } from '@/i18n'
import PaymentsService from '@/services/payments'
import { safeDispatch } from '@/lib/eventHelpers'

export default function useAccountStatusActions(refreshUser?: () => Promise<void>) {
  const purchaseUpgrade = async () => {
    try {
      await PaymentsService.purchaseUpgrade(29)
      safeDispatch('payment:result', { success: true, title: t('dashboard.account_status.upgrade_success_title') || 'Upgrade Successful', message: t('dashboard.account_status.upgrade_success_message') || 'Your account is now PRO' })
      window.location.reload()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      safeDispatch('payment:result', { success: false, title: t('payments.failed') || 'Payment Failed', message: msg })
    }
  }

  const purchaseUpgradeAndDispatch = async () => {
    try {
      await PaymentsService.purchaseUpgrade(29)
      window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: true, title: t('dashboard.account_status.upgrade_success_title') || 'Upgrade Successful', message: t('dashboard.account_status.upgrade_success_message') || 'Your account is now PRO' } }))
      window.location.reload()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: false, title: t('payments.failed') || 'Payment Failed', message: msg } }))
    }
  }

  const refresh = () => {
    try {
      refreshUser?.().catch((e) => console.warn('Failed to refresh user from AccountStatus hook', e))
    } catch (e) {
      console.warn('Failed to call refreshUser', e)
    }
  }

  return {
    purchaseUpgrade,
    purchaseUpgradeAndDispatch,
    refresh,
  }
}

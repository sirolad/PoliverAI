

// React Native: Remove window.location.reload and window.dispatchEvent

import { t } from "..";
import PaymentsService, { safeDispatch } from "../services/payments";

// Use context or navigation for refresh and event handling
export default function useAccountStatusActions(refreshUser?: () => Promise<void>) {
  const purchaseUpgrade = async () => {
    try {
      await PaymentsService.purchaseUpgrade(29);
      safeDispatch('payment:result', { success: true, title: t('dashboard.account_status.upgrade_success_title') || 'Upgrade Successful', message: t('dashboard.account_status.upgrade_success_message') || 'Your account is now PRO' });
      // TODO: Use navigation or context to refresh UI
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      safeDispatch('payment:result', { success: false, title: t('payments.failed') || 'Payment Failed', message: msg });
    }
  };

  // purchaseUpgradeAndDispatch is merged with purchaseUpgrade for RN

  const refresh = () => {
    try {
      refreshUser?.().catch((e) => console.warn('Failed to refresh user from AccountStatus hook', e));
    } catch (e) {
      console.warn('Failed to call refreshUser', e);
    }
  };

  return {
    purchaseUpgrade,
    refresh,
  };
}

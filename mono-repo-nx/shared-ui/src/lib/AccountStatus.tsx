import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PaymentsService, t, useAccountStatus } from '@poliverai/intl';
import { BarChart3, Crown, FolderKanban, RefreshCcw, Sparkles, Trash2, WalletCards } from 'lucide-react-native';

type Range = { from: string | null; to: string | null };

type WebDateInputProps = {
  value: string | null;
  onChange: (value: string | null) => void;
};

const webDateInputStyle = {
  minWidth: 136,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#cbd5e1',
  borderRadius: 12,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  backgroundColor: '#ffffff',
  fontSize: 14,
  color: '#0f172a',
  outlineStyle: 'none',
} as const;

export interface AccountStatusProps {
  isPro: boolean;
  user: {
    subscription_expires?: string | null;
  } | null;
  dashboardLoaded: boolean;
  animatedCredits: {
    subscriptionCredits: number;
    purchasedCredits: number;
    effectiveCredits: number;
  };
  animatedSaved: {
    totalSavedFiles: number;
    fullReportsSaved: number;
    freeReportsSaved: number;
  };
  animatedDeleted: {
    deletedFull: number;
    deletedRevision: number;
    deletedFree: number;
    deletedTotal: number;
  };
  animatedCompleted: {
    fullReportsDone: number;
    revisedCompleted: number;
    freeReportsCompleted: number;
  };
  animatedTx: {
    total_bought_credits: number;
    total_spent_credits: number;
  };
  reportsRange: Range;
  setReportsRange: React.Dispatch<React.SetStateAction<Range>>;
  completedRange: Range;
  setCompletedRange: React.Dispatch<React.SetStateAction<Range>>;
  txRange: Range;
  setTxRange: React.Dispatch<React.SetStateAction<Range>>;
  defaultFrom: string | null;
  defaultTo: string | null;
  getCostForReport: (report?: unknown) => number;
  userReports: unknown[] | null;
  txTotals: {
    total_bought_credits?: number;
    total_spent_credits?: number;
  };
  totalSavedCredits: number;
  totalSavedUsd: number;
  formatRangeLabel: (range: Range, defFrom?: string | null, defTo?: string | null) => string;
  onRefresh?: () => Promise<void>;
}

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

function InlineIcon({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'slate' | 'amber' }) {
  return (
    <View
      style={[
        styles.inlineIcon,
        tone === 'green' ? styles.iconGreen : null,
        tone === 'slate' ? styles.iconSlate : null,
        tone === 'amber' ? styles.iconAmber : null,
      ]}
    >
      {typeof children === 'string' ? <Text style={styles.inlineIconText}>{children}</Text> : children}
    </View>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {suffix ? <Text style={styles.metricSuffix}> {suffix}</Text> : null}
      </Text>
    </View>
  );
}

function WebDateInput({ value, onChange }: WebDateInputProps) {
  return React.createElement('input', {
    type: 'date',
    value: value ?? '',
    onChange: (event: { target?: { value?: string } }) => onChange(event.target?.value || null),
    style: webDateInputStyle as unknown as Record<string, unknown>,
  });
}

function RangeInputs({ range, setRange }: { range: Range; setRange: React.Dispatch<React.SetStateAction<Range>> }) {
  return (
    <View style={styles.rangeRow}>
      {Platform.OS === 'web' ? (
        <>
          <WebDateInput value={range.from} onChange={(value) => setRange((current) => ({ ...current, from: value }))} />
          <WebDateInput value={range.to} onChange={(value) => setRange((current) => ({ ...current, to: value }))} />
        </>
      ) : (
        <>
          <TextInput
            value={range.from ?? ''}
            onChangeText={(value) => setRange((current) => ({ ...current, from: value || null }))}
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
          />
          <TextInput
            value={range.to ?? ''}
            onChangeText={(value) => setRange((current) => ({ ...current, to: value || null }))}
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
          />
        </>
      )}
    </View>
  );
}

export default function AccountStatus(props: AccountStatusProps) {
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
    onRefresh,
  } = props;
  const { refresh } = useAccountStatus(onRefresh);

  const completedCostCredits = Array.isArray(userReports)
    ? userReports.reduce<number>((total, report) => total + getCostForReport(report), 0)
    : 0;
  const completedCostUsd = completedCostCredits / 10;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <InlineIcon tone={isPro ? 'blue' : 'green'}>
              {isPro ? <Crown size={14} color="#1d4ed8" /> : <Sparkles size={14} color="#166534" />}
            </InlineIcon>
            <Text style={styles.sectionTitle}>{copy('dashboard.account_status.title', 'Account Status')}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {isPro
              ? copy('dashboard.account_status.on_plan_pro', 'You are currently on the Pro plan')
              : copy('dashboard.account_status.on_plan_free', 'You are currently on the Free plan')}
          </Text>
        </View>
        <View style={styles.topActions}>
          <View style={[styles.planTag, isPro ? styles.proPlanTag : styles.freePlanTag]}>
            <Text style={styles.planTagText}>{isPro ? 'PRO PLAN' : 'FREE PLAN'}</Text>
          </View>
          {!isPro ? (
            <Pressable onPress={() => PaymentsService.purchaseUpgrade(29).catch(() => undefined)} style={styles.primaryButton}>
              <View style={styles.buttonInner}>
                <Crown size={16} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Upgrade to Pro</Text>
              </View>
            </Pressable>
          ) : null}
          <Pressable onPress={refresh} style={styles.outlineButton}>
            <View style={styles.buttonInner}>
              <RefreshCcw size={16} color="#0f172a" />
              <Text style={styles.outlineButtonText}>Refresh</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {!isPro ? (
        <View style={styles.promoCard}>
        <View style={styles.promoTitleRow}>
          <InlineIcon tone="blue">
            <Sparkles size={14} color="#1d4ed8" />
          </InlineIcon>
          <Text style={styles.promoTitle}>Unlock Premium Features</Text>
        </View>
          <Text style={styles.promoBody}>
            Get AI-powered deep analysis, comprehensive reporting, and policy generation with our Pro plan starting at $29/month.
          </Text>
          <Pressable onPress={() => PaymentsService.purchaseUpgrade(29).catch(() => undefined)} style={styles.learnButton}>
            <View style={styles.buttonInner}>
              <Sparkles size={16} color="#ffffff" />
              <Text style={styles.learnButtonText}>Learn More</Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        <Metric label="Subscription credits" value={dashboardLoaded ? animatedCredits.subscriptionCredits : 0} />
        <Metric label="Purchased credits" value={dashboardLoaded ? animatedCredits.purchasedCredits : 0} />
        <Metric label="Total available" value={dashboardLoaded ? animatedCredits.effectiveCredits : 0} />
      </View>
      {user?.subscription_expires ? (
        <Text style={styles.subtleMeta}>Subscription expires: {new Date(user.subscription_expires).toLocaleDateString()}</Text>
      ) : null}
      <Text style={styles.explainer}>
        <Text style={styles.explainerStrong}>How credits are used: </Text>
        Subscription credits are consumed first and each subscription credit covers ~1.5x of a regular credit (discounted). If subscription credits run out, the system falls back to purchased credits which are charged at a slightly higher rate (penalty ~1.25x).
      </Text>

      <View style={styles.divider} />

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <View style={styles.blockTitleRow}>
            <InlineIcon tone="slate">
              <FolderKanban size={14} color="#0f172a" />
            </InlineIcon>
            <Text style={styles.blockTitle}>Saved Files</Text>
          </View>
          <RangeInputs range={reportsRange} setRange={setReportsRange} />
        </View>
        <View style={styles.statsGrid}>
          <Metric label="Total files saved" value={dashboardLoaded ? animatedSaved.totalSavedFiles : 0} />
          <Metric label="Total full reports saved" value={dashboardLoaded ? animatedSaved.fullReportsSaved : 0} />
          <Metric label="Total free reports saved" value={dashboardLoaded ? animatedSaved.freeReportsSaved : 0} />
        </View>

        <View style={styles.blockTitleRow}>
          <InlineIcon tone="slate">
            <Trash2 size={14} color="#0f172a" />
          </InlineIcon>
          <Text style={styles.blockTitle}>Deleted Files</Text>
        </View>
        <View style={styles.statsGridFour}>
          <Metric label="Deleted full reports" value={dashboardLoaded ? animatedDeleted.deletedFull : 0} />
          <Metric label="Deleted revised policies" value={dashboardLoaded ? animatedDeleted.deletedRevision : 0} />
          <Metric label="Deleted free reports" value={dashboardLoaded ? animatedDeleted.deletedFree : 0} />
          <Metric label="Total deleted files" value={dashboardLoaded ? animatedDeleted.deletedTotal : 0} />
        </View>

        <Text style={styles.explainer}>
          <Text style={styles.explainerStrong}>How limit results by date: </Text>
          Use the "Saved Files" date picker at the top of this card to narrow the Saved Files and Deleted Files counts to a specific range. The dashboard filters deletion events recorded in this browser. If no per-event data is available (older installs), the dashboard falls back to legacy all-time totals stored locally.
        </Text>
        <Text style={styles.rangeMeta}>Estimated cost: {totalSavedCredits} credits (${totalSavedUsd.toFixed(2)})</Text>
        <Text style={styles.subtleMeta}>{formatRangeLabel(reportsRange, defaultFrom, defaultTo)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <View style={styles.blockTitleRow}>
            <InlineIcon tone="slate">
              <BarChart3 size={14} color="#0f172a" />
            </InlineIcon>
            <Text style={styles.blockTitle}>Completed Reports</Text>
          </View>
          <RangeInputs range={completedRange} setRange={setCompletedRange} />
        </View>
        <View style={styles.statsGrid}>
          <Metric label="Full reports completed" value={dashboardLoaded ? animatedCompleted.fullReportsDone : 0} />
          <Metric label="Revised policies completed" value={dashboardLoaded ? animatedCompleted.revisedCompleted : 0} />
          <Metric label="Free reports completed" value={dashboardLoaded ? animatedCompleted.freeReportsCompleted : 0} />
        </View>
        <Text style={styles.explainer}>Cost per free report: 0 credits</Text>
        <Text style={styles.rangeMeta}>Estimated completed cost: {completedCostCredits} credits (${completedCostUsd.toFixed(2)})</Text>
        <Text style={styles.subtleMeta}>{formatRangeLabel(completedRange, defaultFrom, defaultTo)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <View style={styles.blockTitleRow}>
            <InlineIcon tone="slate">
              <WalletCards size={14} color="#0f172a" />
            </InlineIcon>
            <Text style={styles.blockTitle}>Transaction Status</Text>
          </View>
          <RangeInputs range={txRange} setRange={setTxRange} />
        </View>
        <View style={styles.statsGrid}>
          <Metric label="Total credits bought" value={dashboardLoaded ? animatedTx.total_bought_credits : 0} suffix="credits" />
          <Metric label="Total credits spent" value={dashboardLoaded ? animatedTx.total_spent_credits : 0} suffix="credits" />
        </View>
        <Text style={styles.subtleMeta}>{formatRangeLabel(txRange, defaultFrom, defaultTo)}</Text>
        {txTotals?.total_bought_credits || txTotals?.total_spent_credits ? (
          <Text style={styles.explainer}>
            Totals reflect completed transactions in the selected date range.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerCopy: {
    flex: 1,
    minWidth: 260,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSubtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 25,
    color: '#64748b',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  planTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  freePlanTag: {
    backgroundColor: '#dcfce7',
  },
  proPlanTag: {
    backgroundColor: '#dbeafe',
  },
  planTagText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  promoCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 24,
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  promoBody: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
  },
  learnButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  learnButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  metricsRow: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metric: {
    flexBasis: 180,
    flexGrow: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricSuffix: {
    fontSize: 16,
    color: '#64748b',
  },
  subtleMeta: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 21,
    color: '#94a3b8',
  },
  explainer: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 24,
    color: '#475569',
  },
  explainerStrong: {
    fontWeight: '800',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 24,
  },
  block: {
    gap: 14,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  blockTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  dateInput: {
    minWidth: 136,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#0f172a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statsGridFour: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  rangeMeta: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '700',
  },
  inlineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGreen: {
    backgroundColor: '#dcfce7',
  },
  iconSlate: {
    backgroundColor: '#e2e8f0',
  },
  iconAmber: {
    backgroundColor: '#fef3c7',
  },
  inlineIconText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
});

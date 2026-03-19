import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CreditCard,
  DollarSign,
  Filter,
  RefreshCcw,
  Search,
  Shield,
  Wallet,
  X,
} from 'lucide-react-native';
import { PaymentsService, t, transactionsService, useAuth, useCreditsSummary } from '@poliverai/intl';
import type { Transaction } from '@poliverai/intl';
import { appAlphaColors, appColors } from '@poliverai/shared-ui';
import AppFooter from '../components/AppFooter';
import AppTopNav from '../components/AppTopNav';
import useRampedCounters from '../hooks/useRampedCounters';

type CreditsRouteParams = {
  session_id?: string;
  status?: string;
};

type TransactionStatus = 'pending' | 'success' | 'failed' | 'processing' | 'insufficient_funds' | 'unknown' | 'task';
type StatusFilter = Record<TransactionStatus, boolean>;

const STATUS_KEYS: TransactionStatus[] = ['pending', 'success', 'failed', 'processing', 'insufficient_funds', 'unknown', 'task'];
const PER_PAGE_OPTIONS = [10, 20, 30, 50];
const cardSurfaceShadow = Platform.select({
  web: {
    boxShadow: `0 10px 18px ${appAlphaColors.shadowSoft}`,
  },
  default: {
    shadowColor: appColors.ink900,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
});

const INITIAL_STATUS_FILTER: StatusFilter = {
  pending: true,
  success: true,
  failed: true,
  processing: true,
  insufficient_funds: true,
  unknown: true,
  task: true,
};

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

function parseFilterDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatAmountUsd(amount = 0) {
  const sign = amount < 0 ? '-' : '+';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function formatCredits(credits = 0) {
  const sign = credits < 0 ? '-' : '';
  return `${sign}${Math.abs(credits)} credits`;
}

function truncateMiddle(value: string, maxLength = 40) {
  if (value.length <= maxLength) return value;
  const head = Math.ceil((maxLength - 3) / 2);
  const tail = Math.floor((maxLength - 3) / 2);
  return `${value.slice(0, head)}...${value.slice(value.length - tail)}`;
}

function getTxStatus(tx: Transaction): TransactionStatus {
  const rawStatus = (tx.status || '').toString().toLowerCase();
  const eventType = (tx.event_type || '').toString().toLowerCase();
  const description = (tx.description || '').toString().toLowerCase();
  const failureCode = (tx.failure_code || '').toString().toLowerCase();
  const failureMessage = (tx.failure_message || '').toString().toLowerCase();

  if (failureCode.includes('insufficient') || failureMessage.includes('insufficient')) return 'insufficient_funds';
  if (rawStatus === 'pending' || eventType.includes('pending')) return 'pending';
  if (rawStatus === 'processing' || eventType.includes('processing') || description.includes('processing')) return 'processing';
  if (rawStatus === 'failed' || failureCode || failureMessage.includes('failed') || failureMessage.includes('declined')) return 'failed';
  if (
    rawStatus === 'completed' ||
    rawStatus === 'success' ||
    eventType.includes('completed') ||
    eventType.includes('success') ||
    typeof tx.credits === 'number'
  ) {
    return 'success';
  }
  if (eventType || description) return 'task';
  return 'unknown';
}

function getStatusTone(status: TransactionStatus) {
  switch (status) {
    case 'success':
      return { bg: appColors.green100, text: appColors.green700, label: 'Success' };
    case 'pending':
      return { bg: appColors.yellow100, text: '#92400e', label: 'Pending' };
    case 'processing':
      return { bg: appColors.blue100, text: appColors.blue700, label: 'Processing' };
    case 'insufficient_funds':
      return { bg: appColors.yellow100, text: appColors.amber700, label: 'Insufficient funds' };
    case 'failed':
      return { bg: appColors.red100, text: appColors.red700, label: 'Failed' };
    case 'task':
      return { bg: appColors.slate200, text: appColors.slate600, label: 'Task' };
    default:
      return { bg: appColors.slate200, text: appColors.slate600, label: 'Unknown' };
  }
}

function matchesSearch(tx: Transaction, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${tx.description || ''} ${tx.event_type || ''} ${tx.session_id || ''} ${tx.user_email || ''}`.toLowerCase();
  return haystack.includes(q);
}

function matchesDate(tx: Transaction, fromText: string, toText: string) {
  const timestamp = tx.timestamp ? new Date(tx.timestamp) : null;
  if (!timestamp || Number.isNaN(timestamp.getTime())) return false;

  const from = parseFilterDate(fromText);
  if (from && timestamp < from) return false;

  const to = parseFilterDate(toText);
  if (to) {
    const inclusiveTo = new Date(to);
    inclusiveTo.setHours(23, 59, 59, 999);
    if (timestamp > inclusiveTo) return false;
  }

  return true;
}

function formatReturnStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'success' || normalized === 'completed') {
    return {
      title: 'Payment successful',
      message: 'Your payment was processed and your credits balance is being refreshed.',
      tone: 'success' as const,
    };
  }

  return {
    title: 'Payment not completed',
    message: `The checkout returned with status "${status}". No credits were added.`,
    tone: 'danger' as const,
  };
}

function SummaryCard({
  title,
  value,
  subtitle,
  accent,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.summaryCard, { borderColor: accent }]}>
      <View style={styles.summaryTopRow}>
        <View style={[styles.summaryIconWrap, { backgroundColor: accent }]}>{icon}</View>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryValue}>{value}</Text>
        </View>
      </View>
      <Text style={styles.summarySubtitle}>{subtitle}</Text>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, selected ? styles.filterChipSelected : null]}>
      <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.actionButtonPrimary : null,
        variant === 'secondary' ? styles.actionButtonSecondary : null,
        variant === 'ghost' ? styles.actionButtonGhost : null,
      ]}
    >
      <View style={styles.actionButtonInner}>
        {icon ? <View style={styles.actionButtonIcon}>{icon}</View> : null}
        <Text
          style={[
            styles.actionButtonText,
            variant === 'primary' ? styles.actionButtonTextPrimary : null,
            variant === 'secondary' ? styles.actionButtonTextSecondary : null,
            variant === 'ghost' ? styles.actionButtonTextGhost : null,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

function TransactionCard({
  tx,
  isDesktop,
}: {
  tx: Transaction;
  isDesktop: boolean;
}) {
  const status = getTxStatus(tx);
  const tone = getStatusTone(status);
  const credits = typeof tx.credits === 'number' ? tx.credits : 0;
  const amount = typeof tx.amount_usd === 'number' ? tx.amount_usd : 0;
  const amountPositive = credits > 0 || amount > 0;
  const iconColor = tone.text;

  return (
    <View style={[styles.transactionCard, isDesktop ? styles.transactionCardDesktop : null]}>
      <View style={styles.transactionMain}>
        <View style={styles.transactionTitleBlock}>
          <View style={styles.transactionTitleRow}>
            <View style={[styles.transactionTypeIcon, { backgroundColor: tone.bg }]}>
              {status === 'success' ? <Wallet size={16} color={iconColor} /> : null}
              {status === 'pending' ? <CalendarDays size={16} color={iconColor} /> : null}
              {status === 'processing' ? <RefreshCcw size={16} color={iconColor} /> : null}
              {status === 'failed' || status === 'insufficient_funds' ? <CircleAlert size={16} color={iconColor} /> : null}
              {status === 'task' || status === 'unknown' ? <CreditCard size={16} color={iconColor} /> : null}
            </View>
            <Text style={styles.transactionTitle}>{tx.description || tx.event_type || 'Transaction'}</Text>
          </View>

          {(tx.user_email || tx.session_id) ? (
            <View style={styles.identityPills}>
              {tx.user_email ? (
                <View style={[styles.identityPill, styles.identityPillLeft]}>
                  <Text numberOfLines={1} style={styles.identityPillText}>{tx.user_email}</Text>
                </View>
              ) : null}
              {tx.session_id ? (
                <View style={[styles.identityPill, tx.user_email ? styles.identityPillRight : styles.identityPillSolo]}>
                  <Text numberOfLines={1} style={styles.identityPillText}>{truncateMiddle(tx.session_id, 34)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.transactionMetaWrap}>
          {tx.timestamp ? <Text style={styles.transactionMeta}>{new Date(tx.timestamp).toLocaleString()}</Text> : null}
        </View>

        {tx.failure_message ? <Text style={styles.transactionError}>{tx.failure_message}</Text> : null}
      </View>

      <View style={[styles.transactionAside, isDesktop ? styles.transactionAsideDesktop : null]}>
        <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusBadgeText, { color: tone.text }]}>{tone.label}</Text>
        </View>
        <Text style={styles.transactionCredits}>{formatCredits(credits)}</Text>
        <Text style={[styles.transactionUsd, amountPositive ? styles.amountPositive : styles.amountNegative]}>
          {formatAmountUsd(amount)}
        </Text>
      </View>
    </View>
  );
}

const CreditsScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, CreditsRouteParams | undefined>, string>>();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1140;
  const isCompact = width <= 768;
  const webReturnParams = React.useMemo<CreditsRouteParams>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        session_id: params.get('session_id') ?? undefined,
        status: params.get('status') ?? undefined,
      };
    } catch {
      return {};
    }
  }, []);

  const auth = useAuth() as unknown as {
    user?: Record<string, unknown> | null;
    isAuthenticated?: boolean;
    loading?: boolean;
    refreshUser?: () => Promise<void>;
  };
  const { user, isAuthenticated = false, loading = false, refreshUser } = auth;

  const [items, setItems] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(INITIAL_STATUS_FILTER);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalSpentCredits, setTotalSpentCredits] = React.useState(0);
  const [filtersOpen, setFiltersOpen] = React.useState(isDesktop);
  const [returnDialog, setReturnDialog] = React.useState<null | { title: string; message: string; tone: 'success' | 'danger' }>(null);
  const handledReturnKeyRef = React.useRef<string | null>(null);
  const paymentReturnSessionId = route.params?.session_id ?? webReturnParams.session_id;
  const paymentReturnStatus = route.params?.status ?? webReturnParams.status;

  React.useEffect(() => {
    setFiltersOpen(isDesktop);
  }, [isDesktop]);

  const subscriptionCredits = Number((user && (user as Record<string, unknown>).subscription_credits) ?? 0);
  const purchasedCredits = Number((user && (user as Record<string, unknown>).credits) ?? 0);
  const totalAvailable = subscriptionCredits + purchasedCredits;
  const { subscriptionUsd, purchasedUsd, spentUsd } = useCreditsSummary(subscriptionCredits, purchasedCredits, totalSpentCredits);
  const statsLoaded = !loading && !isLoading;
  const animatedTop = useRampedCounters(
    {
      subscriptionCredits,
      purchasedCredits,
      totalSpent: totalSpentCredits,
    },
    statsLoaded,
    { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 }
  );

  const fetchTransactions = React.useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await transactionsService.listTransactions({
        page,
        limit,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setItems(response.transactions || []);
      setTotal(response.total ?? response.transactions?.length ?? 0);
      setTotalPages(response.total_pages ?? 1);
      setTotalSpentCredits(response.total_spent_credits ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy('credits.failed_to_load_transactions', 'Failed to load transactions.'));
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, isAuthenticated, limit, page]);

  React.useEffect(() => {
    fetchTransactions().catch(() => undefined);
  }, [fetchTransactions]);

  React.useEffect(() => {
    const status = paymentReturnStatus;
    if (!status) return;
    const returnKey = `${paymentReturnSessionId ?? 'no-session'}:${status}`;
    if (handledReturnKeyRef.current === returnKey) return;
    handledReturnKeyRef.current = returnKey;

    (async () => {
      const dialog = formatReturnStatus(status);
      try {
        await PaymentsService.handlePaymentReturn({
          status,
          session_id: paymentReturnSessionId,
        });

        await Promise.allSettled([
          refreshUser?.(),
          fetchTransactions(),
        ]);

        setReturnDialog(dialog);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        setReturnDialog({
          title: 'Unable to finalize payment',
          message: err instanceof Error ? err.message : 'The payment return could not be processed.',
          tone: 'danger',
        });
      }
    })().catch(() => undefined);
  }, [fetchTransactions, paymentReturnSessionId, paymentReturnStatus, refreshUser]);

  React.useEffect(() => {
    const handler = () => {
      fetchTransactions().catch(() => undefined);
      refreshUser?.().catch(() => undefined);
    };

    if (typeof window !== 'undefined' && window?.addEventListener) {
      window.addEventListener('transactions:refresh', handler as EventListener);
      return () => window.removeEventListener('transactions:refresh', handler as EventListener);
    }

    return undefined;
  }, [fetchTransactions, refreshUser]);

  const filtered = React.useMemo(() => {
    const enabledStatuses = STATUS_KEYS.filter((key) => statusFilter[key]);
    return items.filter((tx) => {
      const txStatus = getTxStatus(tx);
      if (!enabledStatuses.includes(txStatus)) return false;
      if (!matchesSearch(tx, search)) return false;
      if (!matchesDate(tx, dateFrom, dateTo)) return false;
      return true;
    });
  }, [dateFrom, dateTo, items, search, statusFilter]);

  const clearFilters = React.useCallback(() => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter(INITIAL_STATUS_FILTER);
    setPage(1);
  }, []);

  const selectedStatusCount = STATUS_KEYS.filter((key) => statusFilter[key]).length;

  if (loading) {
    return (
      <View style={styles.page}>
        <AppTopNav currentRoute="credits" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{copy('credits.loading', 'Loading transactions...')}</Text>
        </View>
        <AppFooter />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.page}>
        <AppTopNav currentRoute="credits" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{copy('policy_analysis.not_authenticated_message', 'Please sign in to view your transactions.')}</Text>
        </View>
        <AppFooter />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <AppTopNav currentRoute="credits" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.shell}>
          <View style={[styles.headerRow, isDesktop ? styles.headerRowDesktop : null]}>
            <View style={styles.headerCopy}>
              <Text style={styles.pageTitle}>{copy('credits.transaction_history_title', 'Transaction History')}</Text>
            </View>

            {!isDesktop ? (
              <ActionButton
                label={filtersOpen ? copy('credits.hide_filters', 'Hide filters') : copy('credits.show_filters', 'Show filters')}
                onPress={() => setFiltersOpen((current) => !current)}
                variant="secondary"
                icon={<Filter size={16} color="#334155" />}
              />
            ) : null}
          </View>

          <View style={[styles.summaryGrid, isDesktop ? styles.summaryGridDesktop : null]}>
            <SummaryCard
              title={copy('credits.subscription_credits', 'Subscription Credits')}
              value={`${statsLoaded ? animatedTop.subscriptionCredits : 0} credits`}
              subtitle={`$${subscriptionUsd.toFixed(2)} USD equivalent`}
              accent="#bfdbfe"
              icon={<Shield size={18} color="#1d4ed8" />}
            />
            <SummaryCard
              title={copy('credits.purchased_credits', 'Purchased Credits')}
              value={`${statsLoaded ? animatedTop.purchasedCredits : 0} credits`}
              subtitle={`$${purchasedUsd.toFixed(2)} USD equivalent`}
              accent="#cbd5e1"
              icon={<CreditCard size={18} color="#475569" />}
            />
            <SummaryCard
              title={copy('credits.total_spent', 'Total Spent')}
              value={`${statsLoaded ? animatedTop.totalSpent : 0} credits`}
              subtitle={`$${spentUsd.toFixed(2)} USD spent`}
              accent="#fecaca"
              icon={<DollarSign size={18} color="#b91c1c" />}
            />
          </View>

          <Text style={styles.totalAvailable}>Total available: {totalAvailable} credits</Text>

          <View style={[styles.contentRow, isDesktop ? styles.contentRowDesktop : null]}>
            {(isDesktop || filtersOpen) ? (
              <View style={[styles.filtersCard, isDesktop ? styles.filtersCardDesktop : null]}>
                <View style={styles.filtersHeader}>
                  <Text style={styles.filtersTitle}>Filters</Text>
                  <View style={styles.filtersHeaderIcon}>
                    <Filter size={16} color="#475569" />
                  </View>
                </View>

                <FilterInput
                  label={copy('credits.search_label', 'Search')}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={copy('credits.search_placeholder', 'description, session id, email...')}
                  icon={<Search size={16} color="#64748b" />}
                />

                <FilterInput
                  label={copy('credits.date_from', 'Date from')}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder={Platform.OS === 'web' ? 'dd/mm/yyyy' : 'yyyy-mm-dd'}
                  icon={<CalendarDays size={16} color="#64748b" />}
                />

                <FilterInput
                  label={copy('credits.date_to', 'Date to')}
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder={Platform.OS === 'web' ? 'dd/mm/yyyy' : 'yyyy-mm-dd'}
                  icon={<CalendarDays size={16} color="#64748b" />}
                />

                <Text style={styles.filterLabel}>{copy('credits.status_label', 'Status')}</Text>
                <View style={styles.filterChipWrap}>
                  {STATUS_KEYS.map((key) => (
                    <FilterChip
                      key={key}
                      label={getStatusTone(key).label.toLowerCase()}
                      selected={statusFilter[key]}
                      onPress={() => setStatusFilter((current) => ({ ...current, [key]: !current[key] }))}
                    />
                  ))}
                </View>

                <View style={styles.filterActions}>
                  <ActionButton label={copy('credits.clear', 'Clear')} onPress={clearFilters} variant="ghost" icon={<X size={15} color="#475569" />} />
                  <ActionButton
                    label={copy('credits.refresh', 'Refresh')}
                    onPress={() => {
                      setPage(1);
                      fetchTransactions().catch(() => undefined);
                    }}
                    variant="primary"
                    icon={<RefreshCcw size={15} color="#ffffff" />}
                  />
                </View>

                <Text style={styles.filterHint}>{selectedStatusCount} status filters active</Text>
              </View>
            ) : null}

            <View style={styles.listArea}>
              <View style={[styles.listToolbar, isCompact ? styles.listToolbarCompact : null]}>
                <View style={styles.listToolbarTopRow}>
                  <Text style={styles.listToolbarText}>
                    Showing {filtered.length} of {total || items.length} transactions
                  </Text>
                </View>

                <View style={[styles.listToolbarControls, isCompact ? styles.listToolbarControlsCompact : styles.listToolbarControlsDesktop]}>
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Per page</Text>
                    <View style={styles.controlSelectRow}>
                      <View style={styles.miniSelect}>
                        {PER_PAGE_OPTIONS.map((option) => (
                          <Pressable
                            key={option}
                            onPress={() => {
                              setPage(1);
                              setLimit(option);
                            }}
                            style={[
                              styles.miniSelectOption,
                              option === PER_PAGE_OPTIONS[PER_PAGE_OPTIONS.length - 1] ? styles.miniSelectOptionLast : null,
                              limit === option ? styles.miniSelectOptionActive : null,
                            ]}
                          >
                            <Text style={[styles.miniSelectOptionText, limit === option ? styles.miniSelectOptionTextActive : null]}>
                              {option}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Page</Text>
                    <View style={styles.paginationRow}>
                      <ActionButton label="Prev" onPress={() => setPage((current) => Math.max(1, current - 1))} variant="secondary" icon={<ChevronLeft size={15} color="#334155" />} />
                      <View style={styles.pageCounterBox}>
                        <Text style={styles.pageCount}>{page} / {Math.max(1, totalPages)}</Text>
                      </View>
                      <ActionButton label="Next" onPress={() => setPage((current) => Math.min(totalPages, current + 1))} variant="secondary" icon={<ChevronRight size={15} color="#334155" />} />
                    </View>
                  </View>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {isLoading ? (
                <View style={styles.loadingPanel}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Loading transaction history...</Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No transactions found</Text>
                  <Text style={styles.emptyText}>No transactions match your current filters.</Text>
                </View>
              ) : (
                <View style={styles.transactionList}>
                  {filtered.map((tx) => (
                    <TransactionCard key={tx.id} tx={tx} isDesktop={isDesktop} />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={Boolean(returnDialog)}
        animationType="fade"
        transparent
        presentationStyle="overFullScreen"
        onRequestClose={() => setReturnDialog(null)}
      >
        <Pressable style={styles.dialogBackdrop} onPress={() => setReturnDialog(null)}>
          <Pressable style={styles.dialogCard} onPress={() => undefined}>
            <Text style={styles.dialogTitle}>{returnDialog?.title}</Text>
            <Text style={styles.dialogBody}>{returnDialog?.message}</Text>
            <View style={styles.dialogActions}>
              <ActionButton
                label="Close"
                onPress={() => setReturnDialog(null)}
                variant={returnDialog?.tone === 'danger' ? 'secondary' : 'primary'}
                icon={returnDialog?.tone === 'danger' ? <X size={15} color="#334155" /> : <Wallet size={15} color="#ffffff" />}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appColors.sky50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 56,
  },
  shell: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  headerRow: {
    gap: 16,
    marginBottom: 24,
  },
  headerRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCopy: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: appColors.ink900,
  },
  summaryGrid: {
    gap: 16,
  },
  summaryGridDesktop: {
    flexDirection: 'row',
  },
  summaryCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    ...cardSurfaceShadow,
    gap: 8,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: appColors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: appColors.ink900,
  },
  summarySubtitle: {
    fontSize: 14,
    color: appColors.slate600,
  },
  totalAvailable: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 15,
    fontWeight: '600',
    color: appColors.slate700,
  },
  contentRow: {
    gap: 20,
  },
  contentRowDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  filtersCard: {
    backgroundColor: appColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 18,
    gap: 12,
  },
  filtersCardDesktop: {
    width: 280,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: appColors.ink900,
  },
  filtersHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: appColors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterField: {
    gap: 7,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate700,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.sky50,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  inputIcon: {
    width: 18,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: appColors.ink900,
    fontSize: 14,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  filterChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.white,
  },
  filterChipSelected: {
    borderColor: appColors.blue700,
    backgroundColor: appColors.blue100,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: appColors.slate600,
  },
  filterChipTextSelected: {
    color: appColors.blue700,
  },
  filterActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  filterHint: {
    marginTop: 4,
    fontSize: 12,
    color: appColors.slate400,
  },
  listArea: {
    flex: 1,
    gap: 16,
  },
  listToolbar: {
    backgroundColor: appColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 18,
    gap: 14,
  },
  listToolbarCompact: {
    gap: 18,
  },
  listToolbarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listToolbarText: {
    fontSize: 14,
    color: appColors.slate600,
    fontWeight: '600',
  },
  listToolbarControls: {
    gap: 16,
  },
  listToolbarControlsDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listToolbarControlsCompact: {
    gap: 18,
  },
  controlGroup: {
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: appColors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.sky50,
    borderWidth: 1,
    borderColor: appColors.slate300,
    borderRadius: 10,
    overflow: 'hidden',
  },
  miniSelectOption: {
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: appColors.slate200,
  },
  miniSelectOptionActive: {
    backgroundColor: appColors.slate200,
  },
  miniSelectOptionLast: {
    borderRightWidth: 0,
  },
  miniSelectOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: appColors.slate600,
  },
  miniSelectOptionTextActive: {
    color: appColors.ink900,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  pageCounterBox: {
    minHeight: 40,
    minWidth: 76,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCount: {
    fontSize: 14,
    fontWeight: '700',
    color: appColors.ink900,
  },
  buyRow: {
    alignItems: 'flex-start',
  },
  actionButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: appColors.blue600,
    borderColor: appColors.blue600,
  },
  actionButtonSecondary: {
    backgroundColor: appColors.white,
    borderColor: appColors.slate300,
  },
  actionButtonGhost: {
    backgroundColor: appColors.sky50,
    borderColor: appColors.slate200,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: appColors.white,
  },
  actionButtonTextSecondary: {
    color: appColors.slate700,
  },
  actionButtonTextGhost: {
    color: appColors.slate600,
  },
  loadingPanel: {
    minHeight: 260,
    backgroundColor: appColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: appColors.slate600,
    fontWeight: '600',
  },
  emptyState: {
    minHeight: 220,
    backgroundColor: appColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: appColors.ink900,
  },
  emptyText: {
    fontSize: 14,
    color: appColors.slate500,
    textAlign: 'center',
  },
  transactionList: {
    gap: 14,
  },
  transactionCard: {
    backgroundColor: appColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.slate200,
    padding: 18,
    gap: 14,
  },
  transactionCardDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionMain: {
    flex: 1,
    gap: 8,
  },
  transactionTitleBlock: {
    gap: 10,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  transactionTypeIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  transactionTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: appColors.ink900,
  },
  transactionMetaWrap: {
    gap: 4,
    paddingLeft: 40,
  },
  transactionMeta: {
    fontSize: 13,
    color: appColors.slate500,
  },
  transactionError: {
    fontSize: 13,
    color: appColors.red700,
  },
  transactionAside: {
    gap: 8,
    alignItems: 'flex-start',
  },
  transactionAsideDesktop: {
    minWidth: 148,
    alignItems: 'flex-end',
  },
  identityPills: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    flexWrap: 'wrap',
  },
  identityPill: {
    minHeight: 28,
    maxWidth: '100%',
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.slate300,
    backgroundColor: appColors.sky50,
  },
  identityPillLeft: {
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
  },
  identityPillRight: {
    borderLeftWidth: 0,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
  },
  identityPillSolo: {
    borderRadius: 9,
  },
  identityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: appColors.slate600,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  transactionCredits: {
    fontSize: 18,
    fontWeight: '800',
    color: appColors.ink900,
  },
  transactionUsd: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountPositive: {
    color: appColors.green800,
  },
  amountNegative: {
    color: appColors.red700,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: appColors.red700,
  },
  dialogBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appAlphaColors.overlayDark45,
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    backgroundColor: appColors.white,
    padding: 24,
    gap: 14,
    ...cardSurfaceShadow,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: appColors.ink900,
  },
  dialogBody: {
    fontSize: 14,
    lineHeight: 22,
    color: appColors.slate600,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
});

export default CreditsScreen;

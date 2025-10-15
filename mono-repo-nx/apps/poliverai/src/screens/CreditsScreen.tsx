import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '@poliverai/intl';
import { transactionsService, PaymentsService, t } from '@poliverai/intl';
import { colors, textSizes } from '@poliverai/shared-ui';
import { Button } from '@poliverai/shared-ui';
import { CreditsSummary } from '@poliverai/shared-ui';
import { useCreditsSummary } from '@poliverai/intl';

// Placeholder for TransactionList and TransactionFilters
// You should port these as RN components and add them to shared-ui
const TransactionList = () => <View><Text>Transaction List (RN version needed)</Text></View>;
const TransactionFilters = () => <View><Text>Transaction Filters (RN version needed)</Text></View>;

const CreditsScreen: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  import type { Transaction } from '@poliverai/intl';
  const [items, setItems] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed unused modal, search, filter, pagination state for RN port
  const [totalSpentCredits, setTotalSpentCredits] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(Dimensions.get('window').width <= 1140);

  useEffect(() => {
    const updateMobile = () => setIsMobile(Dimensions.get('window').width <= 1140);
    Dimensions.addEventListener('change', updateMobile);
    // No removeEventListener for Dimensions in RN, so skip cleanup
  }, []);

  const fetchTx = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await transactionsService.listTransactions({});
      setItems(r.transactions || []);
      setTotalSpentCredits(r.total_spent_credits ?? 0);
    } catch {
      setError(t('credits.failed_to_load_transactions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTx();
  }, [fetchTx]);

  const purchasedCredits = user?.credits ?? 0;
  // If you have a subscription credits field, use it here; otherwise, set to 0
  const subscriptionCredits = 0;
  const { subscriptionUsd, purchasedUsd, spentUsd } = useCreditsSummary(subscriptionCredits, purchasedCredits, totalSpentCredits);

  // Filtered transactions (simplified for RN)
  const filtered = useMemo(() => items, [items]);

  if (loading || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary.hex} />
        <Text style={styles.loadingText}>{t('credits.loading')}</Text>
      </View>
    );
  }
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{t('policy_analysis.not_authenticated_message')}</Text>
        <Button title={t('auth.register.sign_in')} onPress={() => console.log('Sign in pressed')} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('credits.transaction_history_title')}</Text>
      <CreditsSummary
        isCompactUnderHeader={false}
        statsLoaded={true}
        animatedTop={{ subscriptionCredits, purchasedCredits, totalSpent: totalSpentCredits }}
        subscriptionUsd={subscriptionUsd}
        purchasedUsd={purchasedUsd}
        spentUsd={spentUsd}
        total={subscriptionCredits + purchasedCredits}
        mobileCompact={isMobile}
      />
      {/* Transaction filters and list would be ported as RN components */}
      <TransactionFilters />
      <TransactionList />
      {error && <Text style={styles.error}>{error}</Text>}
      {/* EnterCreditsModal would be ported as a RN modal */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: colors.pageBg.hex,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pageBg.hex,
  },
  title: {
    fontSize: textSizes.h2.size,
    color: colors.textPrimary.hex,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: textSizes.md.size,
    color: colors.textMuted.hex,
    marginTop: 12,
  },
  error: {
    color: colors.danger.hex,
    fontSize: textSizes.md.size,
    marginVertical: 12,
    textAlign: 'center',
  },
  addCreditsBtn: {
    marginTop: 24,
    backgroundColor: colors.primaryBg.hex,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addCreditsText: {
    color: colors.ctaText.hex,
    fontSize: textSizes.md.size,
    fontWeight: '600',
  },
});

export default CreditsScreen;

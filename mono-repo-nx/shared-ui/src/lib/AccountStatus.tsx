import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface AccountStatusProps {
  isPro: boolean;
  user: any;
  dashboardLoaded: boolean;
  animatedCredits: object;
  animatedSaved: object;
  animatedDeleted: object;
  animatedCompleted: object;
  animatedTx: object;
  reportsRange: { from: string | null; to: string | null };
  setReportsRange: React.Dispatch<React.SetStateAction<{ from: string | null; to: string | null }>>;
  completedRange: { from: string | null; to: string | null };
  setCompletedRange: React.Dispatch<React.SetStateAction<{ from: string | null; to: string | null }>>;
  txRange: { from: string | null; to: string | null };
  setTxRange: React.Dispatch<React.SetStateAction<{ from: string | null; to: string | null }>>;
  defaultFrom: any;
  defaultTo: any;
  getCostForReport: (report?: any) => number;
  userReports: any[] | null;
  txTotals: object;
  totalSavedCredits: number;
  totalSavedUsd: number;
  formatRangeLabel: (range?: any, defFrom?: any, defTo?: any) => string;
}

const AccountStatus: React.FC<AccountStatusProps> = ({ isPro, user, dashboardLoaded }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isPro ? 'PRO Account' : 'Free Account'}</Text>
      <Text style={styles.subtitle}>{user?.email || 'No user info'}</Text>
      {dashboardLoaded ? (
        <Text style={styles.status}>Dashboard Loaded</Text>
      ) : (
        <Text style={styles.status}>Loading...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  status: {
    fontSize: 12,
    color: '#2563eb',
  },
});

export default AccountStatus;

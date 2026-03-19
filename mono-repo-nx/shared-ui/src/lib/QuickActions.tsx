import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { t } from '@poliverai/intl';
import { FileSearch, FolderOpen, Star } from 'lucide-react-native';

export interface QuickActionsProps {
  reportsCount?: number;
}

type WebLocationLike = {
  pathname?: string;
};

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function QuickActions({ reportsCount }: QuickActionsProps) {
  const navigation = useNavigation<any>();

  const go = (routeName: string, webPath: string) => {
    try {
      navigation.navigate(routeName);
      return;
    } catch {
      const g = typeof globalThis !== 'undefined' ? (globalThis as { location?: WebLocationLike }) : undefined;
      if (g?.location) g.location.pathname = webPath;
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Star size={20} color="#2563eb" />
        <Text style={styles.heading}>{copy('dashboard.quick_actions', 'Quick Actions')}</Text>
      </View>
      <View style={styles.grid}>
        <Pressable onPress={() => go('Analyze', '/analyze')} style={styles.card}>
          <View style={[styles.iconBadge, styles.primaryBadge]}>
            <FileSearch size={22} color="#1d4ed8" />
          </View>
          <Text style={styles.title}>{copy('dashboard.analyze_new_policy.title', 'Analyze New Policy')}</Text>
          <Text style={styles.desc}>
            {copy('dashboard.analyze_new_policy.desc', 'Upload a privacy policy for GDPR compliance analysis')}
          </Text>
        </Pressable>

        <Pressable onPress={() => go('Reports', '/reports')} style={styles.card}>
          <View style={[styles.iconBadge, styles.secondaryBadge]}>
            <FolderOpen size={22} color="#166534" />
          </View>
          <Text style={styles.title}>{copy('dashboard.view_reports.title', 'View Reports')}</Text>
          <Text style={styles.desc}>
            {copy('dashboard.view_reports.desc', 'Access your detailed compliance reports and history')}
          </Text>
          <Text style={styles.meta}>Reports available: {reportsCount ?? 0}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 32,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  card: {
    flexBasis: 320,
    flexGrow: 1,
    minHeight: 170,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    backgroundColor: '#dbeafe',
  },
  secondaryBadge: {
    backgroundColor: '#dcfce7',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  desc: {
    fontSize: 15,
    lineHeight: 24,
    color: '#64748b',
  },
  meta: {
    marginTop: 'auto',
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '700',
  },
});

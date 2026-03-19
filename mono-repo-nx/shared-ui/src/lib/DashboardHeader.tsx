import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';

type DashboardHeaderProps = {
  name?: string | null;
};

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
  const safeName = name?.trim() || 'there';
  const titleTemplate = copy('screens.dashboard.header.welcome', 'Welcome back, {{name}}!');
  const title = titleTemplate.replace('{{name}}', safeName);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {copy('screens.dashboard.header.subtitle', 'Manage your GDPR compliance analysis and reports from your dashboard.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 28,
    color: '#475569',
  },
});

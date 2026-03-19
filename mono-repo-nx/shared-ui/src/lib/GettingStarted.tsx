import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function GettingStarted() {
  const steps = [
    {
      id: 1,
      title: copy('dashboard.getting_started.step1.title', 'Upload Your First Policy'),
      desc: copy('dashboard.getting_started.step1.desc', 'Start by uploading a privacy policy document to analyze for GDPR compliance'),
    },
    {
      id: 2,
      title: copy('dashboard.getting_started.step2.title', 'Review Analysis Results'),
      desc: copy('dashboard.getting_started.step2.desc', 'Examine compliance scores, violations, and recommendations for improvement'),
    },
    {
      id: 3,
      title: copy('dashboard.getting_started.step3.title', 'Consider Upgrading'),
      desc: copy('dashboard.getting_started.step3.desc', 'Upgrade to Pro for advanced AI analysis and comprehensive reporting'),
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy('dashboard.getting_started.title', 'Getting Started')}</Text>
      <Text style={styles.lead}>
        {copy('dashboard.getting_started.description', "New to PoliverAI? Here's how to get the most out of your account")}
      </Text>

      <View style={styles.steps}>
        {steps.map((step) => (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{step.id}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 32,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  lead: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 26,
    color: '#64748b',
  },
  steps: {
    marginTop: 20,
    gap: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
  },
  stepCopy: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: '#64748b',
  },
});

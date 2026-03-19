import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';
import { appColors } from './colorTokens';

const steps = [
  {
    id: 1,
    title: 'Upload Your Policy',
    desc: 'Upload privacy policies in multiple formats (PDF, DOCX, TXT, HTML)',
  },
  {
    id: 2,
    title: 'AI Analysis',
    desc: 'Our AI analyzes your policy against GDPR requirements with multiple analysis modes',
  },
  {
    id: 3,
    title: 'Get Results',
    desc: 'Receive detailed reports with compliance scores, violations, and actionable recommendations',
  },
];

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function HowItWorks() {
  return (
    <View style={styles.section}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.heading}>{copy('how.title', 'How PoliverAI Works')}</Text>
          <Text style={styles.subheading}>
            {copy('how.subtitle', 'Simple, powerful, and intelligent GDPR compliance analysis')}
          </Text>
        </View>
        <View style={styles.grid}>
          {steps.map((step) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>{step.id}</Text>
              </View>
              <Text style={styles.stepTitle}>{copy(`landing.how.step${step.id}_title`, step.title)}</Text>
              <Text style={styles.stepDesc}>{copy(`landing.how.step${step.id}_desc`, step.desc)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 64,
  },
  inner: {
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heading: {
    color: appColors.ink900,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    textAlign: 'center',
  },
  subheading: {
    marginTop: 12,
    maxWidth: 720,
    color: appColors.slate600,
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  stepCard: {
    width: 280,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stepCircleText: {
    color: appColors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  stepTitle: {
    color: appColors.ink900,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepDesc: {
    marginTop: 12,
    color: appColors.slate600,
    fontSize: 16,
    lineHeight: 27,
    textAlign: 'center',
  },
});

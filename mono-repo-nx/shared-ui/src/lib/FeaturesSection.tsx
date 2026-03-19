import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';
import { appAlphaColors, appColors } from './colorTokens';

const freeFeatures = [
  {
    badge: 'F',
    title: 'Basic Policy Verification',
    description: 'Upload and analyze privacy policies for basic GDPR compliance checks using rule-based detection.',
  },
  {
    badge: 'E',
    title: 'Essential Compliance Checks',
    description: 'Detect fundamental GDPR violations and get basic recommendations for improvement.',
  },
  {
    badge: 'Q',
    title: 'Fast Analysis',
    description: 'Quick compliance screening using our optimized rule-based analysis engine.',
  },
];

const proFeatures = [
  {
    badge: 'AI',
    title: 'AI-Powered Deep Analysis',
    description: 'Advanced AI analysis that detects nuanced privacy violations and complex compliance issues.',
  },
  {
    badge: 'R',
    title: 'Comprehensive Reporting',
    description: 'Detailed compliance reports with confidence scores, evidence, and actionable recommendations.',
  },
  {
    badge: 'P',
    title: 'Policy Generation & Revision',
    description: 'Generate revised policies automatically based on detected compliance gaps.',
  },
];

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

function FeatureCard({
  badge,
  title,
  description,
  pro = false,
}: {
  badge: string;
  title: string;
  description: string;
  pro?: boolean;
}) {
  return (
    <View style={[styles.featureCard, pro ? styles.proCard : null]}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureBadge, pro ? styles.proBadge : styles.freeBadge]}>
          <Text style={[styles.featureBadgeText, pro ? styles.proBadgeText : styles.freeBadgeText]}>{badge}</Text>
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        {pro ? (
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

export default function FeaturesSection() {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>{copy('landing.features.title', 'Powerful Features for Every Need')}</Text>
        <Text style={styles.subheading}>
          {copy('landing.features.subtitle', 'From basic compliance checks to advanced AI-powered analysis')}
        </Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>{copy('landing.features.free_heading', 'Free Tier Features')}</Text>
        <View style={styles.grid}>
          {freeFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>{copy('landing.features.pro_heading', 'Pro Tier Features')}</Text>
        <View style={styles.grid}>
          {proFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} pro />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    maxWidth: 1280,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 48,
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
    maxWidth: 760,
    color: appColors.slate600,
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'center',
  },
  group: {
    marginBottom: 28,
    width: '100%',
  },
  groupTitle: {
    marginBottom: 18,
    color: appColors.ink900,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'left',
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  featureCard: {
    width: 320,
    minHeight: 190,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSoft,
    backgroundColor: appColors.white,
    padding: 24,
  },
  proCard: {
    borderColor: appAlphaColors.borderBlueLight,
    backgroundColor: appAlphaColors.blueTint95,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBadge: {
    backgroundColor: appAlphaColors.greenTint12,
  },
  proBadge: {
    backgroundColor: appAlphaColors.blueTint12,
  },
  featureBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  freeBadgeText: {
    color: appColors.green600,
  },
  proBadgeText: {
    color: appColors.blue600,
  },
  featureTitle: {
    flex: 1,
    color: appColors.ink900,
    fontSize: 20,
    fontWeight: '700',
  },
  proPill: {
    borderRadius: 999,
    backgroundColor: appColors.blue600,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  proPillText: {
    color: appColors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featureDescription: {
    marginTop: 16,
    color: appColors.slate600,
    fontSize: 15,
    lineHeight: 26,
  },
});

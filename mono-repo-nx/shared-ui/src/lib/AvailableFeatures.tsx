import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCost, useAvailableFeatures } from '@poliverai/intl';
import { Bot, CheckCircle2, FileText, SearchCheck, Sparkles, Wand2 } from 'lucide-react-native';

export interface AvailableFeaturesProps {
  hasCredits: boolean;
}

const FREE_FALLBACKS = [
  {
    title: 'Policy Verification',
    description: 'Upload and analyze privacy policies with basic GDPR compliance checks',
  },
  {
    title: 'Fast Analysis',
    description: 'Quick rule-based compliance screening',
  },
  {
    title: 'Basic Recommendations',
    description: 'Get essential compliance improvement suggestions',
  },
];

const PRO_FALLBACKS = [
  {
    title: 'AI-Powered Analysis',
    description: 'Advanced AI analysis with nuanced violation detection',
  },
  {
    title: 'Comprehensive Reports',
    description: 'Detailed PDF reports with confidence scores and evidence',
  },
  {
    title: 'Policy Generation',
    description: 'Automatically generate revised compliant policies',
  },
];

function resolveCopy(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return value.includes('.') ? fallback : value;
}

function featureIcon(title: string, isPro: boolean) {
  const key = title.toLowerCase();
  if (key.includes('verification')) return <SearchCheck size={18} color="#1d4ed8" />;
  if (key.includes('fast')) return <Sparkles size={18} color="#1d4ed8" />;
  if (key.includes('recommend')) return <CheckCircle2 size={18} color="#1d4ed8" />;
  if (key.includes('comprehensive')) return <FileText size={18} color="#7c3aed" />;
  if (key.includes('generation')) return <Wand2 size={18} color="#7c3aed" />;
  return <Bot size={18} color={isPro ? '#7c3aed' : '#1d4ed8'} />;
}

export default function AvailableFeatures({ hasCredits }: AvailableFeaturesProps) {
  const { freeFeatures, proFeatures } = useAvailableFeatures(hasCredits);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Your Features</Text>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <CheckCircle2 size={18} color="#1d4ed8" />
          <Text style={styles.sectionTitle}>Free Tier Features</Text>
        </View>
        <View style={styles.grid}>
          {freeFeatures.map((feature, index) => (
            <View key={`${feature.title}-${index}`} style={styles.card}>
              <View style={styles.featureIconBadge}>
                {featureIcon(resolveCopy(feature.title, FREE_FALLBACKS[index]?.title ?? feature.title), false)}
              </View>
              <Text style={styles.cardTitle}>{resolveCopy(feature.title, FREE_FALLBACKS[index]?.title ?? feature.title)}</Text>
              <Text style={styles.cardDesc}>{resolveCopy(feature.description, FREE_FALLBACKS[index]?.description ?? feature.description)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Sparkles size={18} color="#7c3aed" />
          <Text style={styles.sectionTitle}>Pro Plan Features</Text>
        </View>
        <View style={styles.grid}>
          {proFeatures.map((feature, index) => {
            const cost = getCost(feature.key);
            return (
              <View key={`${feature.title}-${index}`} style={styles.card}>
                <View style={[styles.featureIconBadge, styles.featureIconBadgePro]}>
                  {featureIcon(resolveCopy(feature.title, PRO_FALLBACKS[index]?.title ?? feature.title), true)}
                </View>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{resolveCopy(feature.title, PRO_FALLBACKS[index]?.title ?? feature.title)}</Text>
                  <View style={styles.proPill}>
                    <Text style={styles.proPillText}>PRO</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>{resolveCopy(feature.description, PRO_FALLBACKS[index]?.description ?? feature.description)}</Text>
                {cost ? (
                  <Text style={styles.cost}>
                    Cost: ${cost.usd.toFixed(2)} / {cost.credits} credits
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 32,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flexBasis: 300,
    flexGrow: 1,
    minHeight: 180,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    gap: 12,
  },
  featureIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  featureIconBadgePro: {
    backgroundColor: '#ede9fe',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: '#64748b',
  },
  proPill: {
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  proPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  cost: {
    marginTop: 'auto',
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
});

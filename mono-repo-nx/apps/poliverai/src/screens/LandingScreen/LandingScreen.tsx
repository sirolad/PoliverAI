import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@poliverai/intl';
import { FeatureCard } from '@poliverai/shared-ui';

const { width } = Dimensions.get('window');

type Feature = {
  title: string;
  description: string;
  emoji?: string;
  isPro?: boolean;
};

type SafeNavigation = { navigate?: (...args: unknown[]) => void } | undefined;

function useSafeNavigation(): SafeNavigation {
  try {
    return useNavigation() as unknown as SafeNavigation;
  } catch {
    return undefined;
  }
}

export default function LandingScreen() {
  const { isAuthenticated } = useAuth();
  const navigation = useSafeNavigation();

  const freeFeatures: Feature[] = [
    {
      emoji: '📄',
      title: 'Basic Policy Verification',
      description:
        'Upload and analyze privacy policies for basic GDPR compliance checks using rule-based detection.',
    },
    {
      emoji: '🛡️',
      title: 'Essential Compliance Checks',
      description:
        'Detect fundamental GDPR violations and get basic recommendations for improvement.',
    },
    {
      emoji: '⚡',
      title: 'Fast Analysis',
      description: 'Quick compliance screening using our optimized rule-based analysis engine.',
    },
  ];

  const proFeatures: Feature[] = [
    {
      emoji: '🤖',
      title: 'AI-Powered Deep Analysis',
      description:
        'Advanced AI analysis that detects nuanced privacy violations and complex compliance issues.',
      isPro: true,
    },
    {
      emoji: '📊',
      title: 'Comprehensive Reporting',
      description:
        'Detailed compliance reports with confidence scores, evidence, and actionable recommendations.',
      isPro: true,
    },
    {
      emoji: '✍️',
      title: 'Policy Generation & Revision',
      description: 'Generate revised policies automatically based on detected compliance gaps.',
      isPro: true,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.title}>PoliverAI</Text>
        <Text style={styles.subtitle}>Your AI-Powered GDPR Compliance Assistant</Text>
        <Text style={styles.lead}>
          Automatically analyze privacy policies for GDPR compliance, detect violations,
          and generate comprehensive reports with AI-powered insights.
        </Text>

        <View style={styles.heroButtons}>
          {!isAuthenticated ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => navigation?.navigate?.('Signup' as never)}
              >
                <Text style={styles.buttonText}>Start Free Analysis</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.outlineButton]}
                onPress={() => navigation?.navigate?.('Signup' as never)}
              >
                <Text style={styles.outlineButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => navigation?.navigate?.('Dashboard' as never)}>
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Powerful Features for Every Need</Text>
        <Text style={styles.sectionLead}>From basic compliance checks to advanced AI-powered analysis</Text>

        <Text style={styles.subHeading}>Free Tier Features</Text>
        <View style={styles.grid}>
          {freeFeatures.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </View>

        <Text style={styles.subHeading}>Pro Tier Features</Text>
        <View style={styles.grid}>
          {proFeatures.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </View>
      </View>

      {/* How it works */}
      <View style={[styles.section, styles.howItWorks]}>
        <Text style={styles.sectionTitle}>How PoliverAI Works</Text>
        <Text style={styles.sectionLead}>Simple, powerful, and intelligent GDPR compliance analysis</Text>

        <View style={styles.stepsRow}>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepTitle}>Upload Your Policy</Text>
            <Text style={styles.stepDesc}>Upload privacy policies in multiple formats (PDF, DOCX, TXT, HTML)</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepTitle}>AI Analysis</Text>
            <Text style={styles.stepDesc}>Our AI analyzes your policy against GDPR requirements with multiple analysis modes</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepTitle}>Get Results</Text>
            <Text style={styles.stepDesc}>Receive detailed reports with compliance scores, violations, and actionable recommendations</Text>
          </View>
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        <Text style={styles.sectionLead}>Start with our free tier or upgrade for advanced AI features</Text>

        <View style={styles.pricingRow}>
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Free Tier</Text>
            <Text style={styles.pricingPrice}>$0</Text>
            <Text style={styles.pricingDesc}>Perfect for getting started</Text>
            <View style={styles.pricingList}>
              <Text>• Basic policy verification</Text>
              <Text>• Rule-based compliance checks</Text>
              <Text>• Fast analysis mode</Text>
            </View>
            <TouchableOpacity style={[styles.button, styles.outlineButton]}> 
              <Text style={styles.outlineButtonText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pricingCard, styles.pricingPro]}>
            <Text style={styles.popularBadge}>POPULAR</Text>
            <Text style={styles.pricingTitle}>Pro Tier</Text>
            <Text style={styles.pricingPricePro}>$29</Text>
            <Text style={styles.pricingDesc}>per month</Text>
            <View style={styles.pricingList}>
              <Text>• Everything in Free</Text>
              <Text>• AI-powered deep analysis</Text>
              <Text>• Comprehensive reporting</Text>
            </View>
            <TouchableOpacity style={[styles.button, styles.primaryButton]}>
              <Text style={styles.buttonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CTA */}
      {!isAuthenticated && (
        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Ready to Ensure GDPR Compliance?</Text>
          <Text style={styles.ctaLead}>Join thousands of organizations using PoliverAI to maintain privacy compliance</Text>
          <TouchableOpacity style={[styles.button, styles.ctaButton]} onPress={() => navigation?.navigate?.('Signup' as never)}>
            <Text style={styles.buttonText}>Start Your Free Analysis Today</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const CARD_MIN_WIDTH = Math.min(340, Math.max(280, Math.floor(width / 1.1)));

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#f8fafc',
  },
  hero: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 18,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '700',
  },
  lead: {
    textAlign: 'center',
    marginTop: 12,
    color: '#475569',
    fontSize: 16,
    maxWidth: 720,
  },
  heroButtons: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
  },
  sectionLead: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 16,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    minWidth: CARD_MIN_WIDTH,
    flexBasis: CARD_MIN_WIDTH,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
    margin: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPro: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  iconFree: {
    color: '#16a34a',
  },
  iconPro: {
    color: '#2563eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  proBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#475569',
    marginTop: 6,
  },
  howItWorks: {
    backgroundColor: '#f1f5f9',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  stepNumber: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumberText: { color: '#fff', fontWeight: '800' },
  stepTitle: { fontWeight: '700', marginBottom: 4 },
  stepDesc: { color: '#64748b', textAlign: 'center' },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  pricingCard: {
    width: Math.min(360, width - 48),
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    margin: 8,
  },
  pricingPro: {
    backgroundColor: '#eff6ff',
  },
  popularBadge: {
    backgroundColor: '#2563eb',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
    fontWeight: '800',
  },
  pricingTitle: { fontSize: 18, fontWeight: '800' },
  pricingPrice: { fontSize: 28, fontWeight: '900', color: '#16a34a', marginVertical: 8 },
  pricingPricePro: { fontSize: 28, fontWeight: '900', color: '#2563eb', marginVertical: 8 },
  pricingDesc: { color: '#64748b' },
  pricingList: { marginTop: 12, marginBottom: 12 },
  cta: { backgroundColor: '#2563eb', paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', marginTop: 16 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  ctaLead: { color: '#dbeafe', marginTop: 8, marginBottom: 12, textAlign: 'center' },
  ctaButton: { backgroundColor: '#0b63d6' },
});

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
import { useAuth, useTranslation } from '@poliverai/intl';
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
  const { t, get } = useTranslation();
  const navigation = useSafeNavigation();

  // Load feature lists from locales; fall back to inline defaults if missing
  const freeFeatures: Feature[] = (get('landing.features.free') as unknown as Feature[])
    ?? [
      { emoji: '📄', title: t('landing.features.free.0.title', 'Basic Policy Verification'), description: t('landing.features.free.0.description', 'Upload and analyze privacy policies for basic GDPR compliance checks using rule-based detection.') },
      { emoji: '🛡️', title: t('landing.features.free.1.title', 'Essential Compliance Checks'), description: t('landing.features.free.1.description', 'Detect fundamental GDPR violations and get basic recommendations for improvement.') },
      { emoji: '⚡', title: t('landing.features.free.2.title', 'Fast Analysis'), description: t('landing.features.free.2.description', 'Quick compliance screening using our optimized rule-based analysis engine.') },
    ];

  const proFeatures: Feature[] = (get('landing.features.pro') as unknown as Feature[])
    ?? [
      { emoji: '🤖', title: t('landing.features.pro.0.title', 'AI-Powered Deep Analysis'), description: t('landing.features.pro.0.description', 'Advanced AI analysis that detects nuanced privacy violations and complex compliance issues.'), isPro: true },
      { emoji: '📊', title: t('landing.features.pro.1.title', 'Comprehensive Reporting'), description: t('landing.features.pro.1.description', 'Detailed compliance reports with confidence scores, evidence, and actionable recommendations.'), isPro: true },
      { emoji: '✍️', title: t('landing.features.pro.2.title', 'Policy Generation & Revision'), description: t('landing.features.pro.2.description', 'Generate revised policies automatically based on detected compliance gaps.'), isPro: true },
    ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.introText}>
          <Text style={styles.title}>{t('landing.hero.brand', 'PoliverAI')}</Text>
          <Text style={styles.subtitle}> - {t('landing.hero.tagline', 'Your AI-Powered GDPR Compliance Assistant')}</Text>
        </View>
        <Text style={styles.lead}>{t('landing.hero.lead', 'Automatically analyze privacy policies for GDPR compliance, detect violations, and generate comprehensive reports with AI-powered insights.')}</Text>

        <View style={styles.heroButtons}>
          {!isAuthenticated ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => navigation?.navigate?.('Signup' as never)}
              >
                <Text style={styles.buttonText}>{t('landing.hero.buttons.startFree', 'Start Free Analysis')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.outlineButton]}
                onPress={() => navigation?.navigate?.('Signup' as never)}
              >
                <Text style={styles.outlineButtonText}>{t('landing.hero.buttons.upgradePro', 'Upgrade to Pro')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => navigation?.navigate?.('Dashboard' as never)}>
              <Text style={styles.buttonText}>{t('landing.hero.buttons.goToDashboard', 'Go to Dashboard')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('landing.features.title', 'Powerful Features for Every Need')}</Text>
  <Text style={styles.sectionLead}>{t('landing.features.lead', 'From basic compliance checks to advanced AI-powered analysis')}</Text>

        <View style={styles.subHeadingContainer}>
          <Text style={styles.subHeading}>{t('landing.features.freeLabel', 'Free Tier Features')}</Text>
        </View>
        <View style={styles.grid}>
          {freeFeatures.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </View>

        <View style={styles.subHeadingContainer}>
          <Text style={styles.subHeading}>{t('landing.features.proLabel', 'Pro Tier Features')}</Text>
        </View>
        <View style={styles.grid}>
          {proFeatures.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </View>
      </View>

      {/* How it works */}
      <View style={[styles.section, styles.howItWorks]}>
        <View style={styles.howItWorksWrapped}>
          <Text style={styles.sectionTitle}>{t('landing.how.title', 'How PoliverAI Works')}</Text>
          <Text style={styles.sectionLead}>{t('landing.how.lead', 'Simple, powerful, and intelligent GDPR compliance analysis')}</Text>

          <View style={styles.stepsRow}>
            <View style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepTitle}>{t('landing.how.steps.0.title', 'Upload Your Policy')}</Text>
              <Text style={styles.stepDesc}>{t('landing.how.steps.0.desc', 'Upload privacy policies in multiple formats (PDF, DOCX, TXT, HTML)')}</Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepTitle}>{t('landing.how.steps.1.title', 'AI Analysis')}</Text>
              <Text style={styles.stepDesc}>{t('landing.how.steps.1.desc', 'Our AI analyzes your policy against GDPR requirements with multiple analysis modes')}</Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepTitle}>{t('landing.how.steps.2.title', 'Get Results')}</Text>
              <Text style={styles.stepDesc}>{t('landing.how.steps.2.desc', 'Receive detailed reports with compliance scores, violations, and actionable recommendations')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('landing.pricing.title', 'Choose Your Plan')}</Text>
  <Text style={styles.sectionLead}>{t('landing.pricing.lead', 'Start with our free tier or upgrade for advanced AI features')}</Text>

        <View style={styles.pricingRow}>
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>{t('landing.pricing.free.title', 'Free Tier')}</Text>
            <Text style={styles.pricingPrice}>{t('landing.pricing.free.price', '$0')}</Text>
            <Text style={styles.pricingDesc}>{t('landing.pricing.free.desc', 'Perfect for getting started')}</Text>
            <View style={styles.pricingList}>
              {(get('landing.pricing.free.features') as string[] ?? []).map((f, i) => (
                <Text key={i} style={styles.pricingListItem}>{`• ${f}`}</Text>
              ))}
            </View>
            <TouchableOpacity style={[styles.planButton, styles.outlineButton]}> 
              <Text style={styles.outlineButtonText}>Get Started Free</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.pricingCard, styles.pricingPro]}>
            <Text style={styles.popularBadge}>{t('landing.pricing.pro.popular', 'POPULAR')}</Text>
            <Text style={styles.pricingTitle}>{t('landing.pricing.pro.title', 'Pro Tier')}</Text>
            <Text style={styles.pricingPricePro}>{t('landing.pricing.pro.price', '$29')}</Text>
            <Text style={styles.pricingDesc}>{t('landing.pricing.pro.per', 'per month')}</Text>
            <View style={styles.pricingList}>
              {(get('landing.pricing.pro.features') as string[] ?? []).map((f, i) => (
                <Text key={i} style={styles.pricingListItem}>{`• ${f}`}</Text>
              ))}
            </View>
            <TouchableOpacity style={[styles.planButton, styles.primaryButton]}>
              <Text style={styles.buttonText}>{t('landing.pricing.pro.button', 'Upgrade to Pro')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CTA */}
      {!isAuthenticated && (
        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>{t('landing.cta.title', 'Ready to Ensure GDPR Compliance?')}</Text>
          <Text style={styles.ctaLead}>{t('landing.cta.lead', 'Join thousands of organizations using PoliverAI to maintain privacy compliance')}</Text>
          <TouchableOpacity style={[styles.button, styles.ctaButton]} onPress={() => navigation?.navigate?.('Signup' as never)}>
            <Text style={styles.ctaButtonText}>{t('landing.cta.button', 'Start Your Free Analysis Today')}</Text>
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
  introText: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '45%',
  },
  title: {
    fontSize: 45,
    fontWeight: '800',
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 45,
    color: '#0f172a',
    fontWeight: '700',
  },
  lead: {
    textAlign: 'center',
    marginTop: 12,
    color: '#475569',
    fontSize: 20,
    maxWidth: 720,
  },
  heroButtons: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginTop: 12,
  },
  planButton: {
    paddingVertical: 13,
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  ctaButtonText: {
    color: '#000',
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
    paddingHorizontal: 26,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
  },
  sectionLead: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 20,
    marginBottom: 16,
    fontSize: 20,
  },
  subHeading: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  subHeadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '36%',
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 5,
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
  howItWorksWrapped: {
    width: '55%',
    justifyContent: 'center',
    alignSelf: 'center',
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
  stepTitle: { fontWeight: '700', marginBottom: 4, fontSize: 20 },
  stepDesc: { color: '#64748b', textAlign: 'center', fontSize: 16 },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  pricingCard: {
    width: Math.min(420, width - 48),
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
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
  pricingTitle: { fontSize: 21, fontWeight: '800' },
  pricingPrice: { fontSize: 37, fontWeight: '900', color: '#16a34a', marginVertical: 8 },
  pricingPricePro: { fontSize: 37, fontWeight: '900', color: '#2563eb', marginVertical: 8 },
  pricingDesc: { color: '#64748b' },
  pricingList: { marginTop: 20, marginBottom: 12, justifyContent: 'flex-start', flexDirection: 'column', },
  pricingListItem: { fontSize: 16, marginTop: 12, alignSelf: 'flex-start', justifyContent: 'flex-start' },
  cta: { backgroundColor: '#2563eb', paddingVertical: 60, paddingHorizontal: 16, alignItems: 'center', marginTop: 16 },
  ctaTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  ctaLead: { color: '#dbeafe', marginBottom: 12, textAlign: 'center', fontSize: 19, marginTop: 20 },
  ctaButton: { 
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', 
    backgroundColor: '#FFFFFF', marginTop: 20},
});

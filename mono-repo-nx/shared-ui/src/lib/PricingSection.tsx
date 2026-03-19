import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PaymentsService, t, useAuth } from '@poliverai/intl';
import { CheckCircle2, Clock3, CreditCard } from 'lucide-react-native';
import { appAlphaColors, appColors } from './colorTokens';

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

const freePlan = [
  'Basic policy verification',
  'Rule-based compliance checks',
  'Fast analysis mode',
  'Basic recommendations',
];

const proPlan = [
  'Everything in Free',
  'AI-powered deep analysis',
  'Comprehensive reporting',
  'Policy generation & revision',
  'Priority support',
];

export default function PricingSection() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const isWide = width >= 900;

  const startUpgrade = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    try {
      await PaymentsService.purchaseUpgrade(29);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{copy('landing.pricing.title', 'Choose Your Plan')}</Text>
        <Text style={styles.lead}>
          {copy('landing.pricing.subtitle', 'Start with our free tier or upgrade for advanced AI features')}
        </Text>
      </View>

      <View style={[styles.cards, isWide && styles.cardsWide]}>
        <View style={[styles.card, isWide && styles.cardWide]}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{copy('landing.pricing.free_title', 'Free Tier')}</Text>
            <Text style={[styles.price, styles.freePrice]}>{copy('landing.pricing.free_price', '$0')}</Text>
            <Text style={styles.planLead}>{copy('landing.pricing.free_desc', 'Perfect for getting started')}</Text>
          </View>
          <View style={styles.featuresList}>
            {freePlan.map((item) => (
              <View key={item} style={styles.featureRow}>
                <CheckCircle2 size={16} color="#16a34a" />
                <Text style={styles.featureItem}>{item}</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => navigation.navigate(isAuthenticated ? 'Dashboard' : 'Signup')}
            style={[styles.ctaButton, styles.secondaryCtaButton]}
          >
            <View style={styles.ctaInner}>
              <Clock3 size={16} color="#0f172a" />
              <Text style={styles.secondaryCtaText}>{copy('pricing.get_started_free', 'Get Started Free')}</Text>
            </View>
          </Pressable>
        </View>

        <View style={[styles.card, styles.cardPrimary, isWide && styles.cardWide]}>
          <View style={styles.popularPill}>
            <Text style={styles.popularText}>{copy('landing.pricing.popular', 'POPULAR')}</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{copy('landing.pricing.pro_title', 'Pro Tier')}</Text>
            <Text style={[styles.price, styles.pricePrimary]}>{copy('landing.pricing.pro_price', '$29')}</Text>
            <Text style={styles.planLead}>{copy('landing.pricing.pro_period', 'per month')}</Text>
          </View>
          <View style={styles.featuresList}>
            {proPlan.map((item) => (
              <View key={item} style={styles.featureRow}>
                <CheckCircle2 size={16} color="#2563eb" />
                <Text style={styles.featureItem}>{item}</Text>
              </View>
            ))}
          </View>
          <Pressable onPress={loading ? undefined : startUpgrade} style={[styles.ctaButton, styles.primaryCtaButton]}>
            <View style={styles.ctaInner}>
              <CreditCard size={16} color="#ffffff" />
              <Text style={styles.primaryCtaText}>
                {loading
                  ? 'Loading...'
                  : copy('pricing.upgrade', isAuthenticated ? 'Upgrade to Pro' : 'Sign in to upgrade')}
              </Text>
            </View>
          </Pressable>
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
  },
  title: {
    textAlign: 'center',
    color: appColors.ink900,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
  },
  lead: {
    marginTop: 12,
    textAlign: 'center',
    color: appColors.slate600,
    fontSize: 18,
    lineHeight: 29,
    maxWidth: 720,
  },
  cards: {
    marginTop: 32,
    gap: 22,
  },
  cardsWide: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSoftStrong,
    backgroundColor: '#FFFFFF',
    padding: 28,
  },
  cardWide: {
    flex: 1,
  },
  cardPrimary: {
    backgroundColor: '#EFF6FF',
    borderColor: appAlphaColors.borderBlueSoft,
  },
  popularPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  planHeader: {
    alignItems: 'center',
  },
  planTitle: {
    marginTop: 12,
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
  },
  price: {
    marginTop: 12,
    color: '#0F172A',
    fontSize: 44,
    fontWeight: '800',
  },
  freePrice: {
    color: appColors.green600,
  },
  pricePrimary: {
    color: '#2563EB',
  },
  planLead: {
    marginTop: 8,
    color: appColors.slate600,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresList: {
    marginTop: 22,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureItem: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 22,
  },
  ctaButton: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryCtaButton: {
    borderWidth: 1,
    borderColor: appAlphaColors.borderSlateSoft,
    backgroundColor: '#FFFFFF',
  },
  primaryCtaButton: {
    backgroundColor: '#2563EB',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryCtaText: {
    color: appColors.ink900,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryCtaText: {
    color: appColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

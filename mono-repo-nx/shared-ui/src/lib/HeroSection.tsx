import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { t, useAuth } from '@poliverai/intl';
import { ArrowRight, LayoutDashboard, Search, Sparkles } from 'lucide-react-native';
import { appAlphaColors, appColors } from './colorTokens';
import { landingBrandAssets } from './landingAssets';

function getCopy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

function WebLogo() {
  return (
    <Image
      source={{ uri: '/poliverai-logo.png' }}
      accessibilityLabel={getCopy('brand.alt', 'PoliverAI')}
      style={styles.logoImage}
      resizeMode="contain"
    />
  );
}

const NativeLogo = Platform.OS === 'web' ? null : require('../assets/poliverai-logo.svg').default;

export default function HeroSection() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const webWindow =
    typeof globalThis !== 'undefined'
      ? (globalThis as { window?: { location: { pathname: string } } }).window
      : undefined;

  const navigateTo = (route: string) => {
    try {
      navigation.navigate(route);
    } catch {
      if (webWindow) {
        webWindow.location.pathname =
          route === 'WebLanding' ? '/' : route === 'Signup' ? '/signup' : `/${route.toLowerCase()}`;
      }
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        {Platform.OS === 'web' ? <WebLogo /> : NativeLogo ? <NativeLogo width={280} height={120} /> : null}
        <Text style={styles.title}>
          {getCopy('landing.hero.prefix', 'Your')}{' '}
          <Text style={styles.titleHighlight}>{getCopy('landing.hero.highlight', 'AI-Powered')}</Text>{' '}
          {getCopy('landing.hero.suffix', 'GDPR Compliance Assistant')}
        </Text>
        <Text style={styles.lead}>
          {getCopy(
            'landing.hero.description',
            'Automatically analyze privacy policies for GDPR compliance, detect violations, and generate comprehensive reports with AI-powered insights.'
          )}
        </Text>

        <View style={styles.actions}>
          {isAuthenticated ? (
            <Pressable onPress={() => navigateTo('Dashboard')} style={[styles.button, styles.primaryButton]}>
              <View style={styles.buttonInner}>
                <LayoutDashboard size={18} color={appColors.white} />
                <Text style={styles.primaryButtonText}>{getCopy('landing.buttons.go_dashboard', 'Go to Dashboard')}</Text>
              </View>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => navigateTo('Signup')} style={[styles.button, styles.primaryButton]}>
                <View style={styles.buttonInner}>
                  <Search size={18} color={appColors.white} />
                  <Text style={styles.primaryButtonText}>{getCopy('landing.buttons.start_free', 'Start Free Analysis')}</Text>
                  <ArrowRight size={18} color={appColors.white} />
                </View>
              </Pressable>
              <Pressable onPress={() => navigateTo('Login')} style={[styles.button, styles.secondaryButton]}>
                <View style={styles.buttonInner}>
                  <Sparkles size={18} color={appColors.ink900} />
                  <Text style={styles.secondaryButtonText}>{getCopy('landing.buttons.upgrade_to_pro', 'Upgrade to Pro')}</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.partnerRow}>
          <Text style={styles.partnerText}>{getCopy('landing.partner.prefix', 'An')}</Text>
          <Image source={landingBrandAssets.andelaLogo} style={styles.andelaLogo} resizeMode="contain" />
          <Text style={styles.partnerText}>
            {getCopy('landing.partner.suffix', 'initiative — designed in partnership with Andela')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 1024,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
  },
  heroCard: {
    alignItems: 'center',
  },
  logoImage: {
    width: 600,
    height: 300,
  },
  logoFallback: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: appColors.white,
  },
  logoFallbackText: {
    color: appColors.ink900,
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    marginTop: 16,
    maxWidth: 900,
    textAlign: 'center',
    color: appColors.ink900,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '700',
  },
  titleHighlight: {
    color: appColors.blue600,
  },
  lead: {
    maxWidth: 768,
    marginTop: 8,
    textAlign: 'center',
    color: appColors.gray600,
    fontSize: 18,
    lineHeight: 30,
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: appColors.blue600,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: appColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSlateSoft,
  },
  secondaryButtonText: {
    color: appColors.ink900,
    fontSize: 16,
    fontWeight: '700',
  },
  partnerRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  partnerText: {
    color: appColors.gray600,
    fontSize: 18,
  },
  andelaLogo: {
    width: 96,
    height: 36,
  },
});

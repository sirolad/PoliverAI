import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, spacing, twFromTokens } from './styleTokens';

import { useTranslation } from '@poliverai/intl';

const logoSrc = require('../../assets/poliverai-logo.png'); // Update path as needed
const andelaLogoSrc = require('../../assets/andela-logo-transparent.png'); // Update path as needed

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Image source={logoSrc} style={styles.logo} resizeMode="contain" />
      <Text style={styles.heading}>
        {t('landing.hero.prefix')} <Text style={styles.highlight}>{t('landing.hero.highlight')}</Text> {t('landing.hero.suffix')}
      </Text>
      <Text style={styles.lead}>{t('landing.hero.description')}</Text>
      {/* CTA buttons would go here */}
      <View style={styles.partnerRow}>
        <Text style={styles.partnerText}>{t('landing.partner.prefix')}</Text>
        <Image source={andelaLogoSrc} style={styles.andelaLogo} resizeMode="contain" />
        <Text style={styles.partnerText}>{t('landing.partner.suffix')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  paddingVertical: 24,
    backgroundColor: colors.pageBg.hex,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 16,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary.hex,
    marginBottom: 8,
    textAlign: 'center',
  },
  highlight: {
    color: colors.primary.hex,
  },
  lead: {
    fontSize: 18,
    color: colors.textMuted.hex,
    marginBottom: 16,
    textAlign: 'center',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  partnerText: {
    fontSize: 16,
    color: colors.textMuted.hex,
    marginHorizontal: 4,
  },
  andelaLogo: {
    width: 40,
    height: 40,
    marginHorizontal: 4,
  },
});

export default HeroSection;

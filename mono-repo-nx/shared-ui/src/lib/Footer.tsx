import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';
import { appAlphaColors, appColors } from './colorTokens';
import { landingBrandAssets } from './landingAssets';

interface FooterProps {
  hasBackground?: boolean;
}

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function Footer({ hasBackground = true }: FooterProps) {
  return (
    <View style={[styles.footer, hasBackground ? styles.footerBg : styles.footerTransparent]}>
      <View style={styles.content}>
        <Text style={[styles.short, hasBackground ? styles.shortOnBlue : styles.shortOnWhite]}>
          {copy('footer.short', 'Fast, simple GDPR compliance checks')}
        </Text>
        <Text style={[styles.paragraph, hasBackground ? styles.paragraphOnBlue : styles.paragraphOnWhite]}>
          {copy('footer.paragraph', 'A quick, reliable privacy policy analysis — get results fast and act with confidence.')}
        </Text>
        <Text style={[styles.meta, hasBackground ? styles.metaOnBlue : styles.metaOnWhite]}>
          {copy('brand_block.copyright', `© ${new Date().getFullYear()} PoliverAI ™. All rights reserved.`)}
        </Text>
        <Text style={[styles.meta, hasBackground ? styles.metaOnBlue : styles.metaOnWhite]}>
          {copy('brand_block.partnership', 'Designed in partnership with Andela')}
        </Text>
        <View style={[styles.brandPill, { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.12)' } as any]}>
          <Image
            source={landingBrandAssets.poliveraiLogo}
            style={styles.brandIconImage}
            resizeMode="contain"
          />
          <Image
            source={landingBrandAssets.andelaLogo}
            style={styles.andelaIconImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  footerBg: {
    backgroundColor: appColors.blue600,
  },
  footerTransparent: {
    backgroundColor: 'transparent',
  },
  content: {
    maxWidth: 896,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
  },
  short: {
    maxWidth: 640,
    fontSize: 14,
    textAlign: 'center',
  },
  shortOnBlue: {
    color: 'rgba(219, 234, 254, 0.95)',
  },
  shortOnWhite: {
    color: appColors.slate500,
  },
  paragraph: {
    maxWidth: 640,
    marginTop: 16,
    fontSize: 16,
    lineHeight: 27,
    textAlign: 'center',
  },
  paragraphOnBlue: {
    color: appAlphaColors.white92,
  },
  paragraphOnWhite: {
    color: appColors.slate600,
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  metaOnBlue: {
    color: 'rgba(219, 234, 254, 0.95)',
  },
  metaOnWhite: {
    color: appColors.slate500,
  },
  brandPill: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: appColors.white,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: appColors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  brandIconImage: {
    width: 100,
    height: 50,
  },
  andelaIconImage: {
    width: 130,
    height: 50,
  },
  brandText: {
    color: appColors.ink900,
    fontSize: 18,
    fontWeight: '700',
  },
  partnerText: {
    color: appColors.slate600,
    fontSize: 16,
    fontWeight: '600',
  },
});

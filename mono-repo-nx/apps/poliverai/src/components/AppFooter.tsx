import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';
import { appAlphaColors, appColors } from '@poliverai/shared-ui';
import { AndelaLogo, FullBrandLogo } from './BrandLogo';

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function AppFooter() {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativeFooter}>
        <View style={styles.nativeContent}>
          <Text style={styles.short}>{copy('footer.short', 'Fast, simple GDPR compliance checks')}</Text>
          <Text style={styles.nativeParagraph}>
            {copy('footer.paragraph', 'A quick, reliable privacy policy analysis - get results fast and act with confidence.')}
          </Text>
          <Text style={styles.nativeMeta}>
            {copy('brand_block.copyright', `© ${new Date().getFullYear()} PoliverAI ™. All rights reserved.`)}
          </Text>
          <Text style={styles.nativeMeta}>{copy('brand_block.partnership', 'Designed in partnership with Andela')}</Text>
          <View style={styles.nativeBrandPill}>
            <FullBrandLogo width={100} height={36} />
            <AndelaLogo
              width={100}
              height={36}
              imageStyle={styles.nativeAndelaImage}
              fallbackStyle={styles.nativeAndelaFallback}
              textStyle={styles.nativeTextLogo}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <View style={styles.content}>
        <Text style={styles.short}>{copy('footer.short', 'Fast, simple GDPR compliance checks')}</Text>
        <Text style={styles.paragraph}>
          {copy('footer.paragraph', 'A quick, reliable privacy policy analysis — get results fast and act with confidence.')}
        </Text>
        <Text style={styles.meta}>
          {copy('brand_block.copyright', `© ${new Date().getFullYear()} PoliverAI ™. All rights reserved.`)}
        </Text>
        <Text style={styles.meta}>{copy('brand_block.partnership', 'Designed in partnership with Andela')}</Text>
        <View style={styles.brandPill}>
          <FullBrandLogo width={100} height={50} />
          <AndelaLogo width={130} height={50} imageStyle={styles.andelaImage} textStyle={styles.nativeTextLogo} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeFooter: {
    width: '100%',
    backgroundColor: appColors.blue600,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  nativeContent: {
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    alignItems: 'center',
  },
  footer: {
    backgroundColor: appColors.blue600,
    paddingHorizontal: 16,
    paddingVertical: 48,
  },
  content: {
    maxWidth: 896,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
  },
  short: {
    fontSize: 14,
    color: appAlphaColors.blueText95,
    textAlign: 'center',
  },
  paragraph: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 27,
    color: appAlphaColors.white92,
    textAlign: 'center',
  },
  nativeParagraph: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: appAlphaColors.white92,
    textAlign: 'center',
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
    color: appAlphaColors.blueText95,
    textAlign: 'center',
  },
  nativeMeta: {
    marginTop: 8,
    fontSize: 14,
    color: appAlphaColors.blueText95,
    textAlign: 'center',
  },
  brandPill: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: appColors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nativeBrandPill: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: appColors.white,
    gap: 12,
  },
  nativeAndelaFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeAndelaImage: {
    width: 100,
    height: 36,
  },
  andelaImage: {
    width: 130,
    height: 50,
  },
  nativeTextLogo: {
    color: appColors.ink900,
    fontSize: 22,
    fontWeight: '700',
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: appColors.white,
    fontSize: 18,
    fontWeight: '800',
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

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';
import PoliveraiLogo from '../assets/poliverai-logo.svg';

interface FooterProps {
  hasBackground?: boolean;
}

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function Footer({ hasBackground = false }: FooterProps) {
  return (
    <View style={[styles.footer, hasBackground && styles.footerBackground]}>
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
          <PoliveraiLogo width={100} height={40} />
          <Text style={styles.andelaText}>Andela</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 48,
  },
  footerBackground: {
    backgroundColor: '#2563eb',
  },
  content: {
    maxWidth: 896,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
  },
  short: {
    fontSize: 14,
    color: 'rgba(219,234,254,0.95)',
    textAlign: 'center',
  },
  paragraph: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 27,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(219,234,254,0.95)',
    textAlign: 'center',
  },
  brandPill: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  andelaText: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '700',
  },
  text: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
});

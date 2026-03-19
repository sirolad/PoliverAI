import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { t } from '@poliverai/intl';
import { ArrowRight, Search } from 'lucide-react-native';
import { appAlphaColors, appColors } from './colorTokens';

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function CTASection() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.section}>
      <View style={styles.inner}>
        <Text style={styles.heading}>{copy('landing.cta.heading', 'Ready to Ensure GDPR Compliance?')}</Text>
        <Text style={styles.paragraph}>
          {copy(
            'landing.cta.paragraph',
            'Join thousands of organizations using PoliverAI to maintain privacy compliance'
          )}
        </Text>
        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.button}>
          <View style={styles.buttonInner}>
            <Search size={18} color="#0f172a" />
            <Text style={styles.buttonText}>
              {copy('landing.buttons.start_free_cta', 'Start Your Free Analysis Today')}
            </Text>
            <ArrowRight size={18} color="#0f172a" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: appColors.blue600,
    paddingHorizontal: 16,
    paddingVertical: 64,
  },
  inner: {
    maxWidth: 920,
    width: '100%',
    marginHorizontal: 'auto',
    alignItems: 'center',
  },
  heading: {
    color: appColors.white,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    textAlign: 'center',
  },
  paragraph: {
    marginTop: 16,
    maxWidth: 740,
    color: appAlphaColors.white84,
    fontSize: 18,
    lineHeight: 31,
    textAlign: 'center',
  },
  button: {
    marginTop: 26,
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: appColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: appColors.ink900,
    fontSize: 16,
    fontWeight: '700',
  },
});

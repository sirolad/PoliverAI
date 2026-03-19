import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@poliverai/intl';

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function TeamWriteup() {
  return (
    <View style={styles.section}>
      <View style={styles.rule} />
      <View style={styles.inner}>
        <Text style={styles.heading}>{copy('landing.team.heading', 'Why We Love Building Poliver AI')}</Text>
        <Text style={styles.paragraph}>
          {copy(
            'landing.team.paragraph',
            "Our team takes great pride in building PoliverAI. We collaborate openly, learn from each other, and bring curiosity to solve privacy challenges that matter. Every feature is crafted with care — to make compliance easier, more reliable, and human-centered. Working together on this project isn't just a job for us — it's a shared passion, and we hope that energy comes through for our users."
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 64,
    alignItems: 'center',
  },
  rule: {
    width: 144,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#60a5fa',
    marginBottom: 24,
  },
  inner: {
    maxWidth: 768,
    width: '100%',
    alignItems: 'center',
  },
  heading: {
    color: '#0f172a',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    textAlign: 'center',
  },
  paragraph: {
    marginTop: 16,
    maxWidth: 768,
    color: '#4b5563',
    fontSize: 20,
    lineHeight: 34,
    textAlign: 'center',
  },
});

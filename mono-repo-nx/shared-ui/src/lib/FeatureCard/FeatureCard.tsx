import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type FeatureProps = {
  title: string;
  description: string;
  emoji?: string;
  isPro?: boolean;
};

export function FeatureCard({ title, description, emoji, isPro }: FeatureProps) {
  return (
    <View style={[styles.card, isPro ? styles.cardPro : null]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardIcon, isPro ? styles.iconPro : styles.iconFree]}>
          {emoji || '•'}
        </Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {isPro && <Text style={styles.proBadge}>PRO</Text>}
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

const CARD_MIN_WIDTH = Math.min(340, Math.max(280, Math.floor(width / 1.1)));

const styles = StyleSheet.create({
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
});

import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from '@poliverai/intl';

const { width } = Dimensions.get('window');

type FeatureProps = {
  title: string;
  description: string;
  emoji?: string;
  // optional icon component (web or native). If provided, will be rendered instead of emoji.
  icon?: React.ComponentType<any> | null;
  isPro?: boolean;
};

export function FeatureCard({ title, description, emoji, icon, isPro }: FeatureProps) {
  const { t } = useTranslation();
  const Icon = icon as any;

  const renderIcon = () => {
    if (Icon) {
      try {
        // Render the provided icon component. For web this may be an SVG React component
        // For native it may be a vector-icon component. Try to pass common sizing props.
        return (
          <View style={{ marginRight: 8 }}>
            <Icon width={22} height={22} size={22} color={isPro ? '#2563eb' : '#16a34a'} />
          </View>
        );
      } catch (e) {
        // If rendering fails (e.g., web-only component on native), fall back to emoji
      }
    }

    return (
      <Text style={[styles.cardIcon, isPro ? styles.iconPro : styles.iconFree]}>
        {emoji || t('components.featureCard.defaultEmoji', '•')}
      </Text>
    );
  };

  return (
    <View style={[styles.card, isPro ? styles.cardPro : null]}>
      <View style={styles.cardHeader}>
  {renderIcon()}
  <Text style={styles.cardTitle}>{title}{isPro && <Text style={styles.proBadge}>{t('components.featureCard.proBadge', 'PRO')}</Text>}</Text>
        
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

const CARD_MIN_WIDTH = Math.min(420, Math.max(230, Math.floor(width / 1.1)));

const styles = StyleSheet.create({
  card: {
    minWidth: CARD_MIN_WIDTH,
    flexBasis: CARD_MIN_WIDTH,
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 24,
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
    fontSize: 18,
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
    marginLeft: 10,
  },
  cardDescription: {
    color: '#475569',
    marginTop: 12,
    fontSize: 17,
  },
});

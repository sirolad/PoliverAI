import { Text } from 'react-native';
import { useTranslation } from '@poliverai/intl';

export const PlatformGreeting = () => {
  const { t } = useTranslation();
  return <Text>{t('platformGreeting.windows', 'Welcome to PoliverAI (Windows)')}</Text>;
};

export default PlatformGreeting;

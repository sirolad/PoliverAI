import { Text } from 'react-native';
import { useTranslation } from '@poliverai/intl';

export const PlatformGreeting = () => {
  const { t } = useTranslation();
  return <Text>{t('platformGreeting.default', 'Welcome to PoliverAI')}</Text>;
};

export default PlatformGreeting;

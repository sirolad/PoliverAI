import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Card, Button } from '@poliverai/shared-ui';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useTranslation } from '@poliverai/intl';
import brandAssets from '../../../assets/brand';

type SafeNavigation = { navigate?: (...args: unknown[]) => void; replace?: (...args: unknown[]) => void } | undefined;

function useSafeNavigation(): SafeNavigation {
  try {
    return useNavigation() as unknown as SafeNavigation;
  } catch {
    return undefined;
  }
}

export const LoginScreen: React.FC = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigation = useSafeNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      navigation?.replace?.('Dashboard');
    }
  }, [isAuthenticated, navigation]);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t('screens.login.errors.invalidEmail', 'Invalid email address');
    if (password.length < 6) return t('screens.login.errors.passwordShort', 'Password must be at least 6 characters');
    return '';
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      // login throws on failure; successful completion means login succeeded
      await login(email, password);
      navigation?.navigate?.('Dashboard');
    } catch (e: unknown) {
      const message = (e as { message?: string })?.message || t('screens.login.errors.loginFailed', 'Login failed');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={brandAssets.poliveraiIcon} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.headerTitle}>{t('screens.login.header.title', 'Welcome back to PoliverAI')}</Text>
          <Text style={styles.headerSubtitle}>{t('screens.login.header.subtitle', 'Sign in to access your GDPR compliance dashboard')}</Text>
        </View>

        <Card style={styles.cardStyle}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{t('screens.login.form.title', 'Sign In')}</Text>
            <Text style={{ color: '#6b7280', marginBottom: 12 }}>{t('screens.login.form.subtitle', 'Enter your email and password to access your account')}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input label={t('screens.login.form.emailLabel', 'Email address')} placeholder={t('screens.login.form.emailPlaceholder', 'Enter your email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={undefined} />
            <Input label={t('screens.login.form.passwordLabel', 'Password')} placeholder={t('screens.login.form.passwordPlaceholder', 'Enter your password')} value={password} onChangeText={setPassword} secureTextEntry error={undefined} />

            <Button title={isSubmitting ? t('screens.login.form.submitting', 'Signing in...') : t('screens.login.form.submit', 'Sign In')} onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} />

            <View style={styles.footerText}>
        <Text style={styles.smallText}>{t('screens.login.footer.noAccount', "Don't have an account? Sign up for free")}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20, alignItems: 'center', marginTop: '10%' },
  logoImage: { 
    width: 72, 
    height: 72, 
    marginBottom: 20 
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { color: '#6b7280', marginTop: 6, textAlign: 'center' },
  errorBox: { padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, marginBottom: 12 },
  errorText: { color: '#b91c1c' },
  footerText: { marginTop: 12, alignItems: 'center' },
  smallText: { color: '#6b7280' },
  cardStyle: {
    width: '100%',
    maxWidth: 450, 
    alignSelf: 'center' 
  }
});
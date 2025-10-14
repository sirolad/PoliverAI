import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@poliverai/shared-ui';
import { Button } from '@poliverai/shared-ui';
import { Card } from '@poliverai/shared-ui';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useTranslation } from '@poliverai/intl';
import brandAssets from '../../../assets/brand';

export const RegisterScreen: React.FC = () => {
  const { register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      // navigate to Dashboard when authenticated
      // @ts-expect-error: navigation may not expose replace in some environments
      navigation?.replace?.('Dashboard');
    }
  }, [isAuthenticated, navigation]);

  const validate = () => {
    if (name.trim().length < 2) return t('screens.register.errors.nameShort');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t('screens.register.errors.invalidEmail');
    if (password.length < 6) return t('screens.register.errors.passwordShort');
    if (password !== confirmPassword) return t('screens.register.errors.passwordsMismatch');
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
      // registerUser throws on failure; successful completion means registration succeeded
      await registerUser(name, email, password);
      // @ts-expect-error: navigation typing may vary at runtime
      navigation?.navigate?.('Dashboard');
    } catch (e: unknown) {
  const message = (e as { message?: string })?.message || t('screens.register.errors.registrationFailed');
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
          <Text style={styles.headerTitle}>{t('screens.register.header.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('screens.register.header.subtitle')}</Text>
        </View>

        <Card style={styles.cardStyle}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{t('screens.register.form.title')}</Text>
            <Text style={{ color: '#6b7280', marginBottom: 12 }}>{t('screens.register.form.subtitle')}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input label={t('screens.register.form.fullNameLabel')} placeholder={t('screens.register.form.fullNamePlaceholder')} value={name} onChangeText={(v) => { setName(v); setError(''); }} error={undefined} />
            <Input label={t('screens.register.form.emailLabel')} placeholder={t('screens.register.form.emailPlaceholder')} value={email} onChangeText={(v) => { setEmail(v); setError(''); }} keyboardType="email-address" autoCapitalize="none" error={undefined} />
            <Input label={t('screens.register.form.passwordLabel')} placeholder={t('screens.register.form.passwordPlaceholder')} value={password} onChangeText={(v) => { setPassword(v); setError(''); }} secureTextEntry error={undefined} />
            <Input label={t('screens.register.form.confirmPasswordLabel')} placeholder={t('screens.register.form.confirmPasswordPlaceholder')} value={confirmPassword} onChangeText={(v) => { setConfirmPassword(v); setError(''); }} secureTextEntry error={undefined} />

            <Button title={isSubmitting ? t('screens.register.form.submitting') : t('screens.register.form.submit')} onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} />

            <View style={styles.footerText}>
              <Text style={styles.smallText}>{t('screens.register.footer.haveAccount')}{' '}</Text>
              <Text style={[styles.smallText, { color: '#2563eb', fontWeight: '700' }]} onPress={() => navigation?.navigate?.('Login' as never)}>{t('screens.register.footer.signIn')}</Text>
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
  header: { marginBottom: 20, alignItems: 'center', marginTop: '10%'  },
  logoImage: { 
    width: 72, 
    height: 72, 
    marginBottom: 20 
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a'},
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

export default RegisterScreen;
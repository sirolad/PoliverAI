import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { appAlphaColors, appColors } from '@poliverai/shared-ui';
import { t, useAuth } from '@poliverai/intl';
import { ArrowRight, LogIn, UserPlus } from 'lucide-react-native';
import AppFooter from '../../components/AppFooter';
import AppTopNav from '../../components/AppTopNav';
import { BrandLogo } from '../../components/BrandLogo';

function copy(path: string, fallback: string) {
  const value = t(path, fallback);
  return typeof value === 'string' ? value : fallback;
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, loading, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goTo = React.useCallback((routeName: string, path: string) => {
    try {
      navigation.navigate(routeName);
    } catch {
      if (typeof window !== 'undefined') {
        window.location.pathname = path;
      }
    }
  }, [navigation]);

  React.useEffect(() => {
    if (isAuthenticated) {
      goTo('Dashboard', '/dashboard');
    }
  }, [goTo, isAuthenticated]);

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await login(email, password);
      goTo('Dashboard', '/dashboard');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else if (typeof err === 'string') setError(err);
      else setError('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <AppTopNav currentRoute="login" />
        <ScrollView contentContainerStyle={styles.loadingScrollContent}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={appColors.blue600} />
          </View>
          <View style={styles.footerWrap}>
            <AppFooter />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <AppTopNav currentRoute="login" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrap}>
          <View style={styles.shell}>
            <View style={styles.hero}>
              <BrandLogo width={280} height={120} style={styles.heroMarkImage} />
              <Text style={styles.heroTitle}>{copy('auth_login.welcome_title', 'Welcome back to PoliverAI')}</Text>
              <Text style={styles.heroSubtitle}>
                {copy('auth_login.welcome_subtitle', 'Sign in to continue your privacy compliance workflow')}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy('auth_login.sign_in_title', 'Sign in to your account')}</Text>
              <Text style={styles.cardDesc}>{copy('auth_login.sign_in_desc', 'Enter your credentials to access your account')}</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>{copy('auth.register.email_label', 'Email')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={copy('auth.register.email_placeholder', 'Enter your email')}
                  placeholderTextColor={appColors.slate400}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{copy('auth.register.password_label', 'Password')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={copy('auth.register.password_placeholder', 'Enter your password')}
                  placeholderTextColor={appColors.slate400}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={appColors.white} />
                ) : (
                  <View style={styles.primaryButtonInner}>
                    <LogIn size={16} color={appColors.white} />
                    <Text style={styles.primaryButtonText}>{copy('auth_login.sign_in_cta', 'Sign in')}</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>{copy('auth_login.no_account_prefix', "Don't have an account?")}</Text>
                <Pressable onPress={() => goTo('Register', '/register')} style={styles.inlineLinkButton}>
                  <UserPlus size={14} color={appColors.blue600} />
                  <Text style={styles.linkText}>{copy('auth_login.sign_up_cta', 'Sign up')}</Text>
                  <ArrowRight size={14} color={appColors.blue600} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.footerWrap}>
          <AppFooter />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appColors.sky50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 48,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
  },
  loadingScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 48,
  },
  contentWrap: {
    width: '100%',
    paddingHorizontal: 16,
  },
  shell: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  footerWrap: {
    width: '100%',
    marginTop: 32,
    alignSelf: 'stretch',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroMarkText: {
    color: appColors.white,
    fontSize: 32,
    fontWeight: '800',
  },
  heroMarkImage: {
    width: 280,
    height: 120,
    marginBottom: 12,
  },
  heroTitle: {
    color: appColors.ink900,
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 10,
    color: appColors.slate500,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: appColors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSoftStrong,
    padding: 28,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)' } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 3,
        }),
  },
  cardTitle: {
    color: appColors.ink900,
    fontSize: 24,
    fontWeight: '700',
  },
  cardDesc: {
    marginTop: 8,
    color: appColors.slate500,
    fontSize: 15,
    lineHeight: 23,
  },
  errorBox: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: appColors.red100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: appColors.red600,
    fontSize: 14,
  },
  field: {
    marginTop: 16,
  },
  label: {
    marginBottom: 8,
    color: appColors.slate700,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: appAlphaColors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: appColors.white,
    color: appColors.ink900,
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: appColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: appColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  bottomText: {
    color: appColors.slate500,
    fontSize: 14,
  },
  linkText: {
    color: appColors.blue600,
    fontSize: 14,
    fontWeight: '700',
  },
  inlineLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingWrap: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});

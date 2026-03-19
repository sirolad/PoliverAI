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

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register, loading, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    if (name.length < 2) {
      setError(copy('auth.register.validation_name_min', 'Name must be at least 2 characters'));
      return;
    }
    if (!email.includes('@')) {
      setError(copy('auth.register.validation_email', 'Please enter a valid email'));
      return;
    }
    if (password.length < 6) {
      setError(copy('auth.register.validation_password_min', 'Password must be at least 6 characters'));
      return;
    }
    if (password !== confirmPassword) {
      setError(copy('auth.register.validation_password_match', 'Passwords do not match'));
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await register(name, email, password);
      goTo('Dashboard', '/dashboard');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(copy('auth.register.registration_failed', 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <AppTopNav currentRoute="register" />
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
      <AppTopNav currentRoute="register" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrap}>
          <View style={styles.shell}>
            <View style={styles.hero}>
              <BrandLogo width={280} height={120} style={styles.heroMarkImage} />
              <Text style={styles.heroTitle}>{copy('auth.register.join_title', 'Join PoliverAI')}</Text>
              <Text style={styles.heroSubtitle}>
                {copy('auth.register.join_subtitle', 'Create your account and start checking privacy policies')}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{copy('auth.register.create_account', 'Create your account')}</Text>
              <Text style={styles.cardDesc}>{copy('auth.register.create_account_desc', 'Get started with your free PoliverAI account')}</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>{copy('auth.register.name_label', 'Full name')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={copy('auth.register.name_placeholder', 'Enter your full name')}
                  placeholderTextColor={appColors.slate400}
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                  placeholder={copy('auth.register.password_placeholder', 'Create a password')}
                  placeholderTextColor={appColors.slate400}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{copy('auth.register.confirm_password_label', 'Confirm password')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={copy('auth.register.confirm_password_placeholder', 'Confirm your password')}
                  placeholderTextColor={appColors.slate400}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <Text style={styles.terms}>
                {copy('auth.register.terms_prefix', 'By creating an account, you agree to our')}{' '}
                <Text style={styles.linkTextInline}>{copy('auth.register.terms', 'Terms of Service')}</Text> and{' '}
                <Text style={styles.linkTextInline}>{copy('auth.register.privacy', 'Privacy Policy')}</Text>.
              </Text>

              <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={appColors.white} />
                ) : (
                  <View style={styles.primaryButtonInner}>
                    <UserPlus size={16} color={appColors.white} />
                    <Text style={styles.primaryButtonText}>{copy('auth.register.create_account_cta', 'Create account')}</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>{copy('auth.register.already_have_account', 'Already have an account?')}</Text>
                <Pressable onPress={() => goTo('Login', '/login')} style={styles.inlineLinkButton}>
                  <LogIn size={14} color={appColors.blue600} />
                  <Text style={styles.linkText}>{copy('auth.register.sign_in', 'Sign in')}</Text>
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
  terms: {
    marginTop: 14,
    color: appColors.slate500,
    fontSize: 14,
    lineHeight: 22,
  },
  linkTextInline: {
    color: appColors.blue600,
    fontWeight: '700',
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

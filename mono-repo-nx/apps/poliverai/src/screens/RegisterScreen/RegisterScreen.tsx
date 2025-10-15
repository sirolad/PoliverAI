import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth, t } from '@poliverai/intl';
import { Input, Button, Card, colors, textSizes } from '@poliverai/shared-ui';

export const RegisterScreen: React.FC = () => {
  const { register, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect logic can be handled by navigation in React Native
  // if (isAuthenticated) { navigation.replace('Dashboard'); return null; }

  const onSubmit = async () => {
    if (name.length < 2) {
      setError(t('auth.register.validation_name_min'));
      return;
    }
    if (!email.includes('@')) {
      setError(t('auth.register.validation_email'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.register.validation_password_min'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.register.validation_password_match'));
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      await register(name, email, password);
      // navigation.replace('Dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('auth.register.registration_failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary.hex} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {/* Replace with your logo asset */}
        <Text style={styles.logo}>PoliverAI</Text>
        <Text style={styles.title}>{t('auth.register.join_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.register.join_subtitle')}</Text>
      </View>
      <Card>
        <Text style={styles.cardTitle}>{t('auth.register.create_account')}</Text>
        <Text style={styles.cardDesc}>{t('auth.register.create_account_desc')}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input
          label={t('auth.register.name_label')}
          value={name}
          onChangeText={setName}
          placeholder={t('auth.register.name_placeholder')}
        />
        <Input
          label={t('auth.register.email_label')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.register.email_placeholder')}
        />
        <Input
          label={t('auth.register.password_label')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.register.password_placeholder')}
          secureTextEntry
        />
        <Input
          label={t('auth.register.confirm_password_label')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('auth.register.confirm_password_placeholder')}
          secureTextEntry
        />
        <Text style={styles.terms}>
          {t('auth.register.terms_prefix')}{' '}
          <Text style={styles.link}>{t('auth.register.terms')}</Text>{' '}and{' '}
          <Text style={styles.link}>{t('auth.register.privacy')}</Text>.
        </Text>
        <Button
          title={isSubmitting ? t('auth.register.creating_account') : t('auth.register.create_account_cta')}
          onPress={onSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>{t('auth.register.already_have_account')}{' '}</Text>
          <TouchableOpacity /* onPress={() => navigation.navigate('LoginScreen')} */>
            <Text style={styles.link}>{t('auth.register.sign_in')}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pageBg.hex,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pageBg.hex,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: textSizes.h2.size,
  fontWeight: 700,
    color: colors.primary.hex,
    marginBottom: 8,
  },
  title: {
    fontSize: textSizes.h2.size,
  fontWeight: 700,
    color: colors.textPrimary.hex,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: textSizes.sm.size,
    color: colors.textMuted.hex,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: textSizes.h3.size,
  fontWeight: 700,
    color: colors.textPrimary.hex,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: textSizes.sm.size,
    color: colors.textMuted.hex,
    marginBottom: 12,
  },
  error: {
    color: colors.danger.hex,
    fontSize: textSizes.sm.size,
    marginBottom: 8,
    textAlign: 'center',
  },
  terms: {
    fontSize: textSizes.sm.size,
    color: colors.textMuted.hex,
    marginBottom: 12,
    textAlign: 'center',
  },
  link: {
    color: colors.primary.hex,
  fontWeight: 500,
    textDecorationLine: 'underline',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signInText: {
    fontSize: textSizes.sm.size,
    color: colors.textMuted.hex,
  },
});

export default RegisterScreen;

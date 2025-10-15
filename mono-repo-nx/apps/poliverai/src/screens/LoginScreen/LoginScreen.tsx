import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@poliverai/intl';
import { t } from '@poliverai/intl';
import { colors, spacing, twFromTokens } from '@poliverai/shared-ui';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react-native';

const LoginScreen: React.FC = () => {
  const { login, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect logic (replace with navigation logic for RN)
  // if (isAuthenticated) {
  //   navigation.navigate('Dashboard');
  //   return null;
  // }

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await login(email, password);
      // navigation.navigate('Dashboard');
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary.hex} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Replace with Image component for RN logo if needed */}
        <Text style={styles.title}>{t('auth_login.welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('auth_login.welcome_subtitle')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('auth_login.sign_in_title')}</Text>
        <Text style={styles.cardDesc}>{t('auth_login.sign_in_desc')}</Text>
        {error ? (
          <View style={styles.errorRow}>
            <AlertCircle size={18} color={colors.danger.hex} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.inputRow}>
          <Mail size={18} color={colors.mutedText.hex} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputRow}>
          <Lock size={18} color={colors.mutedText.hex} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.password_placeholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <LogIn size={16} color="#fff" />
              <Text style={styles.buttonText}>{t('auth_login.sign_in_cta')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg.hex,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.pageBg.hex,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary.hex,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted.hex,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary.hex,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textMuted.hex,
    marginBottom: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg.hex,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    color: colors.danger.hex,
    marginLeft: 8,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mutedBorder.hex,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: colors.surface.hex,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: colors.textPrimary.hex,
    marginLeft: 8,
  },
  button: {
    backgroundColor: colors.primaryBg.hex,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LoginScreen;

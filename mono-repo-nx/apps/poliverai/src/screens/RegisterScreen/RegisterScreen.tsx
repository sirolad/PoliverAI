import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@poliverai/shared-ui';
import { Button } from '@poliverai/shared-ui';
import { Card } from '@poliverai/shared-ui';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@poliverai/intl';
import brandAssets from '../../../assets/brand';

export const RegisterScreen: React.FC = () => {
  const { register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
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
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return "Passwords don't match";
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
      const message = (e as { message?: string })?.message || 'Registration failed';
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
          <Text style={styles.headerTitle}>Join PoliverAI</Text>
          <Text style={styles.headerSubtitle}>Create your account and start ensuring GDPR compliance</Text>
        </View>

        <Card style={styles.cardStyle}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>Create Account</Text>
            <Text style={{ color: '#6b7280', marginBottom: 12 }}>Get started with your free PoliverAI account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input label="Full Name" placeholder="Enter your full name" value={name} onChangeText={setName} error={undefined} />
            <Input label="Email address" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={undefined} />
            <Input label="Password" placeholder="Create a password" value={password} onChangeText={setPassword} secureTextEntry error={undefined} />
            <Input label="Confirm Password" placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={undefined} />

            <Button title={isSubmitting ? 'Creating account...' : 'Create Account'} onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} />

            <View style={styles.footerText}>
              <Text style={styles.smallText}>Already have an account? Sign in</Text>
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
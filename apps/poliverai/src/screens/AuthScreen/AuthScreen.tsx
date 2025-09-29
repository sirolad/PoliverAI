import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetModalRef } from '@gorhom/bottom-sheet';
import { useAuth, AuthForm } from '@poliverai/shared-ui';
import { useTranslation } from '@poliverai/intl';

export const AuthScreen = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModalRef | null>(null);
  const snapPoints = useMemo(() => ['40%', '80%'], []);

  const { login } = useAuth();
  const { t } = useTranslation();

  const openOffers = () => bottomSheetRef.current?.present();

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Error', t('authScreen.form.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert('Error', t('authScreen.form.invalidCredentials'));
      }
      // AuthProvider will update auth state and navigate via navigator if configured
    } catch {
      Alert.alert('Error', t('authScreen.form.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheetModalProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <Text className="text-xl font-bold text-neutral-900 dark:text-white">{t('authScreen.header.title')}</Text>
          <Text className="text-sm text-neutral-600 dark:text-neutral-300">{t('authScreen.header.subtitle')}</Text>
        </View>

        {/* Toggle */}
        <View className="mx-6 mb-4 flex-row bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
          <Pressable
            className={`flex-1 items-center py-3 rounded-lg ${mode === 'login' ? 'bg-white dark:bg-neutral-700' : ''}`}
            onPress={() => setMode('login')}
          >
            <Text className={mode === 'login' ? 'text-blue-600' : 'text-neutral-400'}>{t('authScreen.toggle.signIn')}</Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center py-3 rounded-lg ${mode === 'signup' ? 'bg-white dark:bg-neutral-700' : ''}`}
            onPress={() => setMode('signup')}
          >
            <Text className={mode === 'signup' ? 'text-blue-600' : 'text-neutral-400'}>{t('authScreen.toggle.createAccount')}</Text>
          </Pressable>
        </View>

        {/* Card form (shared component) */}
        <AuthForm
          mode={mode}
          email={email}
          password={password}
          name={name}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          onChangeName={setName}
          onSubmit={submit}
          loading={loading}
          t={(p: string) => t(p)}
        />

        {/* Offers trigger */}
        <Pressable onPress={openOffers} className="mx-6 mt-6 rounded-xl py-4 items-center bg-neutral-100 dark:bg-neutral-800">
          <Text className="text-neutral-700 dark:text-neutral-200">{t('authScreen.offers.seeOffers')}</Text>
        </Pressable>

        {/* Bottom sheet modal for Plans */}
        <BottomSheetModal ref={bottomSheetRef} snapPoints={snapPoints} backgroundStyle={{ borderRadius: 24 }}>
          <View className="px-4 py-2">
            <Text className="text-lg font-semibold mb-4">{t('authScreen.offers.plansTitle')}</Text>
            {((t('authScreen.offers.plans') as unknown) as string[] || []).map((p) => (
              <View key={p} className="mb-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                <Text className="text-base font-medium">{p}</Text>
                <Text className="text-xs text-neutral-500">{t('authScreen.offers.featureText')}</Text>
              </View>
            ))}
          </View>
        </BottomSheetModal>
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
};
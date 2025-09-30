import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { PropsWithChildren } from 'react';
import type { ViewProps, TextProps, TextInputProps, PressableProps } from 'react-native';

// Lightweight typed wrappers that accept a `className` prop but forward the rest to RN components.
const V: React.FC<PropsWithChildren<ViewProps & { className?: string }>> = ({ children, ...rest }) => {
  return <View {...(rest as ViewProps)}>{children}</View>;
};
const T: React.FC<PropsWithChildren<TextProps & { className?: string }>> = ({ children, ...rest }) => {
  return <Text {...(rest as TextProps)}>{children}</Text>;
};
const TI: React.FC<TextInputProps & { className?: string }> = ({ ...rest }) => {
  return <TextInput {...(rest as TextInputProps)} />;
};
const P: React.FC<PropsWithChildren<PressableProps & { className?: string }>> = ({ children, ...rest }) => {
  return <Pressable {...(rest as PressableProps)}>{children}</Pressable>;
};

type Props = {
  mode: 'login' | 'signup';
  email: string;
  password: string;
  name?: string;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onChangeName?: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  t: (path: string) => string;
};

export const AuthForm: React.FC<Props> = ({
  mode,
  email,
  password,
  name,
  onChangeEmail,
  onChangePassword,
  onChangeName,
  onSubmit,
  loading,
  t,
}) => {
  return (
    <V className="mx-6 rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/70 p-6">
      <T className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
        {mode === 'login' ? t('authScreen.form.signIn') : t('authScreen.form.createAccount')}
      </T>
      <T className="text-neutral-600 dark:text-neutral-400 mb-6">
        {mode === 'login' ? t('authScreen.form.signIn') : t('authScreen.form.createAccount')}
      </T>

      <V className="gap-4">
        <V>
          <T className="text-sm mb-2 text-neutral-700 dark:text-neutral-300">{t('authScreen.form.emailLabel')}</T>
          <TI
            placeholder={t('authScreen.form.emailPlaceholder')}
            keyboardType="email-address"
            className="px-4 py-4 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={onChangeEmail}
            autoCapitalize="none"
          />
        </V>

        <V>
          <T className="text-sm mb-2 text-neutral-700 dark:text-neutral-300">{t('authScreen.form.passwordLabel')}</T>
          <TI
            placeholder={t('authScreen.form.passwordPlaceholder')}
            secureTextEntry
            className="px-4 py-4 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={onChangePassword}
          />
        </V>

        {mode === 'signup' && (
          <V>
            <T className="text-sm mb-2 text-neutral-700 dark:text-neutral-300">{t('authScreen.form.fullNameLabel')}</T>
            <TI
              placeholder={t('authScreen.form.fullNamePlaceholder')}
              className="px-4 py-4 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={onChangeName}
            />
          </V>
        )}

        <P onPress={onSubmit} disabled={Boolean(loading)} className="mt-2 rounded-xl py-4 items-center bg-blue-600/90 disabled:opacity-50">
          <T className="text-white font-semibold">{mode === 'login' ? t('authScreen.form.signIn') : t('authScreen.form.createAccount')}</T>
        </P>

        {mode === 'login' && (
          <P onPress={() => { /* navigate to reset */ }}>
            <T className="text-center text-sm text-blue-600 mt-2">{t('authScreen.form.forgotPassword')}</T>
          </P>
        )}
      </V>
    </V>
  );
};

export default AuthForm;

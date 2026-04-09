import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { appColors } from '@poliverai/shared-ui';
import { ApiError, transactionsService, useAuth } from '@poliverai/intl';
import AppFooter from '../components/AppFooter';
import AppTopNav from '../components/AppTopNav';
import {
  clearPendingPaymentReturn,
  getPendingPaymentReturn,
  readPaymentReturnFromWebLocation,
  savePendingPaymentReturn,
} from '../lib/pendingPaymentReturn';

type PaymentReturnRouteParams = {
  session_id?: string;
  status?: string;
};

const PAYMENT_MISMATCH_TITLE = 'Payment failed';
const PAYMENT_MISMATCH_MESSAGE =
  'This payment link does not match the signed-in account.';

export default function PaymentReturnScreen() {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<Record<string, PaymentReturnRouteParams | undefined>, string>>();
  const auth = useAuth() as unknown as {
    user?: { email?: string | null } | null;
    isAuthenticated?: boolean;
    loading?: boolean;
  };
  const { isAuthenticated = false, loading = false, user } = auth;

  React.useEffect(() => {
    const incoming = {
      session_id:
        route.params?.session_id ?? readPaymentReturnFromWebLocation()?.session_id,
      status: route.params?.status ?? readPaymentReturnFromWebLocation()?.status,
    };

    if (incoming.session_id || incoming.status) {
      savePendingPaymentReturn(incoming).catch(() => undefined);
    }
  }, [route.params?.session_id, route.params?.status]);

  React.useEffect(() => {
    if (loading) return;

    let cancelled = false;

    const goTo = (
      routeName: string,
      params?: Record<string, unknown>,
      webPath?: string
    ) => {
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        });
      } catch {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && webPath) {
          window.location.href = webPath;
        }
      }
    };

    const run = async () => {
      const pending = await getPendingPaymentReturn();
      if (cancelled) return;

      if (!pending) {
        goTo('Credits', undefined, '/credits');
        return;
      }

      if (!isAuthenticated) {
        goTo('Login', undefined, '/login');
        return;
      }

      const sessionId = pending.session_id ?? undefined;
      const status = pending.status ?? undefined;

      if (!sessionId) {
        await clearPendingPaymentReturn();
        if (cancelled) return;
        goTo('Credits', undefined, '/credits');
        return;
      }

      try {
        const response = await transactionsService.getTransaction(sessionId);
        if (cancelled) return;

        const txUserEmail = response.transaction?.user_email?.trim().toLowerCase();
        const currentUserEmail = user?.email?.trim().toLowerCase() ?? null;

        if (!txUserEmail || !currentUserEmail || txUserEmail !== currentUserEmail) {
          await clearPendingPaymentReturn();
          if (cancelled) return;
          goTo(
            'Credits',
            {
              payment_title: PAYMENT_MISMATCH_TITLE,
              payment_message: PAYMENT_MISMATCH_MESSAGE,
              payment_tone: 'danger',
              skip_payment_processing: true,
            },
            '/credits'
          );
          return;
        }

        await clearPendingPaymentReturn();
        if (cancelled) return;

        const webPath =
          status || sessionId
            ? `/credits?session_id=${encodeURIComponent(sessionId)}${
                status ? `&status=${encodeURIComponent(status)}` : ''
              }`
            : '/credits';

        goTo(
          'Credits',
          {
            session_id: sessionId,
            status,
          },
          webPath
        );
      } catch (error) {
        const apiError = error as Partial<ApiError>;
        await clearPendingPaymentReturn();
        if (cancelled) return;

        const isMismatch = apiError?.status === 403 || apiError?.status === 404;
        goTo(
          'Credits',
          {
            payment_title: PAYMENT_MISMATCH_TITLE,
            payment_message: isMismatch
              ? PAYMENT_MISMATCH_MESSAGE
              : 'The payment return could not be verified.',
            payment_tone: 'danger',
            skip_payment_processing: true,
          },
          '/credits'
        );
      }
    };

    run().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading, navigation, user?.email]);

  return (
    <View style={styles.page}>
      <AppTopNav currentRoute="credits" />
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={appColors.blue600} />
        <Text style={styles.title}>Finalizing your payment...</Text>
      </View>
      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: appColors.sky50,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    color: appColors.slate600,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

import { Platform } from 'react-native'

const FALLBACK_API_BASE = 'https://poliverai.com'
export const POLIVERAI_DEEP_LINK_SCHEME = 'poliverai://'
export const POLIVERAI_PAYMENT_RETURN_PATH = 'payments/return'

function readEnv(name: string): string | undefined {
  const processValue =
    typeof process !== 'undefined' && process.env
      ? process.env[name]
      : undefined;

  if (typeof processValue === 'string' && processValue.trim() !== '') {
    return processValue;
  }

  const globalEnv =
    typeof globalThis !== 'undefined'
      ? (globalThis as { __POLIVERAI_ENV__?: Record<string, unknown> }).__POLIVERAI_ENV__
      : undefined;
  const globalValue = globalEnv?.[name];

  return typeof globalValue === 'string' && globalValue.trim() !== ''
    ? globalValue
    : undefined;
}

export function getApiBaseOrigin(): string {
  const apiUrl = readEnv('VITE_API_BASE_URL') ?? readEnv('VITE_API_URL') ?? readEnv('API_BASE');
  if (apiUrl) return apiUrl.replace(/\/$/, '')

  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !/localhost|127\.0\.0\.1/.test(window.location.origin)
  ) {
    return window.location.origin
  }

  return FALLBACK_API_BASE
}

export function buildNativePaymentReturnUrl() {
  return `${POLIVERAI_DEEP_LINK_SCHEME}${POLIVERAI_PAYMENT_RETURN_PATH}`
}

export function buildCheckoutUrls() {
  const apiBase = getApiBaseOrigin()

  if (Platform.OS === 'web') {
    return {
      success: `${apiBase}/payments/return?status=completed`,
      cancel: `${apiBase}/credits?status=failed`,
    }
  }

  const redirectUri = encodeURIComponent(buildNativePaymentReturnUrl())
  return {
    success: `${apiBase}/api/v1/checkout/finalize?redirect_uri=${redirectUri}`,
    cancel: buildNativePaymentReturnUrl(),
  }
}

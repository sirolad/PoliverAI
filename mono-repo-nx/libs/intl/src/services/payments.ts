import { Linking, Platform } from 'react-native'
import { safeDispatch as eventSafeDispatch, safeDispatchMultiple as eventSafeDispatchMultiple } from '../lib/eventHelpers'
import { buildCheckoutUrls, getApiBaseOrigin } from '../lib/paymentsHelpers'
import { getPlatformStorage, isWebPlatform } from '../lib/platformStorage'

export const safeDispatch = eventSafeDispatch
export const safeDispatchMultiple = eventSafeDispatchMultiple

const TOKEN_KEY = '@poliverai/token'
const storage = getPlatformStorage()

type CheckoutType = 'subscription' | 'credits'

async function getStoredToken(): Promise<string | null> {
  if (isWebPlatform()) {
    try {
      return window.localStorage.getItem('token')
    } catch {
      return null
    }
  }

  try {
    return await storage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

async function createCheckoutSession(amount_usd: number, description: string, payment_type: CheckoutType) {
  const token = await getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const { success, cancel } = buildCheckoutUrls()
  const response = await fetch(`${getApiBaseOrigin()}/api/v1/create-checkout-session`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount_usd,
      description,
      payment_type,
      success_url: success,
      cancel_url: cancel,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || 'Failed to create checkout session')
  }

  return response.json() as Promise<{ url?: string; session_id?: string; id?: string }>
}

async function openCheckoutUrl(url: string) {
  if (Platform.OS === 'web') {
    window.location.href = url
    return
  }

  const canOpen = await Linking.canOpenURL(url)
  if (!canOpen) throw new Error('Unable to open Stripe checkout URL')
  await Linking.openURL(url)
}

const PaymentsService = {
  async purchaseUpgrade(amount_usd = 29) {
    const res = await createCheckoutSession(amount_usd, 'Upgrade to Pro', 'subscription')
    if (!res?.url) throw new Error('Checkout session did not return a URL')
    await openCheckoutUrl(res.url)
    return res
  },

  async purchaseCredits(amount_usd: number) {
    const res = await createCheckoutSession(amount_usd, 'Buy credits', 'credits')
    if (!res?.url) throw new Error('Checkout session did not return a URL')
    await openCheckoutUrl(res.url)
    return res
  },

  async handlePaymentReturn(params?: { status?: string | null; session_id?: string | null }) {
    const status = params?.status ?? null
    const sessionId = params?.session_id ?? null

    if (status === 'completed') {
      safeDispatch('payment:result', {
        success: true,
        title: 'Payment completed',
        message: sessionId ? `Checkout ${sessionId} was completed successfully.` : 'Your Stripe checkout completed successfully.',
      })
    } else if (status === 'failed') {
      safeDispatch('payment:result', {
        success: false,
        title: 'Payment failed',
        message: sessionId ? `Checkout ${sessionId} was not completed.` : 'The payment did not complete.',
      })
    }

    safeDispatchMultiple([{ name: 'payment:refresh-user' }, { name: 'transactions:refresh' }])
  },
};

export default PaymentsService;

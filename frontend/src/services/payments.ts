import apiService from './api'
import authService from './authService'
import { store } from '@/store/store'
import { clearPendingCheckout } from '@/store/paymentsSlice'
import { loadStripeFactory, confirmCardPaymentWithFactory } from '@/lib/stripeHelpers'
import { buildCheckoutUrls, cachePendingCheckoutFromResponse } from '@/lib/paymentsHelpers'

// Stripe dynamic load is handled by `src/lib/stripeHelpers.ts`

export interface CreateIntentResponse {
  client_secret: string
  publishable_key?: string
}

const PaymentsService = {
  async createPaymentIntent(amount_usd: number, description?: string) {
    return apiService.post<CreateIntentResponse>('/api/v1/create-payment-intent', {
      amount_usd,
      description,
    })
  },

  // For server-side credit applying (simple endpoint)
  async applyCredits(amount_usd: number) {
    return apiService.post('/api/v1/credit', { amount_usd })
  },

  // High-level helper to create a PaymentIntent and confirm it client-side
  async initiatePayment(amount_usd: number, description?: string) {
    const res = await this.createPaymentIntent(amount_usd, description)
    const publishable = res.publishable_key || (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
    const factory = await loadStripeFactory()
    if (!factory) throw new Error('Stripe.js failed to load')
    const confirm = await confirmCardPaymentWithFactory(factory, publishable, res.client_secret)

    if (confirm.error) {
      const message = confirm.error.message || 'Payment confirmation failed'
      throw new Error(message)
    }
    return confirm.paymentIntent
  },

  // Initiate upgrade flow: pay then call backend upgrade
  async purchaseUpgrade(amount_usd = 29) {
    // Create a Stripe Checkout session and redirect the user to the hosted checkout page
    const token = authService.getStoredToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  // Ensure Stripe redirects back to the same origin the app is currently running on.
  // When running behind the nginx proxy the app origin may be http://localhost:8080
  // whereas the backend default success_url is http://localhost:5173 which would
  // cause cross-origin redirects and loss of localStorage/auth context.
  // Prefer the configured API URL (VITE_API_URL) so return URLs go to the
  // proxy/backend (e.g. http://localhost:8080) even when the frontend dev
  // server is served from a different origin (e.g. http://localhost:5173).
  const { success, cancel } = buildCheckoutUrls()
  const res = await apiService.post<{ url: string }>('/api/v1/create-checkout-session', { amount_usd, description: 'Upgrade to Pro', payment_type: 'subscription', success_url: success, cancel_url: cancel }, { headers })
    if (res?.url) {
      // Cache pending session in the payments slice (store subscription persists to localStorage)
      try {
  cachePendingCheckoutFromResponse(res, amount_usd, 'subscription')
      } catch (err) {
        console.warn('Failed to cache pending checkout', err)
      }
      // Redirect browser to Stripe Checkout
      window.location.href = res.url
    }
    return res
  },

  // Initiate buy credits: pay then apply credits server-side
  async purchaseCredits(amount_usd: number) {
    const token = authService.getStoredToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const { success: successForCredits, cancel: cancelForCredits } = buildCheckoutUrls()
  const res = await apiService.post<{ url: string }>('/api/v1/create-checkout-session', { amount_usd, description: 'Buy credits', success_url: successForCredits, cancel_url: cancelForCredits }, { headers })
    if (res?.url) {
      try {
  cachePendingCheckoutFromResponse(res, amount_usd, 'credits')
      } catch (err) {
        console.warn('Failed to cache pending checkout', err)
      }
      window.location.href = res.url
    }
    return res
  },

  clearPending() {
    try {
      store.dispatch(clearPendingCheckout())
    } catch (err) {
      console.warn('Failed to clear pending checkout', err)
    }
  }
}

export default PaymentsService

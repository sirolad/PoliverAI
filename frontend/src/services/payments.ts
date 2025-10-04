import apiService from './api'
import authService from './authService'

// Dynamically load Stripe.js
async function loadStripeJs(): Promise<unknown> {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as Record<string, unknown>
  if (w.Stripe) return w.Stripe
  const script = document.createElement('script')
  script.src = 'https://js.stripe.com/v3/'
  document.head.appendChild(script)
  await new Promise<void>((resolve, reject) => {
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')))
  })
  return (window as unknown as Record<string, unknown>).Stripe
}

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
    const stripeLib = await loadStripeJs()
    if (!stripeLib) throw new Error('Stripe.js failed to load')
    // stripeLib is an external global factory; narrow and call it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = (stripeLib as any)(publishable)

    // For demo/testing use Stripe's test PaymentMethod id which doesn't require Elements
    // This avoids redirect/3DS flows in simple tests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const confirm = await (stripe as any).confirmCardPayment(res.client_secret, {
      // Use a known test PM for automatic success in test mode
      payment_method: 'pm_card_visa',
    })

    if (confirm.error) {
      // Provide a clearer Error object
      const e = confirm.error
      const message = e.message || 'Payment confirmation failed'
      throw new Error(message)
    }

    // On success, return the PaymentIntent object
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
  const apiBase = (import.meta.env.VITE_API_URL as string) || (typeof window !== 'undefined' ? window.location.origin : undefined)
  const success = apiBase ? `${apiBase}/api/v1/checkout/finalize` : undefined
  const cancel = apiBase ? `${apiBase}/` : undefined
  const res = await apiService.post<{ url: string }>('/api/v1/create-checkout-session', { amount_usd, description: 'Upgrade to Pro', payment_type: 'subscription', success_url: success, cancel_url: cancel }, { headers })
    if (res?.url) {
      // Cache pending session so we can finalize/check it when user returns
      try {
        const typed = res as unknown as { id?: string; sessionId?: string }
        const sid = typed.id || typed.sessionId || null
        const pending = { session_id: sid, type: 'subscription', amount_usd }
        localStorage.setItem('poliverai:pending_checkout', JSON.stringify(pending))
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
  const apiBase2 = (import.meta.env.VITE_API_URL as string) || (typeof window !== 'undefined' ? window.location.origin : undefined)
  const successForCredits = apiBase2 ? `${apiBase2}/api/v1/checkout/finalize` : undefined
  const cancelForCredits = apiBase2 ? `${apiBase2}/` : undefined
  const res = await apiService.post<{ url: string }>('/api/v1/create-checkout-session', { amount_usd, description: 'Buy credits', success_url: successForCredits, cancel_url: cancelForCredits }, { headers })
    if (res?.url) {
      try {
        const typed = res as unknown as { id?: string; sessionId?: string }
        const sid = typed.id || typed.sessionId || null
        const pending = { session_id: sid, type: 'credits', amount_usd }
        localStorage.setItem('poliverai:pending_checkout', JSON.stringify(pending))
      } catch (err) {
        console.warn('Failed to cache pending checkout', err)
      }
      window.location.href = res.url
    }
    return res
  },

  clearPending() {
    try {
      localStorage.removeItem('poliverai:pending_checkout')
    } catch (err) {
      console.warn('Failed to clear pending checkout', err)
    }
  }
}

export default PaymentsService

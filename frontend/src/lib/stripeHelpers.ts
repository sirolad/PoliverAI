// Thin adapter around the global Stripe factory to keep `any` usage isolated.
export type StripeConfirmResult = {
  error?: { message?: string }
  paymentIntent?: unknown
}

export async function loadStripeFactory(): Promise<((publishableKey: string) => unknown) | undefined> {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as Record<string, unknown>
  if (w.Stripe) return w.Stripe as (publishable: string) => unknown
  const script = document.createElement('script')
  script.src = 'https://js.stripe.com/v3/'
  document.head.appendChild(script)
  await new Promise<void>((resolve, reject) => {
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')))
  })
  return (window as unknown as Record<string, unknown>).Stripe as (publishable: string) => unknown
}

export type StripeFactory = (publishable: string) => StripeLike | undefined

export type StripeLike = {
  confirmCardPayment: (clientSecret: string, opts?: unknown) => Promise<StripeConfirmResult>
}

export async function confirmCardPaymentWithFactory(factory: (publishable: string) => unknown, publishableKey: string, clientSecret: string): Promise<StripeConfirmResult> {
  // Keep the implementation tolerant to unknown shapes coming from Stripe but
  // avoid using `any` so lint rules are satisfied.
  try {
  const stripeCandidate = (factory as StripeFactory)(publishableKey)
  const stripe = stripeCandidate as StripeLike | undefined
    if (!stripe || typeof stripe.confirmCardPayment !== 'function') {
      throw new Error('Stripe client does not implement confirmCardPayment')
    }
    const result = await stripe.confirmCardPayment(clientSecret, { payment_method: 'pm_card_visa' })
    return result as StripeConfirmResult
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : String(e) } }
  }
}

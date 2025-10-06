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

export async function confirmCardPaymentWithFactory(factory: (publishable: string) => unknown, publishableKey: string, clientSecret: string): Promise<StripeConfirmResult> {
  // Keep the implementation tolerant to unknown shapes coming from Stripe.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = (factory as any)(publishableKey)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (stripe as any).confirmCardPayment(clientSecret, { payment_method: 'pm_card_visa' })
    return result as StripeConfirmResult
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : String(e) } }
  }
}

export type StripeConfirmResult = {
  error?: { message?: string }
  paymentIntent?: unknown
}

// RN shim — replace with react-native-stripe integration in future
export async function loadStripeFactory(): Promise<undefined> {
  return undefined
}

export async function confirmCardPaymentWithFactory(): Promise<StripeConfirmResult> {
  return { error: { message: 'Stripe not available in RN shim' } }
}

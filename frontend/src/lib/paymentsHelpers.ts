import { store } from '@/store/store'
import { setPendingCheckout } from '@/store/paymentsSlice'

export function getApiBaseOrigin(): string | undefined {
  // If a Vite-specific environment flag signals development, prefer localhost
  // This allows the running SPA in dev to talk to a locally-running backend.
  try {
    // Avoid using `any` — cast import.meta to unknown first
    const meta = import.meta as unknown as { env?: Record<string, unknown> }
    const viteEnv = meta?.env ?? {}
    const mode = (viteEnv.MODE ?? viteEnv.VITE_ENVIRONMENT ?? viteEnv.ENVIRONMENT) as string | undefined
    const apiUrl = viteEnv.VITE_API_URL as string | undefined
    if (mode === 'development') {
      return 'http://localhost:8000'
    }
    if (apiUrl && apiUrl.trim() !== '') return apiUrl
  } catch (err) {
    // intentionally ignore — fall back to runtime values
    void err
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) return window.location.origin
  return undefined
}

export function buildCheckoutUrls() {
  const apiBase = getApiBaseOrigin()
  return {
    success: apiBase ? `${apiBase}/api/v1/checkout/finalize` : undefined,
    cancel: apiBase ? `${apiBase}/` : undefined,
  }
}

export function cachePendingCheckoutFromResponse(res: unknown, amount_usd: number, type: 'subscription' | 'credits' | string) {
  try {
    const typed = res as unknown as { id?: string; sessionId?: string }
    const sid = typed?.id || typed?.sessionId || null
    const pending = { session_id: sid, type, amount_usd }
    store.dispatch(setPendingCheckout(pending))
  } catch (err) {
    console.warn('Failed to cache pending checkout', err)
  }
}
export function buildPendingCheckoutFromResponse(res: unknown, amount_usd: number) {
  try {
    const r = res as Record<string, unknown> | null
    const rawSid = r ? (r['id'] || r['sessionId'] || r['session_id'] || null) : null
    const sid = rawSid ? String(rawSid) : null
    return { session_id: sid as string | null, type: 'credits', amount_usd }
  } catch {
    return { session_id: null, type: 'credits', amount_usd }
  }
}

export function getCreditsTotal(user?: { subscription_credits?: number; credits?: number } | null) {
  return (user?.subscription_credits ?? 0) + (user?.credits ?? 0)
}

export function normalizePaymentResult(pr: unknown) {
  try {
    const p = pr as Record<string, unknown> | null
    const status = p?.status ? String(p.status) : (p && p['success'] ? 'success' : 'failed')
    const title = p?.title ? String(p.title) : ''
    const message = p?.message ? String(p.message) : undefined
    return { status, title, message }
  } catch {
    return { status: 'failed', title: '', message: undefined }
  }
}

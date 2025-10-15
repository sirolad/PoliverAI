import { store } from './store'
import { setToken } from './authSlice'
import { setPendingCheckout, setPaymentResult } from './paymentsSlice'
import { setSelectedReport } from './uiSlice'
import { setEvents, addToLegacy } from './deletedReportsSlice'

export function bootstrapLegacyLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const t = localStorage.getItem('token')
    if (t) store.dispatch(setToken(t))
  } catch {
    /* noop */
  }
  try {
    const p = localStorage.getItem('poliverai:pending_checkout')
    if (p) {
      const parsed = JSON.parse(p)
      store.dispatch(setPendingCheckout(parsed))
    }
  } catch {
    /* noop */
  }
  try {
    const r = localStorage.getItem('poliverai:payment_result')
    if (r) {
      const parsed = JSON.parse(r)
      store.dispatch(setPaymentResult(parsed))
    }
  } catch {
    /* noop */
  }
  try {
    const s = localStorage.getItem('selected_report')
    if (s) store.dispatch(setSelectedReport(s))
  } catch { /* noop */ }
  try {
    const ev = localStorage.getItem('poliverai.deleted_report_events')
    if (ev) {
      const parsed = JSON.parse(ev)
      store.dispatch(setEvents(parsed))
    }
    const counts = localStorage.getItem('poliverai.deleted_report_counts')
    if (counts) {
      const legacy = JSON.parse(counts)
      store.dispatch(addToLegacy(legacy))
    }
  } catch { /* noop */ }
}

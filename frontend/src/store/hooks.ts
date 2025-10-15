import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'
import { useCallback } from 'react'

import { setToken, clearToken } from './authSlice'
import { setPendingCheckout, clearPendingCheckout, setPaymentResult, clearPaymentResult } from './paymentsSlice'
import type { PendingCheckout, PaymentResult } from './paymentsSlice'
import { setSelectedReport, clearSelectedReport } from './uiSlice'
import { pushEvent, addToLegacy, setEvents, computeDeletedCountsForRange } from './deletedReportsSlice'
import type { DeletedEvent } from './deletedReportsSlice'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Higher-level convenience hooks to reduce page boilerplate
export function useAuth() {
	const dispatch = useAppDispatch()
	const token = useAppSelector((s) => s.auth.token)
	const set = useCallback((t: string | null) => dispatch(setToken(t)), [dispatch])
	const clear = useCallback(() => dispatch(clearToken()), [dispatch])
	return { token, setToken: set, clearToken: clear }
}

export function usePayments() {
	const dispatch = useAppDispatch()
	const pending = useAppSelector((s) => s.payments.pendingCheckout)
	const result = useAppSelector((s) => s.payments.paymentResult)
		const setPending = useCallback((p: PendingCheckout) => dispatch(setPendingCheckout(p)), [dispatch])
	const clearPending = useCallback(() => dispatch(clearPendingCheckout()), [dispatch])
		const setResult = useCallback((r: PaymentResult) => dispatch(setPaymentResult(r)), [dispatch])
	const clearResult = useCallback(() => dispatch(clearPaymentResult()), [dispatch])
	return { pendingCheckout: pending, paymentResult: result, setPendingCheckout: setPending, clearPendingCheckout: clearPending, setPaymentResult: setResult, clearPaymentResult: clearResult }
}

export function useUI() {
	const dispatch = useAppDispatch()
	const selectedReport = useAppSelector((s) => s.ui.selectedReport)
	const setSelected = useCallback((id: string | null) => dispatch(setSelectedReport(id)), [dispatch])
	const clearSelected = useCallback(() => dispatch(clearSelectedReport()), [dispatch])
	return { selectedReport, setSelectedReport: setSelected, clearSelectedReport: clearSelected }
}

export function useDeletedReports() {
	const dispatch = useAppDispatch()
	const events = useAppSelector((s) => s.deletedReports.events)
	const legacy = useAppSelector((s) => s.deletedReports.legacyCounts)
	const push = useCallback((e: DeletedEvent) => dispatch(pushEvent(e)), [dispatch])
	const addLegacy = useCallback((c: { full?: number; revision?: number; free?: number }) => dispatch(addToLegacy(c)), [dispatch])
	const setAll = useCallback((arr: DeletedEvent[]) => dispatch(setEvents(arr)), [dispatch])
	const computeCountsForRange = useCallback((range: { from: string | null; to: string | null }) => computeDeletedCountsForRange(events, legacy, range), [events, legacy])
	return { events, legacyCounts: legacy, pushEvent: push, addToLegacy: addLegacy, setEvents: setAll, computeCountsForRange }
}

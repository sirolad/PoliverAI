import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type PendingCheckout = { session_id: string | null; type?: string; amount_usd?: number } | null
export type PaymentResult = { success: boolean; title?: string; message?: string; status?: string; amount_usd?: number } | null

type PaymentsState = {
  pendingCheckout: PendingCheckout
  paymentResult: PaymentResult
}

const initialState: PaymentsState = { pendingCheckout: null, paymentResult: null }

const slice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setPendingCheckout(state, action: PayloadAction<PendingCheckout>) {
      state.pendingCheckout = action.payload
    },
    clearPendingCheckout(state) {
      state.pendingCheckout = null
    },
    setPaymentResult(state, action: PayloadAction<PaymentResult>) {
      state.paymentResult = action.payload
    },
    clearPaymentResult(state) {
      state.paymentResult = null
    }
  }
})

export const { setPendingCheckout, clearPendingCheckout, setPaymentResult, clearPaymentResult } = slice.actions
export default slice.reducer

